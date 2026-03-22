#!/usr/bin/env node

/**
 * aiTestAgent.js
 *
 * Minimal AI-driven testing artifact parser.
 *
 * What it does:
 * 1. Reads Jest output from a text file (optional)
 * 2. Reads coverage/coverage-summary.json
 * 3. Extracts failed tests, stack traces, and low-coverage files
 * 4. Generates ai-testing-report.md
 *
 * Usage:
 *   node aiTestAgent.js
 *   node aiTestAgent.js --jest=jest-output.txt --coverage=coverage/coverage-summary.json --out=ai-testing-report.md
 *
 * Suggested workflow:
 *   npm test -- --coverage > jest-output.txt 2>&1
 *   node aiTestAgent.js
 */

const fs = require("fs");
const path = require("path");

const DEFAULTS = {
  jest: "jest-output.txt",
  coverage: path.join("coverage", "coverage-summary.json"),
  out: "ai-testing-report.md",
  branchThreshold: 80,
  lineThreshold: 80,
  functionThreshold: 80,
  statementThreshold: 80,
};

function parseArgs(argv) {
  const config = { ...DEFAULTS };

  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--jest=")) config.jest = arg.split("=")[1];
    else if (arg.startsWith("--coverage=")) config.coverage = arg.split("=")[1];
    else if (arg.startsWith("--out=")) config.out = arg.split("=")[1];
    else if (arg.startsWith("--branchThreshold=")) config.branchThreshold = Number(arg.split("=")[1]);
    else if (arg.startsWith("--lineThreshold=")) config.lineThreshold = Number(arg.split("=")[1]);
    else if (arg.startsWith("--functionThreshold=")) config.functionThreshold = Number(arg.split("=")[1]);
    else if (arg.startsWith("--statementThreshold=")) config.statementThreshold = Number(arg.split("=")[1]);
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

function guessRecommendations({ failingTests, lowCoverageFiles }) {
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

  if (lowCoverageFiles.length === 0 && failingTests.length === 0) {
    recs.push("No immediate issues detected from the provided artifacts.");
  }

  return recs;
}

function formatMarkdownReport({ config, jestData, coverageData }) {
  const now = new Date().toISOString();

  const recommendations = guessRecommendations({
    failingTests: jestData.failingTests,
    lowCoverageFiles: coverageData.lowCoverageFiles,
  });

  const lines = [];

  lines.push("# AI Testing Report");
  lines.push("");
  lines.push(`Generated at: ${now}`);
  lines.push("");

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
  lines.push("");

  if (jestData.rawSummary) {
    lines.push("### Raw Jest Summary");
    lines.push("");
    lines.push("```text");
    lines.push(jestData.rawSummary);
    lines.push("```");
    lines.push("");
  }

  lines.push("## 2. Failing Tests");
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

  lines.push("## 3. Low Coverage Files");
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

  lines.push("## 4. Recommended Next Actions");
  lines.push("");
  if (recommendations.length === 0) {
    lines.push("- No recommendations generated.");
  } else {
    recommendations.forEach((r) => lines.push(`- ${r}`));
  }
  lines.push("");

  lines.push("## 5. Suggested Follow-Up Test Targets");
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

  lines.push("## 6. Configuration");
  lines.push("");
  lines.push("```json");
  lines.push(
    JSON.stringify(
      {
        jest: config.jest,
        coverage: config.coverage,
        out: config.out,
        branchThreshold: config.branchThreshold,
        lineThreshold: config.lineThreshold,
        functionThreshold: config.functionThreshold,
        statementThreshold: config.statementThreshold,
      },
      null,
      2
    )
  );
  lines.push("```");
  lines.push("");

  return lines.join("\n");
}

function main() {
  const config = parseArgs(process.argv);

  const jestText = safeRead(config.jest);
  const coverageJson = safeReadJson(config.coverage);

  const jestData = parseJestOutput(jestText);
  const coverageData = parseCoverage(coverageJson, {
    branchThreshold: config.branchThreshold,
    lineThreshold: config.lineThreshold,
    functionThreshold: config.functionThreshold,
    statementThreshold: config.statementThreshold,
  });

  const report = formatMarkdownReport({
    config,
    jestData,
    coverageData,
  });

  fs.writeFileSync(config.out, report, "utf8");

  console.log(`AI testing report written to ${config.out}`);
  if (!jestText) console.log(`Warning: Jest output file not found at ${config.jest}`);
  if (!coverageJson) console.log(`Warning: Coverage summary not found at ${config.coverage}`);
}

main();
