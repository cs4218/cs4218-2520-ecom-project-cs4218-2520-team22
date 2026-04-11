/**
 * Spike Test Graph Generator
 * Parses JTL files and generates performance graphs:
 * - Response time percentiles (50th, 95th)
 * - Error rate over time
 * - Active threads over time
 * - Throughput
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(__dirname, "results");

/**
 * Parse JTL CSV file
 */
const parseJTL = (filePath) => {
  if (!fs.existsSync(filePath)) return null;
  
  const data = fs.readFileSync(filePath, "utf-8");
  const lines = data.trim().split("\n");
  
  if (lines.length < 2) return null;
  
  const header = lines[0].split(",");
  const timeStampIdx = header.indexOf("timeStamp");
  const elapsedIdx = header.indexOf("elapsed");
  const successIdx = header.indexOf("success");
  const grpThreadsIdx = header.indexOf("grpThreads");
  
  const samples = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length < elapsedIdx + 1) continue;
    
    samples.push({
      timestamp: parseInt(parts[timeStampIdx]) || 0,
      elapsed: parseInt(parts[elapsedIdx]) || 0,
      success: parts[successIdx]?.toLowerCase() === "true",
      activeThreads: parseInt(parts[grpThreadsIdx]) || 0,
    });
  }
  
  return samples;
};

/**
 * Calculate percentile
 */
const percentile = (arr, p) => {
  if (arr.length === 0) return 0;
  const sorted = arr.sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
};

/**
 * Generate time-series data binned by time intervals
 */
const generateTimeSeries = (samples, binIntervalMs = 1000) => {
  if (samples.length === 0) return [];
  
  const minTime = Math.min(...samples.map(s => s.timestamp));
  const maxTime = Math.max(...samples.map(s => s.timestamp));
  const bins = [];
  
  for (let t = minTime; t <= maxTime; t += binIntervalMs) {
    const binEnd = t + binIntervalMs;
    const binSamples = samples.filter(s => s.timestamp >= t && s.timestamp < binEnd);
    
    if (binSamples.length === 0) continue;
    
    const responseTimes = binSamples.map(s => s.elapsed);
    const successCount = binSamples.filter(s => s.success).length;
    const errorCount = binSamples.length - successCount;
    
    bins.push({
      time: new Date(t).toISOString(),
      timestamp: t,
      p50: percentile(responseTimes, 50),
      p95: percentile(responseTimes, 95),
      avgResponse: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
      errorRate: (errorCount / binSamples.length * 100).toFixed(2),
      throughput: binSamples.length,
      activeThreads: binSamples[0]?.activeThreads || 0,
      sampleCount: binSamples.length,
    });
  }
  
  return bins;
};

/**
 * Generate ASCII graph
 */
const generateASCIIGraph = (title, data, valueKey, maxWidth = 80, maxHeight = 20) => {
  console.log(`\n╔${"═".repeat(maxWidth - 2)}╗`);
  console.log(`║ ${title.padEnd(maxWidth - 4)} ║`);
  console.log(`╠${"═".repeat(maxWidth - 2)}╣`);
  
  if (data.length === 0) {
    console.log(`║ No data available${" ".repeat(maxWidth - 20)} ║`);
    console.log(`╚${"═".repeat(maxWidth - 2)}╝`);
    return;
  }
  
  const values = data.map(d => parseFloat(d[valueKey]) || 0);
  const maxValue = Math.max(...values, 1);
  const scale = maxHeight / maxValue;
  
  // Draw graph from top to bottom
  for (let h = maxHeight; h > 0; h--) {
    let line = "║ ";
    for (let i = 0; i < data.length; i++) {
      const barHeight = Math.round(values[i] * scale);
      line += barHeight >= h ? "█" : " ";
    }
    line += " ║";
    console.log(line);
  }
  
  console.log(`╠${"═".repeat(maxWidth - 2)}╣`);
  console.log(`║ Max: ${maxValue.toFixed(0).padEnd(10)} | Min: ${Math.min(...values).toFixed(0).padEnd(10)}${" ".repeat(maxWidth - 50)}║`);
  console.log(`╚${"═".repeat(maxWidth - 2)}╝`);
};

/**
 * Generate HTML chart
 */
