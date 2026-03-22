import outbreak_forecast
import resource_demand_forecast
import anomaly_detection

if __name__ == '__main__':
    print("=" * 50)
    print("Running all analytics...")
    print("=" * 50)
    
    try:
        outbreak_forecast.run_outbreak_forecast()
    except Exception as e:
        print(f"Outbreak error: {e}")
    
    try:
        resource_demand_forecast.run_resource_forecast()
    except Exception as e:
        print(f"Resource error: {e}")
    
    try:
        anomaly_detection.run_anomaly_detection()
    except Exception as e:
        print(f"Anomaly error: {e}")
    
    print("\nAnalytics complete.")