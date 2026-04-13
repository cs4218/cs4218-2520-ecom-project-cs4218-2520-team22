#!/usr/bin/env node

// Song Yichao, A0255686M

/**
 * AI Test Agent (non-mutation version)
 *
 * What it does:
 * 1. Reads Jest output text
 * 2. Reads coverage summary JSON
 * 3. Optionally reads lcov.info for exact uncovered lines
 * 4. Extracts failing tests, stack refs, low coverage files, uncovered lines
 * 5. Reads source snippets for the most relevant files
 * 6. Calls Google Gemini API for AI-powered analysis
 * 7. Generates ai-testing-report.md
 *
 * Example usage:
 *   node scripts/aiTestAgent.js \
 *     --jest=jest-backend-output.txt \
 *     --coverage=coverage/coverage-summary.json \
 *     --lcov=coverage/lcov.info \
 *     --out=ai-testing-report.md
 *
 * Environment variables:
 *   GEMINI_API_KEY   required for AI analysis
 *   GEMINI_MODEL     optional, default: gemini-2.5-flash
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const https = require("https");

const DEFAULTS = {
  jest: "jest-output.txt",
  coverage: path.join("coverage", "coverage-summary.json"),
  lcov: path.join("coverage", "lcov.info"),
  out: "ai-testing-report.md",
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  lineThreshold: 80,
  statementThreshold: 80,
  functionThreshold: 80,
  branchThreshold: 80,
  maxFailingTestsForPrompt: 8,
  maxCoverageFilesForPrompt: 5,
  snippetContextRadius: 4,
  maxSnippetLines: 20,
};

function parseArgs(argv) {
  const config = { ...DEFAULTS };

  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--jest=")) config.jest = arg.split("=")[1];
    else if (arg.startsWith("--coverage=")) config.coverage = arg.split("=")[1];
    else if (arg.startsWith("--lcov=")) config.lcov = arg.split("=")[1];
    else if (arg.startsWith("--out=")) config.out = arg.split("=")[1];
    else if (arg.startsWith("--model=")) config.model = arg.split("=")[1];
    else if (arg.startsWith("--lineThreshold=")) config.lineThreshold = Number(arg.split("=")[1]);
    else if (arg.startsWith("--statementThreshold=")) config.statementThreshold = Number(arg.split("=")[1]);
    else if (arg.startsWith("--functionThreshold=")) config.functionThreshold = Number(arg.split("=")[1]);
    else if (arg.startsWith("--branchThreshold=")) config.branchThreshold = Number(arg.split("=")[1]);
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

function exists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function normalizePath(p) {
  return p ? p.replace(/\\/g, "/") : p;
}

function fileExistsCaseInsensitive(filePath) {
  if (exists(filePath)) return filePath;

  const normalized = normalizePath(filePath);
  const cwd = process.cwd();
  const relative = normalized.startsWith(normalizePath(cwd) + "/")
    ? normalized.slice(normalizePath(cwd).length + 1)
    : normalized;

  const parts = relative.split("/").filter(Boolean);
  let current = cwd;

  for (const part of parts) {
    if (!exists(current)) return null;
    let children;
    try {
      children = fs.readdirSync(current);
    } catch {
      return null;
    }
    const matched = children.find((c) => c.toLowerCase() === part.toLowerCase());
    if (!matched) return null;
    current = path.join(current, matched);
  }

  return exists(current) ? current : null;
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
      suitesPassed: 0,
      testsFailed: 0,
      testsPassed: 0,
      failingTests: [],
      rawSummary: null,
    };
  }

  const lines = jestText.split(/\r?\n/);
  const failingTests = [];

  let currentSuite = null;
  let currentFailure = null;

  for (const line of lines) {
    const suiteMatch = line.match(/^FAIL\s+(.+)$/);
    if (suiteMatch) {
      if (currentFailure) {
        currentFailure.stackRefs = extractStackFileRefs(currentFailure.messageLines.join("\n"));
        failingTests.push(currentFailure);
        currentFailure = null;
      }
      currentSuite = suiteMatch[1].trim();
      continue;
    }

    const failCaseMatch = line.match(/^\s*●\s+(.+)$/);
    if (failCaseMatch) {
      if (currentFailure) {
        currentFailure.stackRefs = extractStackFileRefs(currentFailure.messageLines.join("\n"));
        failingTests.push(currentFailure);
      }

      currentFailure = {
        suite: currentSuite,
        name: failCaseMatch[1].trim(),
        messageLines: [],
        stackRefs: [],
      };
      continue;
    }

    if (currentFailure) {
      currentFailure.messageLines.push(line);
    }
  }

  if (currentFailure) {
    currentFailure.stackRefs = extractStackFileRefs(currentFailure.messageLines.join("\n"));
    failingTests.push(currentFailure);
  }

  const suitesFailed = Number(jestText.match(/Test Suites:\s+(\d+)\s+failed/i)?.[1] || 0);
  const suitesPassed = Number(jestText.match(/Test Suites:.*?(\d+)\s+passed/i)?.[1] || 0);
  const testsFailed = Number(jestText.match(/Tests:\s+(\d+)\s+failed/i)?.[1] || failingTests.length);
  const testsPassed = Number(jestText.match(/Tests:.*?(\d+)\s+passed/i)?.[1] || 0);

  const rawSummary = lines
    .filter((l) => /^(Test Suites:|Tests:|Snapshots:|Time:)/.test(l.trim()))
    .join("\n") || null;

  return {
    suitesFailed,
    suitesPassed,
    testsFailed,
    testsPassed,
    failingTests,
    rawSummary,
  };
}

function parseCoverageSummary(coverageJson, thresholds) {
  if (!coverageJson) {
    return {
      total: null,
      files: [],
      lowCoverageFiles: [],
    };
  }

  const files = Object.entries(coverageJson)
    .filter(([k]) => k !== "total")
    .map(([file, data]) => ({
      file: normalizePath(file),
      linesPct: data.lines?.pct ?? 0,
      linesCovered: data.lines?.covered ?? 0,
      linesTotal: data.lines?.total ?? 0,
      statementsPct: data.statements?.pct ?? 0,
      statementsCovered: data.statements?.covered ?? 0,
      statementsTotal: data.statements?.total ?? 0,
      functionsPct: data.functions?.pct ?? 0,
      functionsCovered: data.functions?.covered ?? 0,
      functionsTotal: data.functions?.total ?? 0,
      branchesPct: data.branches?.pct ?? 0,
      branchesCovered: data.branches?.covered ?? 0,
      branchesTotal: data.branches?.total ?? 0,
    }));

  const lowCoverageFiles = files
    .map((f) => {
      const reasons = [];
      if (f.linesPct < thresholds.lineThreshold) reasons.push(`lines ${f.linesPct}%`);
      if (f.statementsPct < thresholds.statementThreshold) reasons.push(`statements ${f.statementsPct}%`);
      if (f.functionsPct < thresholds.functionThreshold) reasons.push(`functions ${f.functionsPct}%`);
      if (f.branchesPct < thresholds.branchThreshold) reasons.push(`branches ${f.branchesPct}%`);

      const severityScore =
        Math.max(0, thresholds.lineThreshold - f.linesPct) +
        Math.max(0, thresholds.statementThreshold - f.statementsPct) +
        Math.max(0, thresholds.functionThreshold - f.functionsPct) +
        Math.max(0, thresholds.branchThreshold - f.branchesPct);

      return { ...f, reasons, severityScore };
    })
    .filter((f) => f.reasons.length > 0)
    .sort((a, b) => b.severityScore - a.severityScore);

  const total = coverageJson.total
    ? {
        linesPct: coverageJson.total.lines?.pct ?? 0,
        statementsPct: coverageJson.total.statements?.pct ?? 0,
        functionsPct: coverageJson.total.functions?.pct ?? 0,
        branchesPct: coverageJson.total.branches?.pct ?? 0,
      }
    : null;

  return { total, files, lowCoverageFiles };
}

/**
 * Parse lcov.info and return uncovered lines per file.
 * We only use DA:<line>,<hits> and BRDA for lightweight parsing.
 */
