'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeoJsonData = any;

export default function WardsPage() {
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/wards/geojson')
      .then(res => res.json())
      .then(data => {
        setGeoJsonData(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading map...</div>;

  const mapStyle = {
    height: '600px',
    width: '100%',
    borderRadius: '8px',
  };

  // Function to style each feature based on risk (we'll add risk data later)
  // Using random colors - feature parameter reserved for future use
  const getFeatureStyle = () => {
    // For now, random colors
    const colors = ['#fee2e2', '#fef3c7', '#d1fae5', '#dbeafe', '#f3e8ff'];
    return {
      fillColor: colors[Math.floor(Math.random() * colors.length)],
      weight: 1,
      opacity: 1,
      color: '#475569',
      fillOpacity: 0.6,
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onEachFeature = (feature: any, layer: any) => {
    layer.bindPopup(`<b>${feature.properties.name}</b><br/>Code: ${feature.properties.code}`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ward Heatmap</h1>
      <div className="bg-white p-4 rounded shadow">
        <MapContainer center={[17.68, 75.92]} zoom={12} style={mapStyle}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {geoJsonData && (
            <GeoJSON
              data={geoJsonData}
              style={getFeatureStyle}
              onEachFeature={onEachFeature}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}