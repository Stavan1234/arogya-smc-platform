'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface FacilityMapProps {
  facilities: any[];
  onSelectFacility: (facility: any) => void;
}

export default function FacilityMap({ facilities, onSelectFacility }: FacilityMapProps) {
  
  // Create icons based on state requested: Green, RedPulse, Gray
  const createIcon = (markerState: string) => {
    let circleColor = '#22c55e'; // default green
    let pulseHtml = '';
    
    if (markerState === 'RedPulse') {
      circleColor = '#ef4444';
      pulseHtml = `<div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: #ef4444; opacity: 0.5; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`;
    } else if (markerState === 'Gray') {
      circleColor = '#94a3b8'; // Stale data
    } else if (markerState === 'Yellow') {
      circleColor = '#f59e0b';
    }

    const html = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 20px; height: 20px;">
         ${pulseHtml}
         <div style="position: relative; z-index: 10; width: 16px; height: 16px; background-color: white; border: 3px solid ${circleColor}; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>
      </div>
       <style>
         @keyframes ping {
           75%, 100% { transform: scale(3.5); opacity: 0; }
         }
       </style>
    `;

    return L.divIcon({
      className: 'custom-facility-marker',
      html,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={[17.68, 75.92]}
        zoom={13}
        style={{ height: '100%', width: '100%', backgroundColor: '#f8fafc' }}
        zoomControl={true}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        
        <MarkerClusterGroup 
           chunkedLoading 
           maxClusterRadius={40}
           polygonOptions={{
              fillColor: '#3b82f6',
              color: '#1d4ed8',
              weight: 1,
              opacity: 0.5,
              fillOpacity: 0.2
           }}
        >
          {facilities.map((fac, idx) => (
             <Marker 
               key={fac.id || idx}
               position={[fac.lat, fac.lng]}
               icon={createIcon(fac.markerState)}
               eventHandlers={{
                 click: () => onSelectFacility(fac)
               }}
             />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
