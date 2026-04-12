/**
 * Spike Test Orchestrator
 * Runs multiple JMeter spike tests sequentially with progress reporting.
 * Prerequisite: nft:spike:seed must be run beforehand (manually).
 * Parses JTL results and displays statistics after each test.
 */

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import { promisify } from "util";

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const SPIKE_DIR = __dirname;
const RESULTS_DIR = path.join(SPIKE_DIR, "results");
const TEST_FILES = [
  // spike-recorder.jmx is a utility file, do not test that!
  "spike-login.jmx",
  "spike-products.jmx",
  // "spike-payment.jmx",
];

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

/**
 * Parse JTL CSV results file and extract key metrics
 */
const parseJTLResults = (jtlPath) => {
  if (!fs.existsSync(jtlPath)) {
    return null;
  }

  const data = fs.readFileSync(jtlPath, "utf-8");
  const lines = data.trim().split("\n");

  if (lines.length < 2) {
    return null;
  }

  // JTL CSV format: timeStamp,elapsed,label,responseCode,responseMessage,threadName,dataType,success,failureMessage,bytes,sentBytes,grpThreads,allThreads,URL
  const header = lines[0].split(",");
  const timeStampIdx = header.indexOf("timeStamp");
  const elapsedIdx = header.indexOf("elapsed");
  const successIdx = header.indexOf("success");
  const responseCodeIdx = header.indexOf("responseCode");

  if (elapsedIdx === -1 || successIdx === -1) {
    return null;
  }

  let totalSamples = 0;
  let successCount = 0;
  let failureCount = 0;
  let minResponse = Infinity;
  let maxResponse = 0;
  let totalElapsed = 0;
  let minTime = Infinity;
  let maxTime = 0;

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length < elapsedIdx + 1) continue;

    const elapsed = parseInt(parts[elapsedIdx]) || 0;
    const success = parts[successIdx]?.toLowerCase() === "true";
    const timestamp = parseInt(parts[timeStampIdx]) || 0;

    totalSamples++;
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }

    totalElapsed += elapsed;
    minResponse = Math.min(minResponse, elapsed);
    maxResponse = Math.max(maxResponse, elapsed);

    if (timestamp > 0) {
      minTime = Math.min(minTime, timestamp);
      maxTime = Math.max(maxTime, timestamp);
    }
  }

  const successRate = totalSamples > 0 ? ((successCount / totalSamples) * 100).toFixed(2) : 0;
  const avgResponse = totalSamples > 0 ? Math.round(totalElapsed / totalSamples) : 0;
  const testDuration = maxTime > 0 ? ((maxTime - minTime) / 1000).toFixed(2) : 0;

  return {
    totalSamples,
    successCount,
    failureCount,
    successRate,
    avgResponse,
    minResponse: minResponse === Infinity ? 0 : minResponse,
    maxResponse,
    testDuration,
  };
};

/**
 * Format number with thousands separator
 */
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Display test results
 */
const displayResults = (testName, results) => {
  if (!results) {
    console.log(`⚠️  No results found for ${testName}`);
    return;
  }

  console.log(`\n✅ ${testName.toUpperCase()} COMPLETED`);
  console.log("📊 TEST STATISTICS:");
  console.log(`   Total Samples:    ${formatNumber(results.totalSamples)}`);
  console.log(`   Success:          ${formatNumber(results.successCount)} ✅`);
  console.log(`   Failures:         ${formatNumber(results.failureCount)} ${results.failureCount > 0 ? "❌" : ""}`);
  console.log(`   Success Rate:     ${results.successRate}%`);
  console.log(`   Avg Response:     ${results.avgResponse}ms`);
  console.log(`   Min Response:     ${results.minResponse}ms`);
  console.log(`   Max Response:     ${results.maxResponse}ms`);
  console.log(`   Total Duration:   ${results.testDuration}s`);
};

/**
 * Run a single JMeter test via command line
 */
