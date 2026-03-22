'use client';

import React from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface InventoryMapProps {
  geoData: any;
  supplyHeatmap: any;
}

export default function InventoryMap({ geoData, supplyHeatmap }: InventoryMapProps) {
  
  // Dynamic styling based on supply sufficiency
  const wardStyle = (feature: any) => {
    if (!supplyHeatmap) return { weight: 1, color: '#94a3b8', fillOpacity: 0.1 };
    
    const code = feature.properties.code;
    const stats = supplyHeatmap[String(code)];
    
    if (!stats) {
       return { fillColor: '#f1f5f9', weight: 1, color: '#cbd5e1', fillOpacity: 0.3 };
    }

    return {
      fillColor: stats.color, // '#22c55e' (Green) or '#ef4444' (Red)
      weight: 1.5,
      opacity: 1,
      color: '#ffffff', // Clean white borders for separation
      fillOpacity: 0.65,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const code = feature.properties.code;
    const stats = supplyHeatmap ? supplyHeatmap[String(code)] : null;
    
    if (stats) {
       const popupContent = `
         <div style="font-family: sans-serif; min-width: 160px;">
            <p style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 4px;">Supply Sufficiency</p>
            <h4 style="font-size: 12px; font-weight: 800; color: #1e293b; margin: 0;">${stats.name}</h4>
            <p style="font-size: 11px; font-weight: 600; color: #475569; margin: 4px 0 0 0;">Population: <span style="color: #0f172a;">${stats.population.toLocaleString()}</span></p>
            <p style="font-size: 11px; font-weight: 600; color: #475569; margin: 2px 0 0 0;">Required Target: <span style="color: #0f172a;">${stats.requiredThreshold.toLocaleString()}</span></p>
            <p style="font-size: 11px; font-weight: 600; color: #475569; margin: 2px 0 4px 0;">Current Stock: <span style="color: ${stats.isSufficient ? '#16a34a' : '#dc2626'}; font-weight: 800;">${stats.currentStock.toLocaleString()}</span></p>
            <div style="background-color: ${stats.isSufficient ? '#dcfce7' : '#fee2e2'}; border: 1px solid ${stats.isSufficient ? '#86efac' : '#fca5a5'}; padding: 4px; text-align: center; border-radius: 2px;">
               <span style="font-size: 10px; font-weight: 800; color: ${stats.isSufficient ? '#166534' : '#991b1b'}; text-transform: uppercase; letter-spacing: 0.05em;">${stats.isSufficient ? 'Stock Sufficient' : 'Critical Shortage'}</span>
            </div>
         </div>
       `;
       layer.bindPopup(popupContent, { className: 'custom-inventory-popup' });
    }
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
        
        {geoData && (
           <GeoJSON
             data={geoData}
             style={wardStyle}
             onEachFeature={onEachFeature}
           />
        )}
      </MapContainer>
    </div>
  );
}
