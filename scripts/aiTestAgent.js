#!/usr/bin/env node

/**
 * aiTestAgent.js
 *
 * AI-driven testing artifact parser with mutation testing support.
 *
 * What it does:
 * 1. Runs Stryker mutation testing (or reads an existing mutation report)
 * 2. Checks mutation score against a configurable threshold (default: 90%)
 * 3. Reads Jest output from a text file (optional)
 * 4. Reads coverage/coverage-summary.json
 * 5. Extracts failed tests, stack traces, low-coverage files, and survived mutants
 * 6. Calls OpenAI API (if OPENAI_API_KEY is set) for AI-powered diagnostics
 * 7. Generates ai-testing-report.md
 * 8. Exits with code 1 if mutation score is below threshold
 *
 * Usage:
 *   node aiTestAgent.js
 *   node aiTestAgent.js --jest=jest-output.txt --coverage=coverage/coverage-summary.json \
 *     --mutation=reports/mutation/mutation.json --mutationThreshold=90 --out=ai-testing-report.md
 *   node aiTestAgent.js --skipMutationRun  # skip running stryker, read existing report
 *
 * Suggested workflow:
 *   npm test -- --coverage > jest-output.txt 2>&1
 *   node aiTestAgent.js
 *
 * Environment variables:
 *   OPENAI_API_KEY  - If set, the agent calls the OpenAI Chat API to generate
 *                     targeted diagnostics for survived mutants.  This is justified
 *                     because survived mutants encode precise information about which
 *                     code logic is untested; an LLM can translate that into specific,
 *                     actionable test-case suggestions far more effectively than
 *                     static pattern matching.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");

const DEFAULTS = {
  jest: "jest-output.txt",
  coverage: path.join("coverage", "coverage-summary.json"),
  mutation: path.join("reports", "mutation", "mutation.json"),
  out: "ai-testing-report.md",
  branchThreshold: 80,
  lineThreshold: 80,
  functionThreshold: 80,
  statementThreshold: 80,
  mutationThreshold: 90,
  skipMutationRun: false,
  openaiModel: "gpt-4o-mini",
};

function parseArgs(argv) {
  const config = { ...DEFAULTS };

  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--jest=")) config.jest = arg.split("=")[1];
    else if (arg.startsWith("--coverage=")) config.coverage = arg.split("=")[1];
    else if (arg.startsWith("--mutation=")) config.mutation = arg.split("=")[1];
    else if (arg.startsWith("--out=")) config.out = arg.split("=")[1];
    else if (arg.startsWith("--branchThreshold=")) config.branchThreshold = Number(arg.split("=")[1]);
    else if (arg.startsWith("--lineThreshold=")) config.lineThreshold = Number(arg.split("=")[1]);
    else if (arg.startsWith("--functionThreshold=")) config.functionThreshold = Number(arg.split("=")[1]);
    else if (arg.startsWith("--statementThreshold=")) config.statementThreshold = Number(arg.split("=")[1]);
    else if (arg.startsWith("--mutationThreshold=")) config.mutationThreshold = Number(arg.split("=")[1]);
    else if (arg === "--skipMutationRun") config.skipMutationRun = true;
    else if (arg.startsWith("--openaiModel=")) config.openaiModel = arg.split("=")[1];
  }

  return config;
}

function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function normalizePath(p) {
  return p ? p.replace(/\\/g, "/") : p;
}

function extractStackFileRefs(text) {
  if (!text) return [];

  const refs = new Set();

  const patterns = [
    /at .*?\(?((?:[A-Za-z]:)?[^():\n]+?\.(?:js|jsx|ts|tsx)):(\d+):(\d+)\)?/g,
    /((?:[A-Za-z]:)?[^():\n]+?\.(?:js|jsx|ts|tsx)):(\d+):(\d+)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      refs.add(`${normalizePath(match[1])}:${match[2]}:${match[3]}`);
    }
  }

  return Array.from(refs);
}

function parseJestOutput(jestText) {
  if (!jestText) {
    return {
      suitesFailed: 0,
      testsFailed: 0,
      failingTests: [],
      rawSummary: null,
    };
  }

  const failingTests = [];
  const lines = jestText.split(/\r?\n/);

  let currentSuite = null;
  let currentFailure = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const suiteMatch = line.match(/^FAIL\s+(.+)$/);
    if (suiteMatch) {
      currentSuite = suiteMatch[1].trim();
      continue;
    }

    // Jest failure bullet, e.g.
    // ● authController unit tests › Login controllers › testController › should hit catch branch
    const failCaseMatch = line.match(/^\s*●\s+(.+)$/);
    if (failCaseMatch) {
      if (currentFailure) failingTests.push(currentFailure);

      currentFailure = {
        suite: currentSuite,
        name: failCaseMatch[1].trim(),
        messageLines: [],
        stackRefs: [],
      };
      continue;
    }

    if (currentFailure) {
      // Stop current failure block when next suite starts
      if (/^FAIL\s+/.test(line)) {
        currentFailure.stackRefs = extractStackFileRefs(currentFailure.messageLines.join("\n"));
        failingTests.push(currentFailure);
        currentFailure = null;
        currentSuite = line.replace(/^FAIL\s+/, "").trim();
        continue;
      }

      currentFailure.messageLines.push(line);
    }
  }

  if (currentFailure) {
    currentFailure.stackRefs = extractStackFileRefs(currentFailure.messageLines.join("\n"));
    failingTests.push(currentFailure);
  }

  // Parse summary counts if present
  let suitesFailed = 0;
  let testsFailed = failingTests.length;

  const suiteSummaryMatch = jestText.match(/Test Suites:\s+(\d+)\s+failed/i);
  if (suiteSummaryMatch) suitesFailed = Number(suiteSummaryMatch[1]);

  const testsSummaryMatch = jestText.match(/Tests:\s+(\d+)\s+failed/i);
  if (testsSummaryMatch) testsFailed = Number(testsSummaryMatch[1]);

  const rawSummary = (() => {
    const summaryLines = lines.filter((l) =>
      /^(Test Suites:|Tests:|Snapshots:|Time:)/.test(l.trim())
    );
    return summaryLines.length ? summaryLines.join("\n") : null;
  })();

  return {
    suitesFailed,
    testsFailed,
    failingTests,
    rawSummary,
  };
}

function parseCoverage(coverageJson, thresholds) {
  if (!coverageJson) {
    return {
      total: null,
      lowCoverageFiles: [],
      allFiles: [],
    };
  }

  const entries = Object.entries(coverageJson)
    .filter(([key]) => key !== "total")
    .map(([file, data]) => ({
      file: normalizePath(file),
      linesPct: data.lines?.pct ?? 0,
      statementsPct: data.statements?.pct ?? 0,
      functionsPct: data.functions?.pct ?? 0,
      branchesPct: data.branches?.pct ?? 0,
      linesCovered: data.lines?.covered ?? 0,
      linesTotal: data.lines?.total ?? 0,
      statementsCovered: data.statements?.covered ?? 0,
      statementsTotal: data.statements?.total ?? 0,
      functionsCovered: data.functions?.covered ?? 0,
      functionsTotal: data.functions?.total ?? 0,
      branchesCovered: data.branches?.covered ?? 0,
      branchesTotal: data.branches?.total ?? 0,
    }));

  const lowCoverageFiles = entries
    .filter(
      (f) =>
        f.linesPct < thresholds.lineThreshold ||
        f.statementsPct < thresholds.statementThreshold ||
        f.functionsPct < thresholds.functionThreshold ||
        f.branchesPct < thresholds.branchThreshold
    )
    .map((f) => {
      const reasons = [];
      if (f.linesPct < thresholds.lineThreshold) reasons.push(`lines ${f.linesPct}%`);
      if (f.statementsPct < thresholds.statementThreshold) reasons.push(`statements ${f.statementsPct}%`);
      if (f.functionsPct < thresholds.functionThreshold) reasons.push(`functions ${f.functionsPct}%`);
      if (f.branchesPct < thresholds.branchThreshold) reasons.push(`branches ${f.branchesPct}%`);

      const severityScore =
        (thresholds.lineThreshold - f.linesPct) +
        (thresholds.statementThreshold - f.statementsPct) +
        (thresholds.functionThreshold - f.functionsPct) +
        (thresholds.branchThreshold - f.branchesPct);

      return {
        ...f,
        reasons,
        severityScore,
      };
    })
    .sort((a, b) => b.severityScore - a.severityScore);

  const total = coverageJson.total
    ? {
        linesPct: coverageJson.total.lines?.pct ?? 0,
        statementsPct: coverageJson.total.statements?.pct ?? 0,
        functionsPct: coverageJson.total.functions?.pct ?? 0,
        branchesPct: coverageJson.total.branches?.pct ?? 0,
      }
    : null;

  return {
    total,
    lowCoverageFiles,
    allFiles: entries,
  };
}

function guessRecommendations({ failingTests, lowCoverageFiles, mutationData, mutationThreshold }) {
  const threshold = mutationThreshold ?? DEFAULTS.mutationThreshold;
  const recs = [];

  if (failingTests.length > 0) {
    recs.push(
      "Prioritize failing test files first, because unresolved failures make coverage improvements less meaningful."
    );
  }

  const hasMockIssue = failingTests.some((t) =>
    /mock|spy|jest\.fn|not a function|real mongodb|database|axios|jwt/i.test(
      `${t.name}\n${t.messageLines.join("\n")}`
    )
  );
  if (hasMockIssue) {
    recs.push(
      "Some failures appear related to dependency mocking or unintended integration calls. Review imports and ensure external dependencies are mocked consistently."
    );
  }

  const hasAsyncIssue = failingTests.some((t) =>
    /timeout|async|await|promise|done callback/i.test(`${t.name}\n${t.messageLines.join("\n")}`)
  );
  if (hasAsyncIssue) {
    recs.push(
      "There are signs of async test instability. Review missing awaits, unresolved promises, and test cleanup."
    );
  }

  const lowBranchFiles = lowCoverageFiles.filter((f) => f.branchesPct < 80);
  if (lowBranchFiles.length > 0) {
    recs.push(
      "Focus next test additions on conditional branches and error-handling paths, especially validation failures, catch blocks, and unauthorized states."
    );
  }

  if (mutationData && mutationData.score < threshold) {
    recs.push(
      `Mutation score is ${mutationData.score.toFixed(2)}% (below the ${threshold}% threshold). ` +
      `${mutationData.survived} mutant(s) survived. Add tests that explicitly assert on boundary ` +
      `values, operator variants (e.g. > vs >=), and logical inversions to eliminate surviving mutants.`
    );
  }

  if (mutationData && mutationData.noCoverage > 0) {
    recs.push(
      `${mutationData.noCoverage} mutant(s) had no test coverage at all. ` +
      `Ensure all source files are imported in at least one test suite.`
    );
  }

  if (lowCoverageFiles.length === 0 && failingTests.length === 0 && (!mutationData || mutationData.score >= threshold)) {
    recs.push("No immediate issues detected from the provided artifacts.");
  }

  return recs;
}

// ─── Mutation testing ────────────────────────────────────────────────────────

/**
 * Run Stryker mutation testing via the CLI and return its exit code.
 * Stryker writes its JSON report to the path configured in stryker.config.mjs.
 */