function parseLcov(lcovText) {
  if (!lcovText) return {};

  const result = {};
  const records = lcovText.split("end_of_record");

  for (const record of records) {
    const lines = record.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    const sfLine = lines.find((l) => l.startsWith("SF:"));
    if (!sfLine) continue;

    const file = normalizePath(sfLine.slice(3));
    const uncoveredLines = [];
    const uncoveredBranches = [];

    for (const line of lines) {
      if (line.startsWith("DA:")) {
        const parts = line.slice(3).split(",");
        const lineNo = Number(parts[0]);
        const hits = Number(parts[1]);
        if (hits === 0) uncoveredLines.push(lineNo);
      } else if (line.startsWith("BRDA:")) {
        const parts = line.slice(5).split(",");
        const lineNo = Number(parts[0]);
        const taken = parts[3];
        if (taken === "-" || Number(taken) === 0) {
          uncoveredBranches.push(lineNo);
        }
      }
    }

    result[file] = {
      uncoveredLines: Array.from(new Set(uncoveredLines)).sort((a, b) => a - b),
      uncoveredBranches: Array.from(new Set(uncoveredBranches)).sort((a, b) => a - b),
    };
  }

  return result;
}

function attachLcovDetails(coverageData, lcovData) {
  if (!coverageData?.files?.length) return coverageData;

  const mappedFiles = coverageData.files.map((f) => {
    const exact = lcovData[f.file] || lcovData[normalizePath(path.resolve(f.file))] || {
      uncoveredLines: [],
      uncoveredBranches: [],
    };
    return {
      ...f,
      uncoveredLines: exact.uncoveredLines || [],
      uncoveredBranches: exact.uncoveredBranches || [],
    };
  });

  const lowCoverageFiles = coverageData.lowCoverageFiles.map((f) => {
    const exact = lcovData[f.file] || lcovData[normalizePath(path.resolve(f.file))] || {
      uncoveredLines: [],
      uncoveredBranches: [],
    };
    return {
      ...f,
      uncoveredLines: exact.uncoveredLines || [],
      uncoveredBranches: exact.uncoveredBranches || [],
    };
  });

  return {
    ...coverageData,
    files: mappedFiles,
    lowCoverageFiles,
  };
}

