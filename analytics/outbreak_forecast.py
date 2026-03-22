import pandas as pd
from sklearn.linear_model import LinearRegression
from datetime import timedelta
from utils import get_db_connection

def run_outbreak_forecast():
    print("Starting outbreak forecast...")
    conn = get_db_connection()
    cur = conn.cursor()

    # Clear old predictions
    cur.execute("TRUNCATE TABLE outbreak_predictions;")
    conn.commit()

    query = """
        SELECT ward_code, report_date,
               SUM(fever_count + cough_count + diarrhea_count) AS total_cases
        FROM asha_reports
        WHERE report_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY ward_code, report_date
        ORDER BY ward_code, report_date;
    """
    df = pd.read_sql(query, conn)
    print(f"Retrieved {len(df)} rows")

    predictions = []
    for ward, group in df.groupby('ward_code'):
        if len(group) < 7:
            continue
        group = group.sort_values('report_date')
        group['day_index'] = range(len(group))

        model = LinearRegression()
        model.fit(group[['day_index']], group['total_cases'])

        last_day = group['day_index'].max()
        last_date = group['report_date'].max()

        for offset in range(1, 8):
            pred_cases = max(0, int(round(model.predict([[last_day + offset]])[0])))
            predictions.append((
                ward, last_date + timedelta(days=offset),
                pred_cases, None, None, 'linear_v1'
            ))

    insert = """
        INSERT INTO outbreak_predictions 
        (ward_code, prediction_date, predicted_cases, confidence_lower, confidence_upper, model_version)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    cur.executemany(insert, predictions)
    conn.commit()
    cur.close()
    conn.close()
    print(f"Added {len(predictions)} predictions.")

if __name__ == '__main__':
    run_outbreak_forecast()