const runJMeterTest = async (testFile, jtlOutput) => {
  const testPath = path.join(SPIKE_DIR, testFile);

  if (!fs.existsSync(testPath)) {
    console.warn(`   ⚠️  Test file not found: ${testFile}`);
    return null;
  }

  try {
    console.log(`\n🔧 Configuring and running: ${testFile}`);
    const jmeterCommand = `jmeter -n -t "${testPath}" -l "${jtlOutput}" -j /dev/null`;

    console.log(`   ⏳ Running test... (check JMeter output)`);
    await execAsync(jmeterCommand, { timeout: 600000, stdio: "pipe" }); // 10 min timeout

    return parseJTLResults(jtlOutput);
  } catch (error) {
    if (error.killed) {
      console.error(`   ❌ Test timeout or killed`);
    } else if (error.code === 127) {
      console.error(`   ❌ JMeter not found. Ensure JMeter is installed and 'jmeter' is in PATH`);
    } else {
      console.error(`   ⚠️  Test completed with warnings/errors (check JTL file)`);
      // Try to parse results anyway (JMeter may complete with exit code != 0)
      return parseJTLResults(jtlOutput);
    }
  }

  return null;
};

/**
 * Main orchestration
 */
const runAllTests = async () => {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║           🚀 SPIKE TEST ORCHESTRATOR STARTING             ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("\n⏳ Prerequisites:");
  console.log("   ✓ Ensure 'npm run dev' is running (server on :6060, client on :3000)");
  console.log("   ✓ Ensure 'npm run nft:spike:seed' has been executed");
  console.log("   ✓ Ensure JMeter is installed and available in PATH\n");

  const results = {};
  const startTime = Date.now();

  // Clean up old JTL files before starting tests
  console.log("🧹 Cleaning up old JTL files...");
  for (const testFile of TEST_FILES) {
    const jtlFile = path.join(RESULTS_DIR, `${path.basename(testFile, ".jmx")}.jtl`);
    if (fs.existsSync(jtlFile)) {
      try {
        fs.unlinkSync(jtlFile);
        console.log(`   Deleted ${path.basename(jtlFile)}`);
      } catch (error) {
        console.warn(`   ⚠️  Failed to delete ${path.basename(jtlFile)}: ${error.message}`);
      }
    }
  }
  console.log();

  // Run each test file
  for (const testFile of TEST_FILES) {
    const jtlOutput = path.join(RESULTS_DIR, `${path.basename(testFile, ".jmx")}.jtl`);
    const testName = testFile.replace(".jmx", "").replace(/-/g, " ").toUpperCase();

    console.log(`\n📋 Test: ${testName}`);
    console.log(`   File: ${testFile}`);
    
    const result = await runJMeterTest(testFile, jtlOutput);

    if (result) {
      displayResults(testName, result);
      results[testName] = { ...result, jtlFile: jtlOutput };
    } else {
      console.log(`   ⚠️  Could not parse results for ${testFile}`);
      results[testName] = null;
    }
  }

  // Summary table
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                   📊 FINAL SUMMARY TABLE                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log("Test Name                    | Status | Samples | Success Rate | Avg Time");
  console.log("─".repeat(85));

  for (const [name, result] of Object.entries(results)) {
    const status = result ? (result.failureCount === 0 ? "✅ PASS" : "⚠️  PARTIAL") : "❌ FAIL";
    const samples = result ? formatNumber(result.totalSamples) : "N/A";
    const successRate = result ? `${result.successRate}%` : "N/A";
    const avgTime = result ? `${result.avgResponse}ms` : "N/A";

    const displayName = name.padEnd(28);
    console.log(`${displayName} | ${status.padEnd(6)} | ${samples.padStart(7)} | ${successRate.padStart(12)} | ${avgTime}`);
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log(`║  Total Execution Time: ${totalTime}s`.padEnd(61) + "║");
  console.log("║  Detailed results in: tests/spike/results/                 ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  // Generate graphs from JTL results
  console.log("📊 Generating analysis graphs...");
  try {
    await execAsync(`python ${path.join(SPIKE_DIR, 'generate_spike_graph.py')}`);
    console.log("✅ Graphs generated successfully\n");
  } catch (error) {
    console.warn("⚠️  Failed to generate graphs:", error.message);
  }

  process.exit(0);
};

// Run orchestrator
runAllTests().catch((error) => {
  console.error("\n❌ Orchestration failed:", error.message);
  process.exit(1);
});
