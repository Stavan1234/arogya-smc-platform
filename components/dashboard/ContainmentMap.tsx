'use client';

import React from 'react';
import { MapContainer, TileLayer, GeoJSON, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface ContainmentMapProps {
  geoData: any;
  outbreaks: any[];
}

export default function ContainmentMap({ geoData, outbreaks }: ContainmentMapProps) {
  // Filter for Active or Investigative outbreaks that have valid coordinates
  const markers = outbreaks.filter(o => o.lat && o.lng && o.status !== 'Contained');

  const wardStyle = {
    fillColor: '#f1f5f9',
    weight: 1,
    opacity: 1,
    color: '#cbd5e1', 
    fillOpacity: 0.2,
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
             key={geoData?.features?.[0]?.properties?.code || 'geojson_key'}
             data={geoData}
             style={wardStyle}
           />
        )}

        {/* 500m Containment Zones */}
        {markers.map((outbreak, idx) => (
           <Circle 
             key={idx}
             center={[outbreak.lat, outbreak.lng]}
             radius={500}
             pathOptions={{ 
               color: outbreak.status === 'Active' ? '#ef4444' : '#f59e0b', 
               fillColor: outbreak.status === 'Active' ? '#fca5a5' : '#fde68a', 
               fillOpacity: 0.5,
               weight: 2
             }}
           >
             <Popup className="rounded-none font-sans border-0 shadow-sm p-0 m-0 custom-popup min-w-[180px]">
                <div className="p-2 border-t-4 border-[#ef4444]">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-1">Containment Zone (500m)</p>
                   <h4 className="text-xs font-bold text-slate-800">{outbreak.ward}</h4>
                   <p className="text-xs font-semibold text-red-600 mt-1">{outbreak.disease}</p>
                   <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">{outbreak.note}</p>
                </div>
             </Popup>
           </Circle>
        ))}
      </MapContainer>
    </div>
  );
}