function getSnippetForLines(filePath, targetLines, radius = 4, maxSnippetLines = 20) {
  const resolved = fileExistsCaseInsensitive(filePath) || fileExistsCaseInsensitive(path.resolve(filePath));
  if (!resolved) {
    return {
      resolvedPath: null,
      snippet: null,
    };
  }

  const content = safeRead(resolved);
  if (!content) {
    return {
      resolvedPath: resolved,
      snippet: null,
    };
  }

  const lines = content.split(/\r?\n/);
  if (!targetLines || targetLines.length === 0) {
    const snippet = lines.slice(0, Math.min(maxSnippetLines, lines.length))
      .map((line, idx) => `${idx + 1}: ${line}`)
      .join("\n");

    return {
      resolvedPath: resolved,
      snippet,
    };
  }

  const minLine = Math.max(1, Math.min(...targetLines) - radius);
  const maxLine = Math.min(lines.length, Math.max(...targetLines) + radius);

  let selected = [];
  for (let i = minLine; i <= maxLine; i++) {
    selected.push(`${i}: ${lines[i - 1]}`);
  }

  if (selected.length > maxSnippetLines) {
    selected = selected.slice(0, maxSnippetLines);
  }

  return {
    resolvedPath: resolved,
    snippet: selected.join("\n"),
  };
}

function getSnippetForStackRef(stackRef, radius = 4, maxSnippetLines = 20) {
  const match = stackRef.match(/^(.*):(\d+):(\d+)$/);
  if (!match) {
    return { resolvedPath: null, snippet: null };
  }

  const file = match[1];
  const line = Number(match[2]);
  return getSnippetForLines(file, [line], radius, maxSnippetLines);
}

function enrichFailingTests(failingTests, config) {
  return failingTests.map((test) => {
    const topRef = test.stackRefs[0];
    const snippetData = topRef
      ? getSnippetForStackRef(topRef, config.snippetContextRadius, config.maxSnippetLines)
      : { resolvedPath: null, snippet: null };

    return {
      ...test,
      snippetPath: snippetData.resolvedPath,
      snippet: snippetData.snippet,
    };
  });
}

