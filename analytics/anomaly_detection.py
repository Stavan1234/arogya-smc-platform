import pandas as pd
import numpy as np
from datetime import datetime
import requests
import os
from utils import get_db_connection

def run_anomaly_detection():
    print("Starting anomaly detection...")
    conn = get_db_connection()
    cur = conn.cursor()

    query = """
        SELECT ward_code, report_date,
               SUM(fever_count + cough_count + diarrhea_count) AS total_cases
        FROM asha_reports
        WHERE report_date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY ward_code, report_date
        ORDER BY ward_code, report_date;
    """
    df = pd.read_sql(query, conn)
    print(f"Retrieved {len(df)} rows")

    today = datetime.now().date()
    anomalies = []
    for ward, group in df.groupby('ward_code'):
        if len(group) < 7:
            continue
        group = group.sort_values('report_date')
        baseline = group['total_cases'].values[-7:]
        mean, std = np.mean(baseline), np.std(baseline)
        today_row = group[group['report_date'] == today]
        if len(today_row) == 0:
            continue
        today_cases = today_row['total_cases'].values[0]
        if today_cases > mean + 2 * std:
            deviation = (today_cases - mean) / (std + 1e-6)
            anomalies.append((
                ward, today, today_cases, int(round(mean)), deviation,
                f"Cases ({today_cases}) exceeded baseline mean+2σ (mean={mean:.1f}, std={std:.1f})"
            ))

    insert = """
        INSERT INTO anomaly_events 
        (ward_code, detection_date, observed_cases, expected_cases, deviation_score, description)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (ward_code, detection_date) DO UPDATE
        SET observed_cases = EXCLUDED.observed_cases,
            expected_cases = EXCLUDED.expected_cases,
            deviation_score = EXCLUDED.deviation_score,
            description = EXCLUDED.description,
            generated_at = NOW();
    """
    cur.executemany(insert, anomalies)
    conn.commit()
    cur.close()
    conn.close()
    print(f"Found {len(anomalies)} anomalies.")

    for anomaly in anomalies:
        try:
            requests.post('http://localhost:3000/api/notifications/trigger', json={
                'secret': os.environ.get('NOTIFICATION_TRIGGER_SECRET'),
                'type': 'anomaly',
                'recordId': anomaly[0]  # you'd need the actual inserted ID; maybe query after insert
            })
        except Exception as e:
            print(f"Failed to trigger notification: {e}")

if __name__ == '__main__':
    run_anomaly_detection()