function runStryker() {
  console.log("[mutation] Running Stryker mutation testing…");
  try {
    execSync("npx stryker run", {
      stdio: "inherit",
      env: { ...process.env, FORCE_COLOR: "0" },
    });
    return 0;
  } catch (err) {
    // Stryker exits non-zero when break threshold is breached or on error.
    // We handle the threshold check ourselves, so we tolerate non-zero here.
    return err.status ?? 1;
  }
}

/**
 * Parse the Stryker JSON report and return structured mutation data.
 * Stryker mutation.json schema (v8): { schemaVersion, projectRoot, files, testFiles, thresholds, config }
 * Each file entry has a `mutants` array where each mutant has:
 *   id, mutatorName, replacement, location, status (Killed|Survived|NoCoverage|Timeout|Ignored|CompileError)
 */
function parseMutationReport(mutationJsonPath) {
  const json = safeReadJson(mutationJsonPath);
  if (!json) {
    return null;
  }

  const allMutants = [];

  // Stryker v8 wraps mutants inside each file entry
  const files = json.files || {};
  for (const [filePath, fileData] of Object.entries(files)) {
    for (const mutant of fileData.mutants || []) {
      allMutants.push({
        id: mutant.id,
        file: normalizePath(filePath),
        mutatorName: mutant.mutatorName,
        replacement: mutant.replacement,
        original: mutant.original,
        location: mutant.location,
        status: mutant.status,
        statusReason: mutant.statusReason,
        description: mutant.description,
      });
    }
  }

  const killed = allMutants.filter((m) => m.status === "Killed" || m.status === "Timeout").length;
  const survived = allMutants.filter((m) => m.status === "Survived").length;
  const noCoverage = allMutants.filter((m) => m.status === "NoCoverage").length;
  const ignored = allMutants.filter((m) => m.status === "Ignored" || m.status === "CompileError").length;
  const total = allMutants.length;
  const tested = killed + survived + noCoverage;

  // Mutation score = killed / (killed + survived + noCoverage) * 100
  const score = tested > 0 ? (killed / tested) * 100 : 0;

  const survivedMutants = allMutants.filter((m) => m.status === "Survived");
  const noCoverageMutants = allMutants.filter((m) => m.status === "NoCoverage");

  // Group survived mutants by file for easier reading
  const survivedByFile = {};
  for (const m of survivedMutants) {
    if (!survivedByFile[m.file]) survivedByFile[m.file] = [];
    survivedByFile[m.file].push(m);
  }

  return {
    score,
    total,
    killed,
    survived,
    noCoverage,
    ignored,
    tested,
    survivedMutants,
    noCoverageMutants,
    survivedByFile,
    schemaVersion: json.schemaVersion,
  };
}

