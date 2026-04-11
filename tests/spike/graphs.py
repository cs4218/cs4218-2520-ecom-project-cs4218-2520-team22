#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Spike Test Graph Generator (Python)
Generates professional performance graphs with dual Y-axes
"""

import csv
import os
import sys
from pathlib import Path
from datetime import datetime

# Force UTF-8 output on Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from collections import defaultdict

try:
    import matplotlib.pyplot as plt
    import matplotlib.dates as mdates
    import numpy as np
except ImportError:
    print("[WARNING] matplotlib not installed. Run: pip install matplotlib numpy")
    exit(1)

# Configuration
RESULTS_DIR = Path(__file__).parent / "results"
OUTPUT_DIR = RESULTS_DIR
BIN_SIZE_MS = 2000  # 2-second bins


def parse_jml(jml_file):
    """Parse JTL CSV file"""
    samples = []
    try:
        with open(jml_file, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    samples.append({
                        'timestamp': int(row.get('timeStamp', 0) or 0),
                        'elapsed': int(row.get('elapsed', 0) or 0),
                        'success': row.get('success', 'false').lower() == 'true',
                        'activeThreads': int(row.get('grpThreads', 0) or 0),
                    })
                except (ValueError, KeyError):
                    continue
    except Exception as e:
        print(f"   ❌ Error parsing {jml_file}: {e}")
        return []
    
    return samples


def bin_data(samples, bin_size_ms=2000):
    """Bin samples by time intervals"""
    if not samples:
        return []
    
    min_time = min(s['timestamp'] for s in samples)
    max_time = max(s['timestamp'] for s in samples)
    
    bins = []
    t = min_time
    while t <= max_time:
        bin_end = t + bin_size_ms
        bin_samples = [s for s in samples if t <= s['timestamp'] < bin_end]
        
        if bin_samples:
            response_times = [s['elapsed'] for s in bin_samples]
            success_count = sum(1 for s in bin_samples if s['success'])
            error_count = len(bin_samples) - success_count
            
            bins.append({
                'time': t,
                'time_str': f"{(t - min_time) / 1000:.1f}s",
                'p50': np.percentile(response_times, 50),
                'p95': np.percentile(response_times, 95),
                'avg': np.mean(response_times),
                'min': np.min(response_times),
                'max': np.max(response_times),
                'error_rate': (error_count / len(bin_samples)) * 100,
                'active_threads': bin_samples[0]['activeThreads'],
                'throughput': len(bin_samples),
                'sample_count': len(bin_samples),
            })
        
        t += bin_size_ms
    
    return bins


def generate_response_time_chart(test_name, samples):
    """Generate response time chart with dual Y-axes"""
    bins = bin_data(samples, BIN_SIZE_MS)
    if not bins:
        print(f"   [WARNING] No data to chart")
        return
    
    times = list(range(len(bins)))
    p50_values = [b['p50'] for b in bins]
    p95_values = [b['p95'] for b in bins]
    active_threads = [b['active_threads'] for b in bins]
    
    fig, ax1 = plt.subplots(figsize=(14, 6))
    
    # Left Y-axis: Response Time
    color1 = '#2196F3'
    ax1.set_xlabel('Time (seconds)', fontsize=11)
    ax1.set_ylabel('Response Time (ms)', color=color1, fontsize=11)
    line1 = ax1.plot(times, p50_values, color=color1, label='P50 Response Time', linewidth=2)
    line2 = ax1.plot(times, p95_values, color='#FF9800', label='P95 Response Time', linewidth=2, linestyle='--')
    ax1.tick_params(axis='y', labelcolor=color1)
    ax1.set_ylim(bottom=0)
    ax1.grid(True, alpha=0.3)
    
    # Right Y-axis: Active Threads
    color2 = '#4CAF50'
    ax2 = ax1.twinx()
    ax2.set_ylabel('Active Threads', color=color2, fontsize=11)
    line3 = ax2.plot(times, active_threads, color=color2, label='Active Threads', linewidth=2.5, linestyle=':')
    ax2.tick_params(axis='y', labelcolor=color2)
    ax2.set_ylim(bottom=0)
    
    # Legend
    lines = line1 + line2 + line3
    labels = [l.get_label() for l in lines]
    ax1.legend(lines, labels, loc='upper left', fontsize=10)
    
    plt.title(f'Response Time & Thread Load - {test_name}', fontsize=13, fontweight='bold', pad=20)
    plt.tight_layout()
    
    output_file = OUTPUT_DIR / f'{test_name}-response-time.png'
    plt.savefig(output_file, dpi=150, bbox_inches='tight')
    print(f"   [OK] {output_file.name}")
    plt.close()


def generate_error_rate_chart(test_name, samples):
    """Generate error rate chart with dual Y-axes"""
    bins = bin_data(samples, BIN_SIZE_MS)
    if not bins:
        return
    
    times = list(range(len(bins)))
    error_rates = [b['error_rate'] for b in bins]
    throughput = [b['throughput'] for b in bins]
    
    fig, ax1 = plt.subplots(figsize=(14, 6))
    
    # Left Y-axis: Throughput
    color1 = '#9C27B0'
    ax1.set_xlabel('Time (seconds)', fontsize=11)
    ax1.set_ylabel('Throughput (req/s)', color=color1, fontsize=11)
    line1 = ax1.bar(times, throughput, color=color1, alpha=0.7, label='Throughput')
    ax1.tick_params(axis='y', labelcolor=color1)
    ax1.set_ylim(bottom=0)
    ax1.grid(True, alpha=0.3, axis='y')
    
    # Right Y-axis: Error Rate
    color2 = '#F44336'
    ax2 = ax1.twinx()
    ax2.set_ylabel('Error Rate (%)', color=color2, fontsize=11)
    line2 = ax2.plot(times, error_rates, color=color2, label='Error Rate', linewidth=2.5, marker='o', markersize=4)
    ax2.tick_params(axis='y', labelcolor=color2)
    ax2.set_ylim(0, max(100, max(error_rates) * 1.2))
    
    # Legend
    lines = [line2[0]]
    labels = ['Error Rate']
    ax1.legend(lines, labels, loc='upper left', fontsize=10)
    
    plt.title(f'Error Rate & Throughput - {test_name}', fontsize=13, fontweight='bold', pad=20)
    plt.tight_layout()
    
    output_file = OUTPUT_DIR / f'{test_name}-error-rate.png'
    plt.savefig(output_file, dpi=150, bbox_inches='tight')
    print(f"   [OK] {output_file.name}")
    plt.close()


def generate_summary_table(test_name, samples):
    """Generate summary statistics table"""
    if not samples:
        return
    
    bins = bin_data(samples, 5000)  # Larger bins for table
    
    response_times = [s['elapsed'] for s in samples]
    success_count = sum(1 for s in samples if s['success'])
    error_count = len(samples) - success_count
    
    print(f"\n   {test_name.upper()} SUMMARY")
    print(f"   {'-' * 70}")
    print(f"   Total Samples:        {len(samples):,}")
    print(f"   Success:              {success_count:,} ({(success_count/len(samples)*100):.1f}%)")
    print(f"   Errors:               {error_count:,} ({(error_count/len(samples)*100):.1f}%)")
    print(f"   P50 Response Time:    {np.percentile(response_times, 50):.0f}ms")
    print(f"   P95 Response Time:    {np.percentile(response_times, 95):.0f}ms")
    print(f"   Min Response Time:    {min(response_times):.0f}ms")
    print(f"   Max Response Time:    {max(response_times):.0f}ms")
    print(f"   Peak Active Threads:  {max(s['activeThreads'] for s in samples)}")
    print(f"   {'-' * 70}")


def main():
    print("\n" + "="*60)
    print("  SPIKE TEST GRAPH GENERATOR (PYTHON)")
    print("="*60 + "\n")
    
    if not RESULTS_DIR.exists():
        print(f"ERROR: Results directory not found: {RESULTS_DIR}")
        return
    
    # Find JTL files
    jml_files = sorted(RESULTS_DIR.glob("*.jtl"))
    jml_files = [f for f in jml_files if not f.name.endswith("-aggregate.jtl")]
    
    if not jml_files:
        print(f"WARNING: No JTL files found in {RESULTS_DIR}")
        return
    
    print(f"Processing {len(jml_files)} test(s) from {RESULTS_DIR}\n")
    
    for jml_file in jml_files:
        test_name = jml_file.stem
        print(f"[*] {test_name}")
        
        samples = parse_jml(jml_file)
        if not samples:
            print(f"    WARNING: No valid samples")
            continue
        
        generate_response_time_chart(test_name, samples)
        generate_error_rate_chart(test_name, samples)
        generate_summary_table(test_name, samples)
    
    print(f"\nDone! Graphs generated in: {OUTPUT_DIR}")
    print(f"[GRAPHS] Open PNG files to view charts\n")


if __name__ == '__main__':
    main()
