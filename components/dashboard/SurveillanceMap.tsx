'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Clock } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface SurveillanceMapProps {
  disease: string;
  span: string;
  geoData: any;
  mapData: any;
  loading: boolean;
  onMapReady?: (map: any) => void;
}

const MapInternal = ({ onMapReady }: { onMapReady?: (map: any) => void }) => {
  const map = useMap();
  useEffect(() => {
    if (onMapReady) onMapReady(map);
  }, [map, onMapReady]);
  return null;
};

export default function SurveillanceMap({ disease, span, geoData, mapData, loading, onMapReady }: SurveillanceMapProps) {
  // Incidence rate color helper
  const getIncidenceColor = (rate: number) => {
    if (rate > 5) return '#b91c1c'; // Red (>5 per 1000)
    if (rate > 2) return '#ea580c'; // Orange
    if (rate > 0) return '#eab308'; // Yellow
    return '#f8fafc'; // White/Gray for 0
  };

  const wardStyle = (feature: any) => {
    if (!mapData || !mapData.wardStats) return { weight: 1, color: '#94a3b8', fillOpacity: 0.1 };
    
    const code = feature.properties.code; 
    const stat = mapData.wardStats[String(code)]; 
    
    if (stat?.isStale) {
      return {
        fillColor: '#cbd5e1',
        weight: 2,
        opacity: 1,
        color: '#64748b',
        dashArray: '5, 5',
        fillOpacity: 0.5,
      };
    }

    const rate = stat?.incidenceRate || 0;
    return {
      fillColor: rate > 0 ? getIncidenceColor(rate) : '#f1f5f9',
      weight: 1.5,
      opacity: 1,
      color: '#cbd5e1', 
      fillOpacity: 0.6,
    };
  };

  return (
    <div className="flex-1 w-full h-full relative">
      <div className="absolute top-4 left-14 z-[400] bg-white/95 p-2 rounded-sm shadow-md border border-slate-200 pointer-events-none">
         <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1 mb-1 shadow-sm">Map Layers Active</h4>
         <p className="text-[9px] text-slate-600 font-semibold flex items-center gap-1.5"><span className="h-2 w-2 bg-slate-200 border border-slate-400"></span> Solapur Ward Boundaries</p>
         <p className="text-[9px] text-slate-600 font-semibold flex items-center gap-1.5 mt-1"><span className="h-2 w-2 rounded-full bg-red-500 blur-[1px]"></span> Heatmap (Point Density)</p>
         <p className="text-[9px] text-slate-600 font-semibold flex items-center gap-1.5 mt-1"><span className="h-2 w-2 rounded-full border-2 border-red-700 bg-white"></span> Cluster Markers</p>
      </div>
      
      <MapContainer
        key={`map-${disease}-${span}`}
        center={[17.68, 75.92]}
        zoom={13}
        style={{ height: '100%', width: '100%', backgroundColor: '#f8fafc' }}
        zoomControl={true}
      >
        <MapInternal onMapReady={onMapReady} />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        
        {geoData && (
           <GeoJSON
             data={geoData}
             style={wardStyle}
           />
        )}

        {mapData?.heatmapPoints?.map((pt: any, i: number) => (
           <CircleMarker 
              key={i} 
              center={[pt[0], pt[1]]} 
              radius={pt[2] * 20} 
              pathOptions={{ fillColor: '#ef4444', fillOpacity: pt[2] * 0.5, stroke: false }} 
           />
        ))}

        {mapData?.clusters?.map((c: any) => {
          const icon = L.divIcon({
            className: 'custom-cluster-icon',
            html: `<div style="background-color: white; border: 2px solid #b91c1c; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: #b91c1c;">${c.case_count}</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          return (
            <Marker key={c.case_id} position={[c.lat, c.lng]} icon={icon}>
               <Popup className="rounded-sm font-sans border border-slate-200">
                  <div className="p-1 min-w-[150px]">
                     <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase border-b border-slate-100 pb-1 mb-1">Cluster Detail</p>
                     <p className="text-xs font-semibold text-slate-800"><span className="text-slate-500">Case ID:</span> {c.case_id}</p>
                     <p className="text-xs font-semibold text-slate-800"><span className="text-slate-500">Cases:</span> <span className="text-red-600 font-bold">{c.case_count}</span></p>
                     <p className="text-[10px] font-semibold text-slate-500 mt-1 flex items-center"><Clock className="h-3 w-3 mr-1"/> {new Date(c.date).toLocaleDateString()}</p>
                     <p className="text-[10px] font-semibold text-slate-500 mt-0.5">ASHA: {c.asha_id}</p>
                  </div>
               </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {loading && (
        <div className="absolute inset-0 bg-white/40 z-[1000] flex items-center justify-center backdrop-blur-[1px]">
          <div className="bg-white border-2 border-[#1e3a8a] px-4 py-2 flex items-center">
            <div className="h-4 w-4 border-2 border-[#1e3a8a] border-t-transparent animate-spin rounded-full mr-2"></div>
            <span className="text-xs font-bold tracking-widest text-[#1e3a8a] uppercase">Crunching Surveillance Data...</span>
          </div>
        </div>
      )}
    </div>
  );
}