// ─── OpenAI API integration ──────────────────────────────────────────────────

/**
 * Call the OpenAI Chat Completions API with a prompt about survived mutants.
 *
 * WHY AN EXTERNAL API?
 * Survived mutants encode specific, fine-grained information about which code
 * logic is not adequately tested (e.g. "the condition `x > 0` was mutated to
 * `x >= 0` and no test caught the difference"). A static rule-based system
 * cannot turn that information into specific, actionable test-case suggestions.
 * An LLM, however, can reason about the semantic meaning of each mutation and
 * suggest exactly which assertion or input value would catch it, making the
 * diagnostic output substantially more useful to developers.
 *
 * @param {Array} survivedMutants - list of survived mutant objects
 * @param {string} model - OpenAI model name
 * @returns {Promise<string>} AI-generated diagnostic text
 */
async function callOpenAI(survivedMutants, model) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const sample = survivedMutants.slice(0, 30); // keep prompt manageable

  const mutantDescriptions = sample
    .map((m, i) => {
      const loc = m.location
        ? `${m.file}:${m.location.start?.line ?? "?"}`
        : m.file;
      return (
        `${i + 1}. [${m.mutatorName}] ${loc}\n` +
        `   Original : ${String(m.original ?? "").trim() || "(not available)"}\n` +
        `   Mutant   : ${String(m.replacement ?? "").trim() || "(not available)"}`
      );
    })
    .join("\n");

  const prompt =
    `You are a software-testing expert. The following ${sample.length} mutation(s) survived ` +
    `(i.e. no test detected the code change). For each survived mutant, briefly explain ` +
    `WHY no existing test caught it and suggest ONE specific test case (input values and ` +
    `expected assertion) that would kill it. Be concise – one short paragraph per mutant.\n\n` +
    mutantDescriptions;

  const requestBody = JSON.stringify({
    model,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1500,
    temperature: 0.3,
  });

  return new Promise((resolve) => {
    const options = {
      hostname: "api.openai.com",
      path: "/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Length": Buffer.byteLength(requestBody),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            console.warn(`[openai] API error: ${parsed.error.message}`);
            resolve(null);
            return;
          }
          resolve(parsed.choices?.[0]?.message?.content ?? null);
        } catch {
          console.warn("[openai] Failed to parse API response");
          resolve(null);
        }
      });
    });

    req.on("error", (err) => {
      console.warn(`[openai] Request failed: ${err.message}`);
      resolve(null);
    });

    req.setTimeout(30000, () => {
      console.warn("[openai] Request timed out");
      req.destroy();
      resolve(null);
    });

    req.write(requestBody);
    req.end();
  });
}

