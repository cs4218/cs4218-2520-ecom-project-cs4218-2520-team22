#!/usr/bin/env python3
"""
Simple spike test graph generator from JTL files.
Generates a graph showing concurrent users, response time, and error rate.
Uses only standard library - no pandas required.
"""

import os
import csv
import matplotlib.pyplot as plt
from collections import defaultdict
from pathlib import Path

# Configuration
RESULTS_DIR = "results"
OUTPUT_DIR = RESULTS_DIR
TIME_BUCKET_SECONDS = 5  # Aggregate data into 5-second buckets

def load_jtl_file(filepath):
    """Load a JTL file and return raw data."""
    print(f"Loading {filepath}...")
    try:
        data = []
        with open(filepath, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    data.append({
                        'timestamp': int(row['timeStamp']),
                        'elapsed': int(row['elapsed']),
                        'success': row['success'].lower() == 'true',
                        'grpThreads': int(row['grpThreads']),
                    })
                except (ValueError, KeyError):
                    continue
        return data
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return None

def process_jtl_data(data, time_bucket_seconds=5):
    """
    Process JTL data and aggregate into time buckets.
    Returns list of bucketed metrics.
    """
    if not data:
        return None
    
    # Find minimum timestamp to normalize time
    min_timestamp = min(row['timestamp'] for row in data)
    
    # Group by time bucket (after normalization)
    buckets = defaultdict(lambda: {'times': [], 'successes': 0, 'failures': 0, 'threads': []})
    
    for row in data:
        # Normalize to relative time in seconds (from start of test)
        relative_time_sec = (row['timestamp'] - min_timestamp) // 1000
        bucket = (relative_time_sec // time_bucket_seconds) * time_bucket_seconds
        
        buckets[bucket]['times'].append(row['elapsed'])
        buckets[bucket]['threads'].append(row['grpThreads'])
        
        if row['success']:
            buckets[bucket]['successes'] += 1
        else:
            buckets[bucket]['failures'] += 1
    
    # Calculate metrics for each bucket
    results = []
    for bucket in sorted(buckets.keys()):
        info = buckets[bucket]
        times = info['times']
        total = info['successes'] + info['failures']
        
        if not times:
            continue
        
        # Calculate percentiles manually
        sorted_times = sorted(times)
        avg_time = sum(sorted_times) / len(sorted_times)
        p95_idx = int(len(sorted_times) * 0.95)
        p95_time = sorted_times[p95_idx] if p95_idx < len(sorted_times) else sorted_times[-1]
        
        error_rate = (info['failures'] / total * 100) if total > 0 else 0
        avg_threads = sum(info['threads']) / len(info['threads'])
        
        results.append({
            'bucket': bucket,
            'time_sec': bucket,  # Time in seconds (already relative)
            'avg_response_time': avg_time,
            'p95_response_time': p95_time,
            'error_rate': error_rate,
            'concurrent_users': avg_threads,
            'sample_count': total
        })
    
    return results

def generate_graph(test_name, data, output_file):
    """Generate a spike testing graph for a single test."""
    fig, ax1 = plt.subplots(figsize=(12, 6))
    
    if not data:
        return
    
    # Time is already normalized (relative from test start)
    times = [d['time_sec'] for d in data]
    users = [d['concurrent_users'] for d in data]
    avg_resp = [d['avg_response_time'] for d in data]
    p95_resp = [d['p95_response_time'] for d in data]
    errors = [d['error_rate'] for d in data]
    
    max_time = max(times) if times else 0
    
    colors = {'spike-products': '#1f77b4', 'spike-payment': '#ff7f0e', 'spike-login': '#2ca02c'}
    color = colors.get(test_name, '#1f77b4')
    
    # Left axis: concurrent users (bar chart)
    ax1.bar(times, users, alpha=0.3, label='Concurrent Users', color=color, width=1)
    
    # Left axis: avg response time (solid line)
    ax1.plot(times, avg_resp, marker='o', color=color, linewidth=2.5, 
            label='Avg Response Time', markersize=5)
    
    # Left axis: 95th percentile response time (dashed line)
    ax1.plot(times, p95_resp, marker='s', color=color, linewidth=2, 
            linestyle='--', label='P95 Response Time', markersize=4, alpha=0.8)
    
    ax1.set_xlabel('Time (seconds from start)', fontsize=12)
    ax1.set_ylabel('Concurrent Users / Response Time (ms)', fontsize=12, color='black')
    ax1.tick_params(axis='y', labelcolor='black')
    ax1.set_xlim(0, max_time + 5)  # Add 5-second margin
    ax1.grid(True, alpha=0.3)
    
    # Right axis: error rate
    ax2 = ax1.twinx()
    ax2.plot(times, errors, marker='d', linestyle=':', color=color, 
            linewidth=2.5, alpha=0.7, label='Error Rate %', markersize=5)
    
    ax2.set_ylabel('Error Rate (%)', fontsize=12, color='black')
    ax2.tick_params(axis='y', labelcolor='black')
    
    # Title and legend with duration
    duration_str = f"({max_time}s)"
    plt.title(f'Spike Test: {test_name.replace("spike-", "").title()} {duration_str}', 
              fontsize=13, fontweight='bold')
    
    # Combine legends
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper left', fontsize=10)
    
    plt.tight_layout()
    plt.savefig(output_file, dpi=150, bbox_inches='tight')
    print(f"  Graph saved to {output_file} (duration: {max_time}s)")
    plt.close()

def main():
    """Main function."""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Clean up old graphs before generating new ones
    print("Cleaning up old graphs...")
    for pattern in ['*_analysis.png', 'spike_test_analysis.png']:
        for file in Path(OUTPUT_DIR).glob(pattern):
            try:
                file.unlink()
                print(f"  Deleted {file.name}")
            except Exception as e:
                print(f"  Failed to delete {file.name}: {e}")
    
    # Find and process JTL files
    jtl_files = ['spike-products.jtl', 'spike-payment.jtl', 'spike-login.jtl']
    
    for jtl_file in jtl_files:
        filepath = os.path.join(RESULTS_DIR, jtl_file)
        if not os.path.exists(filepath):
            print(f"Skipping {jtl_file} (not found)")
            continue
        
        raw_data = load_jtl_file(filepath)
        if raw_data:
            processed = process_jtl_data(raw_data, TIME_BUCKET_SECONDS)
            if processed:
                test_name = jtl_file.replace('.jtl', '')
                print(f"Processing {test_name}...")
                print(f"  Processed {len(processed)} time buckets, {len(raw_data)} total samples")
                
                # Generate graph for this test
                output_file = os.path.join(OUTPUT_DIR, f'{test_name}_analysis.png')
                generate_graph(test_name, processed, output_file)
    
    print("\nDone!")

if __name__ == '__main__':
    main()

