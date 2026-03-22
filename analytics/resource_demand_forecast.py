import pandas as pd
import numpy as np
from datetime import timedelta
from utils import get_db_connection

def run_resource_forecast():
    print("Starting resource demand forecast...")
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("TRUNCATE TABLE resource_demand_forecast;")
    conn.commit()

    query = """
        SELECT ar.ward_code, drm.resource_type, ar.report_date, COUNT(*) AS consumption
        FROM asha_reports ar
        CROSS JOIN disease_resource_mapping drm
        WHERE ar.report_date >= CURRENT_DATE - INTERVAL '7 days'
          AND ((drm.disease = 'fever' AND ar.fever_count > 0) OR
               (drm.disease = 'cough' AND ar.cough_count > 0) OR
               (drm.disease = 'diarrhea' AND ar.diarrhea_count > 0))
        GROUP BY ar.ward_code, drm.resource_type, ar.report_date
        ORDER BY ar.ward_code, drm.resource_type, ar.report_date;
    """
    df = pd.read_sql(query, conn)
    print(f"Retrieved {len(df)} rows")

    forecasts = []
    for (ward, resource), group in df.groupby(['ward_code', 'resource_type']):
        group = group.sort_values('report_date')
        if len(group) == 0:
            continue
        avg = np.mean(group['consumption'].values)
        last_date = group['report_date'].max()
        for offset in range(1, 8):
            forecasts.append((
                ward, resource, last_date + timedelta(days=offset), max(0, int(round(avg)))
            ))

    insert = """
        INSERT INTO resource_demand_forecast 
        (ward_code, resource_type, forecast_date, predicted_demand)
        VALUES (%s, %s, %s, %s)
    """
    cur.executemany(insert, forecasts)
    conn.commit()
    cur.close()
    conn.close()
    print(f"Added {len(forecasts)} forecasts.")

if __name__ == '__main__':
    run_resource_forecast()