// ─── Report formatting ───────────────────────────────────────────────────────

function formatMutationSection(mutationData, aiDiagnostics, mutationThreshold) {
  const threshold = mutationThreshold ?? DEFAULTS.mutationThreshold;
  const lines = [];

  lines.push("## 2. Mutation Testing Results");
  lines.push("");

  if (!mutationData) {
    lines.push("No mutation report found. Run Stryker first or provide `--mutation=<path>`.");
    lines.push("");
    return lines.join("\n");
  }

  const pass = mutationData.score >= threshold;
  const statusBadge = pass ? "✅ PASS" : "❌ FAIL";

  lines.push(`**Status: ${statusBadge}**`);
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Mutation Score | **${mutationData.score.toFixed(2)}%** (threshold: ${threshold}%) |`);
  lines.push(`| Total Mutants | ${mutationData.total} |`);
  lines.push(`| Killed / Timeout | ${mutationData.killed} |`);
  lines.push(`| Survived | ${mutationData.survived} |`);
  lines.push(`| No Coverage | ${mutationData.noCoverage} |`);
  lines.push(`| Ignored / Compile Error | ${mutationData.ignored} |`);
  lines.push("");

  if (!pass) {
    lines.push("### ⚠️ Threshold Not Met");
    lines.push("");
    lines.push(
      `The mutation score of **${mutationData.score.toFixed(2)}%** is below the required **${threshold}%** threshold. ` +
      `${mutationData.survived} mutant(s) survived and ${mutationData.noCoverage} had no test coverage.`
    );
    lines.push("");
  }

  if (mutationData.survivedMutants.length > 0) {
    lines.push("### Survived Mutants");
    lines.push("");
    lines.push("These mutations were **not caught** by any test:");
    lines.push("");

    for (const [file, mutants] of Object.entries(mutationData.survivedByFile)) {
      lines.push(`#### ${file}`);
      lines.push("");
      for (const m of mutants) {
        const line = m.location?.start?.line ?? "?";
        const col = m.location?.start?.column ?? "?";
        lines.push(`- **[${m.mutatorName}]** line ${line}:${col}`);
        if (m.original !== undefined && m.original !== null) {
          lines.push(`  - Original : \`${String(m.original).trim()}\``);
        }
        if (m.replacement !== undefined && m.replacement !== null) {
          lines.push(`  - Mutant   : \`${String(m.replacement).trim()}\``);
        }
      }
      lines.push("");
    }
  }

  if (mutationData.noCoverageMutants.length > 0) {
    lines.push("### No-Coverage Mutants (lines never executed by any test)");
    lines.push("");
    const byFile = {};
    for (const m of mutationData.noCoverageMutants) {
      if (!byFile[m.file]) byFile[m.file] = [];
      byFile[m.file].push(m);
    }
    for (const [file, mutants] of Object.entries(byFile)) {
      lines.push(`- **${file}**: ${mutants.length} mutant(s) at lines ` +
        mutants.map((m) => m.location?.start?.line ?? "?").join(", "));
    }
    lines.push("");
  }

  if (aiDiagnostics) {
    lines.push("### 🤖 AI-Generated Diagnostics (OpenAI)");
    lines.push("");
    lines.push("> *The following analysis was generated by the OpenAI API, which was called because*");
    lines.push("> *survived mutants encode fine-grained semantic information about testing gaps that*");
    lines.push("> *cannot be effectively translated into actionable suggestions by static rules alone.*");
    lines.push("");
    lines.push(aiDiagnostics);
    lines.push("");
  }

  return lines.join("\n");
}

