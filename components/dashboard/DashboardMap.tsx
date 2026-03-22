'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Users } from 'lucide-react';

// Dynamic imports for Leaflet to fix SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(m => m.GeoJSON), { ssr: false });

const getRiskColor = (score: number, view: string) => {
  if (view === 'disease') {
    if (score > 70) return '#b91c1c'; // Dark Red
    if (score > 40) return '#d97706'; // Amber/Orange
    return '#059669'; // Emerald Green
  }
  // Maternal view
  if (score > 70) return '#6d28d9';
  if (score > 40) return '#8b5cf6';
  return '#c4b5fd';
};

export default function DashboardMap() {
  const [view, setView] = useState<'disease' | 'maternal'>('disease');
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wards/geojson?view=${view}&days=7`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setGeoData(data);
    } catch (err) {
      console.error("Failed to load map data", err);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const wardStyle = (feature: any) => {
    const { riskScore, isStale } = feature.properties;
    return {
      fillColor: isStale ? '#94a3b8' : getRiskColor(riskScore || 0, view),
      weight: 1,
      opacity: 1,
      color: '#ffffff',
      dashArray: isStale ? '4, 4' : '0',
      fillOpacity: isStale ? 0.3 : 0.7,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const { name, total_pop, metric, riskScore, isStale } = feature.properties;
    layer.bindPopup(`
      <div class="p-2 font-sans min-w-[160px]">
        <div class="flex justify-between items-center mb-1">
          <p class="font-bold text-slate-800 text-sm">${name}</p>
          ${isStale ? '<span class="bg-slate-200 text-slate-600 text-[9px] px-1 py-0.5 rounded font-bold tracking-wider">STALE (>48H)</span>' : ''}
        </div>
        <div class="space-y-1.5 text-xs">
          <div class="flex justify-between text-slate-500">
            <span>Pop: ${total_pop?.toLocaleString() || 0}</span>
          </div>
          <div class="bg-slate-50 p-2 rounded border border-slate-200">
            <p class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">${view === 'disease' ? 'Active Cases' : 'High Risk Pregnancies'}</p>
            <p class="text-base font-bold text-slate-800">${metric || 0}</p>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <div class="h-1.5 flex-1 bg-slate-200 rounded-sm overflow-hidden">
              <div class="h-full bg-blue-600" style="width: ${riskScore || 0}%"></div>
            </div>
            <span class="font-bold text-slate-700 text-[10px]">${riskScore || 0}% Risk</span>
          </div>
        </div>
      </div>
    `);
  };

  return (
    <Card className="h-full border-slate-200 shadow-sm overflow-hidden flex flex-col rounded-sm">
      <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-white shrink-0">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Main GIS Heat Map</h3>
          <p className="text-[10px] text-slate-500 font-medium">Real-time Prabhag Risk Tracking</p>
        </div>
        <div className="flex bg-slate-100 p-0.5 rounded-sm">
          <Button
            variant={view === 'disease' ? 'default' : 'ghost'}
            size="sm"
            className={view === 'disease' ? 'bg-white text-blue-700 shadow-sm h-7 text-xs px-2' : 'h-7 text-xs text-slate-500 px-2'}
            onClick={() => setView('disease')}
          >
            <Layers className="h-3 w-3 mr-1.5" /> Outbreak
          </Button>
          <Button
            variant={view === 'maternal' ? 'default' : 'ghost'}
            size="sm"
            className={view === 'maternal' ? 'bg-white text-purple-700 shadow-sm h-7 text-xs px-2' : 'h-7 text-xs text-slate-500 px-2'}
            onClick={() => setView('maternal')}
          >
            <Users className="h-3 w-3 mr-1.5" /> Maternal
          </Button>
        </div>
      </div>
      
      <div className="flex-1 relative min-h-[400px]">
        <MapContainer
          key={`map-${view}`}
          center={[17.68, 75.92]}
          zoom={12}
          style={{ height: '100%', width: '100%', backgroundColor: '#f1f5f9' }}
          zoomControl={true}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          {geoData && (
            <GeoJSON
              key={`${view}-${geoData.features.length}-${geoData.features.reduce((acc: number, f: any) => acc + (f.properties.riskScore || 0), 0)}`}
              data={geoData}
              style={wardStyle}
              onEachFeature={onEachFeature}
            />
          )}
        </MapContainer>

        {/* Custom Legend to match Reference Image */}
        <div className="absolute top-4 right-4 z-[400] bg-white/95 p-3 rounded-sm shadow-md border border-slate-200 w-44">
          <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Prevalence Index</h4>
          <div className="space-y-1.5 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-[#b91c1c] rounded-sm" /> <span>High Risk (&gt;70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-[#d97706] rounded-sm" /> <span>Moderate (40-70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-[#059669] rounded-sm" /> <span>Low (&lt;40%)</span>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-100">
              <div className="w-3.5 h-3.5 bg-[#94a3b8] rounded-sm border border-dashed border-slate-400" /> <span className="text-[10px]">Stale Data (&gt;48H)</span>
            </div>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-[1000] flex items-center justify-center">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-sm shadow-lg border border-slate-200">
              <div className="h-3.5 w-3.5 border-2 border-blue-600 border-t-transparent animate-spin rounded-full"></div>
              <span className="text-xs font-bold tracking-wider text-slate-700 uppercase">Syncing...</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