function enrichCoverageFiles(lowCoverageFiles, config) {
  return lowCoverageFiles.map((file) => {
    const linesForSnippet =
      file.uncoveredLines?.slice(0, 5)?.length
        ? file.uncoveredLines.slice(0, 5)
        : file.uncoveredBranches?.slice(0, 5) || [];

    const snippetData = getSnippetForLines(
      file.file,
      linesForSnippet,
      config.snippetContextRadius,
      config.maxSnippetLines
    );

    return {
      ...file,
      snippetPath: snippetData.resolvedPath,
      snippet: snippetData.snippet,
    };
  });
}

function classifyFailureHeuristics(test) {
  const text = `${test.name}\n${test.messageLines.join("\n")}`;

  const tags = [];
  if (/mock|spy|jest\.fn|not a function|axios|jwt|mongodb|database|mongoose/i.test(text)) {
    tags.push("mocking/dependency issue");
  }
  if (/timeout|async|await|promise|done callback/i.test(text)) {
    tags.push("async instability");
  }
  if (/toEqual|toBe|Received|Expected/i.test(text)) {
    tags.push("assertion mismatch");
  }
  if (/Cannot read properties|undefined|null/i.test(text)) {
    tags.push("null/undefined handling");
  }
  if (/unauthorized|forbidden|token|auth/i.test(text)) {
    tags.push("auth/control-flow issue");
  }

  return tags;
}