function formatMarkdownReport({ config, jestData, coverageData, mutationData, aiDiagnostics }) {
  const now = new Date().toISOString();

  const recommendations = guessRecommendations({
    failingTests: jestData.failingTests,
    lowCoverageFiles: coverageData.lowCoverageFiles,
    mutationData,
    mutationThreshold: config.mutationThreshold,
  });

  const lines = [];

  lines.push("# AI Testing Report");
  lines.push("");
  lines.push(`Generated at: ${now}`);
  lines.push("");

  // ── 1. Summary ──
  lines.push("## 1. Summary");
  lines.push("");
  lines.push(`- Failed test suites: ${jestData.suitesFailed}`);
  lines.push(`- Failed tests: ${jestData.testsFailed}`);
  lines.push(`- Low coverage files: ${coverageData.lowCoverageFiles.length}`);
  if (coverageData.total) {
    lines.push(
      `- Total coverage: lines ${coverageData.total.linesPct}%, statements ${coverageData.total.statementsPct}%, functions ${coverageData.total.functionsPct}%, branches ${coverageData.total.branchesPct}%`
    );
  }
  if (mutationData) {
    const status = mutationData.score >= config.mutationThreshold ? "✅ PASS" : "❌ FAIL";
    lines.push(
      `- Mutation score: ${mutationData.score.toFixed(2)}% ${status} ` +
      `(killed: ${mutationData.killed}, survived: ${mutationData.survived}, no coverage: ${mutationData.noCoverage})`
    );
  } else {
    lines.push("- Mutation score: not available");
  }
  lines.push("");

  if (jestData.rawSummary) {
    lines.push("### Raw Jest Summary");
    lines.push("");
    lines.push("```text");
    lines.push(jestData.rawSummary);
    lines.push("```");
    lines.push("");
  }

  // ── 2. Mutation Testing ──
  lines.push(formatMutationSection(mutationData, aiDiagnostics, config.mutationThreshold));

  // ── 3. Failing Tests ──
  lines.push("## 3. Failing Tests");
  lines.push("");

  if (jestData.failingTests.length === 0) {
    lines.push("No failing tests were detected from the provided Jest output.");
    lines.push("");
  } else {
    jestData.failingTests.forEach((test, index) => {
      lines.push(`### ${index + 1}. ${test.name}`);
      lines.push("");
      lines.push(`- Suite: ${test.suite || "Unknown"}`);

      if (test.stackRefs.length > 0) {
        lines.push(`- Referenced files:`);
        test.stackRefs.slice(0, 8).forEach((ref) => lines.push(`  - ${ref}`));
      } else {
        lines.push(`- Referenced files: none extracted`);
      }

      const trimmedMessage = test.messageLines
        .join("\n")
        .trim()
        .split("\n")
        .slice(0, 20)
        .join("\n");

      if (trimmedMessage) {
        lines.push("");
        lines.push("```text");
        lines.push(trimmedMessage);
        lines.push("```");
      }
      lines.push("");
    });
  }

  // ── 4. Low Coverage Files ──
  lines.push("## 4. Low Coverage Files");
  lines.push("");

  if (coverageData.lowCoverageFiles.length === 0) {
    lines.push("No low-coverage files detected under the configured thresholds.");
    lines.push("");
  } else {
    coverageData.lowCoverageFiles.forEach((file, index) => {
      lines.push(`### ${index + 1}. ${file.file}`);
      lines.push("");
      lines.push(`- Triggered thresholds: ${file.reasons.join(", ")}`);
      lines.push(`- Lines: ${file.linesPct}% (${file.linesCovered}/${file.linesTotal})`);
      lines.push(`- Statements: ${file.statementsPct}% (${file.statementsCovered}/${file.statementsTotal})`);
      lines.push(`- Functions: ${file.functionsPct}% (${file.functionsCovered}/${file.functionsTotal})`);
      lines.push(`- Branches: ${file.branchesPct}% (${file.branchesCovered}/${file.branchesTotal})`);
      lines.push("");
    });
  }

  // ── 5. Recommended Next Actions ──
  lines.push("## 5. Recommended Next Actions");
  lines.push("");
  if (recommendations.length === 0) {
    lines.push("- No recommendations generated.");
  } else {
    recommendations.forEach((r) => lines.push(`- ${r}`));
  }
  lines.push("");

  // ── 6. Suggested Follow-Up Test Targets ──
  lines.push("## 6. Suggested Follow-Up Test Targets");
  lines.push("");
  if (coverageData.lowCoverageFiles.length === 0) {
    lines.push("- No obvious follow-up targets from coverage artifacts.");
    lines.push("");
  } else {
    coverageData.lowCoverageFiles.slice(0, 5).forEach((file) => {
      lines.push(`### ${file.file}`);
      lines.push("");
      lines.push("- Add tests for validation failures and edge inputs.");
      lines.push("- Add tests for catch/error branches by mocking dependency failures.");
      lines.push("- Add tests for alternate conditional states and unauthorized paths where applicable.");
      lines.push("");
    });
  }

  // ── 7. Configuration ──
  lines.push("## 7. Configuration");
  lines.push("");
  lines.push("```json");
  lines.push(
    JSON.stringify(
      {
        jest: config.jest,
        coverage: config.coverage,
        mutation: config.mutation,
        out: config.out,
        mutationThreshold: config.mutationThreshold,
        branchThreshold: config.branchThreshold,
        lineThreshold: config.lineThreshold,
        functionThreshold: config.functionThreshold,
        statementThreshold: config.statementThreshold,
        skipMutationRun: config.skipMutationRun,
        openaiModel: config.openaiModel,
        openaiEnabled: !!process.env.OPENAI_API_KEY,
      },
      null,
      2
    )
  );
  lines.push("```");
  lines.push("");

  return lines.join("\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const config = parseArgs(process.argv);

  // ── Step 1: Run Stryker (unless skipped) ──
  if (!config.skipMutationRun) {
    runStryker();
  } else {
    console.log("[mutation] Skipping Stryker run (--skipMutationRun). Reading existing report.");
  }

  // ── Step 2: Parse mutation report ──
  const mutationData = parseMutationReport(config.mutation);
  if (!mutationData) {
    console.warn(`[mutation] Warning: mutation report not found at ${config.mutation}`);
  } else {
    const pass = mutationData.score >= config.mutationThreshold;
    const badge = pass ? "PASS" : "FAIL";
    console.log(
      `[mutation] Score: ${mutationData.score.toFixed(2)}% | Threshold: ${config.mutationThreshold}% | ` +
      `Killed: ${mutationData.killed} | Survived: ${mutationData.survived} | ` +
      `No Coverage: ${mutationData.noCoverage} | Status: ${badge}`
    );
    if (!pass) {
      console.log(
        `[mutation] ❌ FAIL — mutation score ${mutationData.score.toFixed(2)}% is below ` +
        `the required ${config.mutationThreshold}%.`
      );
      if (mutationData.survived > 0) {
        console.log(`[mutation] Survived mutants by file:`);
        for (const [file, mutants] of Object.entries(mutationData.survivedByFile)) {
          console.log(`  ${file}: ${mutants.length} survived`);
          for (const m of mutants) {
            const line = m.location?.start?.line ?? "?";
            console.log(`    - [${m.mutatorName}] line ${line}: ${String(m.replacement ?? "").trim()}`);
          }
        }
      }
    }
  }

  // ── Step 3: Call OpenAI for AI diagnostics on survived mutants ──
  let aiDiagnostics = null;
  if (mutationData && mutationData.survivedMutants.length > 0 && process.env.OPENAI_API_KEY) {
    console.log("[openai] Calling OpenAI API to generate diagnostics for survived mutants…");
    aiDiagnostics = await callOpenAI(mutationData.survivedMutants, config.openaiModel);
    if (aiDiagnostics) {
      console.log("[openai] Diagnostics received.");
    }
  }

  // ── Step 4: Parse Jest output and coverage ──
  const jestText = safeRead(config.jest);
  const coverageJson = safeReadJson(config.coverage);

  const jestData = parseJestOutput(jestText);
  const coverageData = parseCoverage(coverageJson, {
    branchThreshold: config.branchThreshold,
    lineThreshold: config.lineThreshold,
    functionThreshold: config.functionThreshold,
    statementThreshold: config.statementThreshold,
  });

  // ── Step 5: Generate report ──
  const report = formatMarkdownReport({
    config,
    jestData,
    coverageData,
    mutationData,
    aiDiagnostics,
  });

  fs.writeFileSync(config.out, report, "utf8");

  console.log(`[report] AI testing report written to ${config.out}`);
  if (!jestText) console.log(`[report] Warning: Jest output file not found at ${config.jest}`);
  if (!coverageJson) console.log(`[report] Warning: Coverage summary not found at ${config.coverage}`);

  // ── Step 6: Exit non-zero if mutation threshold not met ──
  if (mutationData && mutationData.score < config.mutationThreshold) {
    console.error(
      `\n❌ Mutation testing FAILED: score ${mutationData.score.toFixed(2)}% < threshold ${config.mutationThreshold}%.\n` +
      `   See ${config.out} for full diagnostics.`
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