const generateHTMLChart = (testName, timeSeries) => {
  const p50Values = timeSeries.map(t => t.p50);
  const p95Values = timeSeries.map(t => t.p95);
  const errorRates = timeSeries.map(t => parseFloat(t.errorRate));
  const activeThreads = timeSeries.map(t => t.activeThreads);
  const times = timeSeries.map((t, i) => i);
  
  const maxResponse = Math.max(...p50Values, ...p95Values);
  const maxThreads = Math.max(...activeThreads, 1);
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Spike Test: ${testName}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    .chart-section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; text-align: center; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
    .stat-box { background: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #2196F3; }
    .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Spike Test: ${testName}</h1>
    
    <div class="stats">
      <div class="stat-box">
        <div class="stat-value">${Math.max(...p50Values).toFixed(0)}ms</div>
        <div class="stat-label">Max P50 Response</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${Math.max(...p95Values).toFixed(0)}ms</div>
        <div class="stat-label">Max P95 Response</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${Math.max(...errorRates).toFixed(1)}%</div>
        <div class="stat-label">Max Error Rate</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${Math.max(...activeThreads)}</div>
        <div class="stat-label">Peak Threads</div>
      </div>
    </div>

    <div class="chart-section">
      <h2>Response Time (P50 & P95)</h2>
      <canvas id="responseChart"></canvas>
    </div>

    <div class="chart-section">
      <h2>Error Rate Over Time</h2>
      <canvas id="errorChart"></canvas>
    </div>

    <div class="chart-section">
      <h2>Active Threads Over Time</h2>
      <canvas id="threadsChart"></canvas>
    </div>

    <div class="chart-section">
      <h2>Throughput (Requests/Second)</h2>
      <canvas id="throughputChart"></canvas>
    </div>
  </div>

  <script>
    const p50Data = ${JSON.stringify(p50Values)};
    const p95Data = ${JSON.stringify(p95Values)};
    const errorData = ${JSON.stringify(errorRates)};
    const threadData = ${JSON.stringify(activeThreads)};
    const throughputData = ${JSON.stringify(timeSeries.map(t => t.throughput))};
    const timeLabels = ${JSON.stringify(times.slice(0, Math.min(timeSeries.length, 50)))};

    // Sample every Nth point for readability
    const sampleRate = Math.max(1, Math.floor(timeSeries.length / 50));
    const sampledP50 = p50Data.filter((_, i) => i % sampleRate === 0);
    const sampledP95 = p95Data.filter((_, i) => i % sampleRate === 0);
    const sampledErrors = errorData.filter((_, i) => i % sampleRate === 0);
    const sampledThreads = threadData.filter((_, i) => i % sampleRate === 0);
    const sampledThroughput = throughputData.filter((_, i) => i % sampleRate === 0);

    // Response Time Chart
    new Chart(document.getElementById('responseChart'), {
      type: 'line',
      data: {
        labels: timeLabels.slice(0, sampledP50.length),
        datasets: [
          {
            label: 'P50 Response Time',
            data: sampledP50,
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            tension: 0.3,
          },
          {
            label: 'P95 Response Time',
            data: sampledP95,
            borderColor: '#FF9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { title: { display: true, text: 'Response Time (ms)' } } },
      },
    });

    // Error Rate Chart
    new Chart(document.getElementById('errorChart'), {
      type: 'bar',
      data: {
        labels: timeLabels.slice(0, sampledErrors.length),
        datasets: [{
          label: 'Error Rate (%)',
          data: sampledErrors,
          backgroundColor: 'rgba(244, 67, 54, 0.7)',
          borderColor: '#F44336',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true, max: 100 } },
      },
    });

    // Active Threads Chart
    new Chart(document.getElementById('threadsChart'), {
      type: 'line',
      data: {
        labels: timeLabels.slice(0, sampledThreads.length),
        datasets: [{
          label: 'Active Threads',
          data: sampledThreads,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          fill: true,
          tension: 0.3,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { title: { display: true, text: 'Number of Threads' } } },
      },
    });

    // Throughput Chart
    new Chart(document.getElementById('throughputChart'), {
      type: 'line',
      data: {
        labels: timeLabels.slice(0, sampledThroughput.length),
        datasets: [{
          label: 'Throughput (req/s)',
          data: sampledThroughput,
          borderColor: '#9C27B0',
          backgroundColor: 'rgba(156, 39, 176, 0.1)',
          tension: 0.3,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } },
      },
    });
  </script>
</body>
</html>`;

  return html;
};

/**
 * Main execution
 */
const generateGraphs = async () => {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║          🎯 SPIKE TEST GRAPH GENERATOR STARTING           ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const jtlFiles = fs
    .readdirSync(RESULTS_DIR)
    .filter(f => f.endsWith(".jtl") && !f.endsWith("-aggregate.jtl"));

  for (const jtlFile of jtlFiles) {
    const filePath = path.join(RESULTS_DIR, jtlFile);
    const testName = path.basename(jtlFile, ".jtl");

    console.log(`\n📈 Processing: ${testName}`);
    
    const samples = parseJTL(filePath);
    if (!samples) {
      console.log(`   ⚠️  Could not parse ${jtlFile}`);
      continue;
    }

    const timeSeries = generateTimeSeries(samples, 2000); // 2-second bins
    
    if (timeSeries.length === 0) {
      console.log(`   ⚠️  No time-series data generated`);
      continue;
    }

    // Generate ASCII graphs for terminal
    generateASCIIGraph(`${testName} - P50 Response Time (ms)`, timeSeries, "p50", 80, 15);
    generateASCIIGraph(`${testName} - P95 Response Time (ms)`, timeSeries, "p95", 80, 15);
    generateASCIIGraph(`${testName} - Error Rate (%)`, timeSeries, "errorRate", 80, 10);
    generateASCIIGraph(`${testName} - Active Threads`, timeSeries, "activeThreads", 80, 15);

    // Generate HTML chart
    const htmlChart = generateHTMLChart(testName, timeSeries);
    const htmlPath = path.join(RESULTS_DIR, `${testName}-chart.html`);
    fs.writeFileSync(htmlPath, htmlChart);
    console.log(`   ✅ HTML chart: ${htmlPath}`);

    // Summary stats
    const allResponseTimes = samples.map(s => s.elapsed);
    const successCount = samples.filter(s => s.success).length;
    const errorRate = ((samples.length - successCount) / samples.length * 100).toFixed(2);

    console.log(`\n   📊 Summary Statistics:`);
    console.log(`      Total Samples: ${samples.length}`);
    console.log(`      Success Rate: ${(successCount / samples.length * 100).toFixed(2)}%`);
    console.log(`      Error Rate: ${errorRate}%`);
    console.log(`      P50 Response: ${percentile(allResponseTimes, 50)}ms`);
    console.log(`      P95 Response: ${percentile(allResponseTimes, 95)}ms`);
    console.log(`      Min Response: ${Math.min(...allResponseTimes)}ms`);
    console.log(`      Max Response: ${Math.max(...allResponseTimes)}ms`);
  }

  console.log(
    `\n✨ Graphs generated! Open HTML files in tests/spike/results/ to view interactive charts.\n`
  );
};

generateGraphs().catch(console.error);