function buildPrompt({ jestData, coverageData, artifacts, config }) {
  const failingTests = enrichFailingTests(
    jestData.failingTests.slice(0, config.maxFailingTestsForPrompt),
    config
  );
  const lowCoverageFiles = enrichCoverageFiles(
    coverageData.lowCoverageFiles.slice(0, config.maxCoverageFilesForPrompt),
    config
  );

  const promptLines = [];

  promptLines.push(
    "You are a software testing assistant for a JavaScript/Node.js full-stack project."
  );
  promptLines.push(
    "Analyze the provided test artifacts and generate a grounded testing report."
  );
  promptLines.push(
    "Do not invent files, functions, or behaviors that are not supported by the artifacts."
  );
  promptLines.push(
    "If evidence is limited, say so clearly."
  );
  promptLines.push("");

  promptLines.push("PROJECT CONTEXT");
  promptLines.push("- This is an AI-driven testing workflow for a course software engineering project.");
  promptLines.push("- The goal is to analyze real test artifacts and coverage gaps, then suggest useful follow-up tests.");
  promptLines.push("");

  promptLines.push("AVAILABLE ARTIFACTS");
  promptLines.push(`- Jest output loaded: ${artifacts.jestLoaded ? "yes" : "no"}`);
  promptLines.push(`- Coverage summary loaded: ${artifacts.coverageLoaded ? "yes" : "no"}`);
  promptLines.push(`- LCOV loaded: ${artifacts.lcovLoaded ? "yes" : "no"}`);
  promptLines.push("");

  promptLines.push("HIGH-LEVEL SUMMARY");
  promptLines.push(`- Failed suites: ${jestData.suitesFailed}`);
  promptLines.push(`- Passed suites: ${jestData.suitesPassed}`);
  promptLines.push(`- Failed tests: ${jestData.testsFailed}`);
  promptLines.push(`- Passed tests: ${jestData.testsPassed}`);
  if (coverageData.total) {
    promptLines.push(
      `- Overall coverage: lines ${coverageData.total.linesPct}%, statements ${coverageData.total.statementsPct}%, functions ${coverageData.total.functionsPct}%, branches ${coverageData.total.branchesPct}%`
    );
  } else {
    promptLines.push("- Overall coverage: not available");
  }
  promptLines.push("");

  if (failingTests.length > 0) {
    promptLines.push("FAILING TEST DETAILS");
    for (const [index, test] of failingTests.entries()) {
      promptLines.push(`Failure ${index + 1}`);
      promptLines.push(`- Suite: ${test.suite || "Unknown"}`);
      promptLines.push(`- Test: ${test.name}`);
      promptLines.push(`- Heuristic tags: ${classifyFailureHeuristics(test).join(", ") || "none"}`);
      promptLines.push(`- Stack refs: ${test.stackRefs.slice(0, 5).join(" | ") || "none"}`);

      const message = test.messageLines.join("\n").trim().split("\n").slice(0, 12).join("\n");
      if (message) {
        promptLines.push("- Failure message:");
        promptLines.push("```text");
        promptLines.push(message);
        promptLines.push("```");
      }

      if (test.snippet) {
        promptLines.push(`- Relevant code snippet (${normalizePath(test.snippetPath || "unknown")}):`);
        promptLines.push("```js");
        promptLines.push(test.snippet);
        promptLines.push("```");
      }

      promptLines.push("");
    }
  }

  if (lowCoverageFiles.length > 0) {
    promptLines.push("LOW-COVERAGE FILE DETAILS");
    for (const [index, file] of lowCoverageFiles.entries()) {
      promptLines.push(`Coverage hotspot ${index + 1}`);
      promptLines.push(`- File: ${file.file}`);
      promptLines.push(`- Triggered thresholds: ${file.reasons.join(", ")}`);
      promptLines.push(
        `- Coverage: lines ${file.linesPct}% (${file.linesCovered}/${file.linesTotal}), statements ${file.statementsPct}% (${file.statementsCovered}/${file.statementsTotal}), functions ${file.functionsPct}% (${file.functionsCovered}/${file.functionsTotal}), branches ${file.branchesPct}% (${file.branchesCovered}/${file.branchesTotal})`
      );
      promptLines.push(
        `- Uncovered lines: ${file.uncoveredLines?.slice(0, 15).join(", ") || "not available"}`
      );
      promptLines.push(
        `- Uncovered branch lines: ${file.uncoveredBranches?.slice(0, 15).join(", ") || "not available"}`
      );

      if (file.snippet) {
        promptLines.push(`- Relevant code snippet (${normalizePath(file.snippetPath || "unknown")}):`);
        promptLines.push("```js");
        promptLines.push(file.snippet);
        promptLines.push("```");
      }

      promptLines.push("");
    }
  }

  promptLines.push("OUTPUT FORMAT REQUIREMENTS");
  promptLines.push(
    "Write a markdown report with these exact top-level sections:"
  );
  promptLines.push("1. Approach Used");
  promptLines.push("2. Key Findings");
  promptLines.push("3. Detailed Examples");
  promptLines.push("4. Effectiveness");
  promptLines.push("5. Limitations");
  promptLines.push("6. Improvements");
  promptLines.push("");
  promptLines.push("Additional requirements:");
  promptLines.push("- In 'Approach Used', briefly describe the pipeline from test artifacts to AI analysis.");
  promptLines.push("- In 'Key Findings', prioritize the most important failures or coverage hotspots.");
  promptLines.push("- In 'Detailed Examples', include at least 2 concrete examples when possible.");
  promptLines.push("- For each example, explain what evidence supports it.");
  promptLines.push("- Suggest concrete next tests with inputs/mocks/assertions where possible.");
  promptLines.push("- Be specific, but do not fabricate.");
  promptLines.push("- Keep the tone professional and suitable for a project report.");
  promptLines.push("- Return only markdown.");
  promptLines.push("");

  return promptLines.join("\n");
}

