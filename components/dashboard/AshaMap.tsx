'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, GeoJSON } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface AshaMapProps {
  mapData: any;
  geoData: any;
}

export default function AshaMap({ mapData, geoData }: AshaMapProps) {
  
  // Custom tiny ping icon for individual ASHA reports
  const pingIcon = L.divIcon({
    className: 'asha-ping-marker',
    html: `<div style="width: 8px; height: 8px; background-color: #3b82f6; border: 1px solid #1e40af; border-radius: 50%; box-shadow: 0 0 6px #60a5fa;"></div>`,
    iconSize: [8, 8],
    iconAnchor: [4, 4]
  });

  // GeoJSON styling for the "Activity Glow" (Ward Heatmap)
  const wardGlowStyle = (feature: any) => {
    const code = feature.properties.code;
    const heatValue = mapData?.wardHeat ? mapData.wardHeat[String(code)] : 0;
    
    // Scale opacity based on heat value (0.0 to 1.0)
    // Darker blue glow for higher frequencies
    const fillOpacity = heatValue ? Math.min(0.7, heatValue * 0.8) : 0.05;
    
    return {
      fillColor: '#2563eb', // Activity Blue
      weight: 1,
      opacity: 0.3,
      color: '#cbd5e1', // Light boundary lines
      fillOpacity: fillOpacity,
    };
  };

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={[17.68, 75.92]}
        zoom={12}
        style={{ height: '100%', width: '100%', backgroundColor: '#f8fafc' }}
        zoomControl={true}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        
        {/* Ward Activity Glow Layer */}
        {geoData && mapData && (
           <GeoJSON
             data={geoData}
             style={wardGlowStyle}
           />
        )}

        {/* Pings Cluster Layer */}
        {mapData?.pings && (
           <MarkerClusterGroup 
              chunkedLoading 
              maxClusterRadius={30}
              polygonOptions={{
                 fillColor: '#3b82f6',
                 color: '#1e40af',
                 weight: 1,
                 opacity: 0.5,
                 fillOpacity: 0.2
              }}
           >
              {mapData.pings.map((ping: any, idx: number) => (
                 <Marker 
                   key={idx}
                   position={[ping.lat, ping.lng]}
                   icon={pingIcon}
                 />
              ))}
           </MarkerClusterGroup>
        )}
      </MapContainer>
    </div>
  );
}
