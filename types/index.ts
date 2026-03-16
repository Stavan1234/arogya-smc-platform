// types/index.ts

export interface Ward {
  code: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  boundary_geojson?: any; // GeoJSON object
}

export interface Facility {
  id: number;
  name: string;
  ward_code: string;
  location_lat: number;
  location_lng: number;
  contact: string;
  beds_total: number;
  beds_available: number;
  icu_total: number;
  icu_available: number;
  ventilators_total: number;
  ventilators_available: number;
  oxygen_available: boolean;
  last_updated: string; // ISO date
}

export interface Advisory {
  id: number;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  ward_code: string | null;
  published_at: string;
  expires_at: string | null;
}

export interface Alert {
  id: number;
  type: 'outbreak' | 'resource' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ward_code: string;
  title: string;
  description: string;
  generated_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  status: 'active' | 'acknowledged' | 'resolved';
}

export interface DashboardSummary {
  totalWards: number;
  highRiskWards: number;
  activeAlerts: number;
  totalBedsAvailable: number;
  // add more as needed
}

export interface TrendDataPoint {
  date: string;
  fever: number;
  cough: number;
  diarrhea: number;
}