function callGemini(prompt, model) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Promise.resolve(null);
  }

  const requestBody = JSON.stringify({
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.9,
      maxOutputTokens: 4096,
    },
  });

  const options = {
    hostname: "generativelanguage.googleapis.com",
    path: `/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(requestBody),
    },
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);

          if (parsed.error) {
            console.warn(`[gemini] API error: ${parsed.error.message}`);
            resolve(null);
            return;
          }

          const text =
            parsed?.candidates?.[0]?.content?.parts
              ?.map((p) => p.text || "")
              .join("") || null;

          resolve(text);
        } catch (err) {
          console.warn("[gemini] Failed to parse response:", err.message);
          resolve(null);
        }
      });
    });

    req.on("error", (err) => {
      console.warn(`[gemini] Request failed: ${err.message}`);
      resolve(null);
    });

    req.setTimeout(45000, () => {
      console.warn("[gemini] Request timed out");
      req.destroy();
      resolve(null);
    });

    req.write(requestBody);
    req.end();
  });
}

function generateFallbackAnalysis({ jestData, coverageData }) {
  const lines = [];

  lines.push("## 1. Approach Used");
  lines.push("");
  lines.push(
    "This workflow parses Jest execution output and coverage artifacts, then organizes failing tests and low-coverage files into a structured report. In this fallback mode, the report is generated without an external LLM response."
  );
  lines.push("");

  lines.push("## 2. Key Findings");
  lines.push("");
  if (jestData.testsFailed > 0) {
    lines.push(`- ${jestData.testsFailed} failing test(s) were detected.`);
  } else {
    lines.push("- No failing tests were detected in the provided Jest output.");
  }

  if (coverageData.lowCoverageFiles.length > 0) {
    lines.push(`- ${coverageData.lowCoverageFiles.length} low-coverage file(s) were detected under the configured thresholds.`);
  } else {
    lines.push("- No low-coverage files were detected under the configured thresholds.");
  }
  lines.push("");

  lines.push("## 3. Detailed Examples");
  lines.push("");
  for (const test of jestData.failingTests.slice(0, 2)) {
    lines.push(`### Failing test: ${test.name}`);
    lines.push("");
    lines.push(`- Suite: ${test.suite || "Unknown"}`);
    lines.push(`- Referenced files: ${test.stackRefs.slice(0, 3).join(", ") || "none extracted"}`);
    lines.push("- Suggested follow-up: inspect the referenced source path, confirm dependency mocks, and add or update assertions for the failing branch.");
    lines.push("");
  }

  for (const file of coverageData.lowCoverageFiles.slice(0, 2)) {
    lines.push(`### Coverage hotspot: ${file.file}`);
    lines.push("");
    lines.push(`- Triggered thresholds: ${file.reasons.join(", ")}`);
    lines.push(`- Uncovered lines: ${file.uncoveredLines?.slice(0, 10).join(", ") || "not available"}`);
    lines.push("- Suggested follow-up: add tests for validation failures, alternate condition states, and error-handling branches.");
    lines.push("");
  }

  lines.push("## 4. Effectiveness");
  lines.push("");
  lines.push(
    "This approach reduces manual inspection effort by condensing noisy test output and coverage data into a more focused list of issues."
  );
  lines.push("");

  lines.push("## 5. Limitations");
  lines.push("");
  lines.push("- The fallback report is heuristic-driven and may be less precise than LLM-assisted analysis.");
  lines.push("- Suggestions remain dependent on the quality and completeness of the provided artifacts.");
  lines.push("");

  lines.push("## 6. Improvements");
  lines.push("");
  lines.push("- Add richer source-context extraction for implicated files.");
  lines.push("- Use exact line- and branch-level coverage more extensively.");
  lines.push("- Integrate the workflow into a more deterministic test pipeline.");
  lines.push("");

  return lines.join("\n");
}

function formatFinalReport({
  config,
  artifacts,
  jestData,
  coverageData,
  prompt,
  aiAnalysis,
}) {
  const now = new Date().toISOString();
  const lines = [];

  lines.push("# AI Testing Report");
  lines.push("");
  lines.push(`Generated at: ${now}`);
  lines.push("");

  lines.push("## Artifact Status");
  lines.push("");
  lines.push(`- Jest output file: ${artifacts.jestPath}`);
  lines.push(`- Jest output loaded: ${artifacts.jestLoaded ? "yes" : "no"}`);
  lines.push(`- Coverage summary file: ${artifacts.coveragePath}`);
  lines.push(`- Coverage summary loaded: ${artifacts.coverageLoaded ? "yes" : "no"}`);
  lines.push(`- LCOV file: ${artifacts.lcovPath}`);
  lines.push(`- LCOV loaded: ${artifacts.lcovLoaded ? "yes" : "no"}`);
  lines.push(`- Gemini enabled: ${artifacts.geminiEnabled ? "yes" : "no"}`);
  lines.push(`- Gemini model: ${config.model}`);
  lines.push("");

  lines.push("## Parsed Summary");
  lines.push("");
  lines.push(`- Failed suites: ${jestData.suitesFailed}`);
  lines.push(`- Passed suites: ${jestData.suitesPassed}`);
  lines.push(`- Failed tests: ${jestData.testsFailed}`);
  lines.push(`- Passed tests: ${jestData.testsPassed}`);
  if (coverageData.total) {
    lines.push(
      `- Overall coverage: lines ${coverageData.total.linesPct}%, statements ${coverageData.total.statementsPct}%, functions ${coverageData.total.functionsPct}%, branches ${coverageData.total.branchesPct}%`
    );
  } else {
    lines.push("- Overall coverage: not available");
  }
  lines.push(`- Low coverage files: ${coverageData.lowCoverageFiles.length}`);
  lines.push("");

  if (jestData.rawSummary) {
    lines.push("## Raw Jest Summary");
    lines.push("");
    lines.push("```text");
    lines.push(jestData.rawSummary);
    lines.push("```");
    lines.push("");
  }

  lines.push("## AI Analysis");
  lines.push("");
  lines.push(aiAnalysis || "_No AI analysis available._");
  lines.push("");

  lines.push("## Configuration");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify({
    jest: config.jest,
    coverage: config.coverage,
    lcov: config.lcov,
    out: config.out,
    model: config.model,
    lineThreshold: config.lineThreshold,
    statementThreshold: config.statementThreshold,
    functionThreshold: config.functionThreshold,
    branchThreshold: config.branchThreshold,
    maxFailingTestsForPrompt: config.maxFailingTestsForPrompt,
    maxCoverageFilesForPrompt: config.maxCoverageFilesForPrompt,
  }, null, 2));
  lines.push("```");
  lines.push("");

  lines.push("## Internal Prompt Used");
  lines.push("");
  lines.push("<details>");
  lines.push("<summary>Expand prompt</summary>");
  lines.push("");
  lines.push("```text");
  lines.push(prompt);
  lines.push("```");
  lines.push("");
  lines.push("</details>");
  lines.push("");

  return lines.join("\n");
}

async function main() {
  const config = parseArgs(process.argv);

  const jestText = safeRead(config.jest);
  const coverageJson = safeReadJson(config.coverage);
  const lcovText = safeRead(config.lcov);

  const artifacts = {
    jestPath: config.jest,
    coveragePath: config.coverage,
    lcovPath: config.lcov,
    jestLoaded: !!jestText,
    coverageLoaded: !!coverageJson,
    lcovLoaded: !!lcovText,
    geminiEnabled: !!process.env.GEMINI_API_KEY,
  };

  if (!artifacts.jestLoaded && !artifacts.coverageLoaded) {
    console.error(
      "[fatal] Neither Jest output nor coverage summary could be loaded. " +
      "Generate artifacts first before running aiTestAgent."
    );
    process.exit(1);
  }

  const jestData = parseJestOutput(jestText);
  let coverageData = parseCoverageSummary(coverageJson, {
    lineThreshold: config.lineThreshold,
    statementThreshold: config.statementThreshold,
    functionThreshold: config.functionThreshold,
    branchThreshold: config.branchThreshold,
  });

  if (lcovText) {
    const lcovData = parseLcov(lcovText);
    coverageData = attachLcovDetails(coverageData, lcovData);
  }

  const prompt = buildPrompt({
    jestData,
    coverageData,
    artifacts,
    config,
  });

  let aiAnalysis = null;

  if (process.env.GEMINI_API_KEY) {
    console.log(`[gemini] Calling Gemini model: ${config.model}`);
    aiAnalysis = await callGemini(prompt, config.model);
    if (aiAnalysis) {
      console.log("[gemini] Analysis received.");
    } else {
      console.warn("[gemini] No AI response received. Falling back to heuristic report section.");
    }
  } else {
    console.warn("[gemini] GEMINI_API_KEY not set. Falling back to heuristic report section.");
  }

  if (!aiAnalysis) {
    aiAnalysis = generateFallbackAnalysis({ jestData, coverageData });
  }

  const report = formatFinalReport({
    config,
    artifacts,
    jestData,
    coverageData,
    prompt,
    aiAnalysis,
  });

  fs.writeFileSync(config.out, report, "utf8");

  console.log(`[report] AI testing report written to ${config.out}`);
  if (!artifacts.jestLoaded) console.warn(`[warn] Jest output not found at ${config.jest}`);
  if (!artifacts.coverageLoaded) console.warn(`[warn] Coverage summary not found at ${config.coverage}`);
  if (!artifacts.lcovLoaded) console.warn(`[warn] LCOV not found at ${config.lcov}`);
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
