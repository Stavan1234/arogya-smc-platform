'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers, Users } from 'lucide-react';
import TriagePanel, { Ward } from '@/components/dashboard/TriagePanel'; // import Ward type

// Dynamic imports for Leaflet
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(m => m.GeoJSON), { ssr: false });

const getRiskColor = (score: number, view: string) => {
  if (view === 'disease') {
    if (score > 70) return '#ef4444';
    if (score > 40) return '#f59e0b';
    return '#10b981';
  }
  // Maternal view
  if (score > 70) return '#7c3aed';
  if (score > 40) return '#a78bfa';
  return '#ddd6fe';
};

export default function WardSurveillancePage() {
  const [view, setView] = useState<'disease' | 'maternal'>('disease');
  const [days, setDays] = useState(7);
  const [geoData, setGeoData] = useState<any>(null);
  const [topWards, setTopWards] = useState<Ward[]>([]);
  const [totalAtRisk, setTotalAtRisk] = useState(0);
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wards/geojson?view=${view}&days=${days}`);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      setGeoData(data);

      // Compute top wards by riskScore
      const sorted = [...data.features]
        .sort((a, b) => b.properties.riskScore - a.properties.riskScore)
        .slice(0, 3)
        .map((f: any) => ({
          ...f.properties,
          trend: f.properties.trend || 0,
          actions: f.properties.actions || ['Call Ward In-charge', 'Review Data'],
        }));
      setTopWards(sorted);

      // Compute total at‑risk wards (metric > 0)
      const atRiskCount = data.features.filter((f: any) => f.properties.metric > 0).length;
      setTotalAtRisk(atRiskCount);
    } catch (err) {
      console.error("Failed to load surveillance data", err);
      setTopWards([]);
      setTotalAtRisk(0);
    } finally {
      setLoading(false);
    }
  }, [view, days]);

  useEffect(() => {
    fetchData();
    fetch('/api/dashboard/anomalies').then(res => res.json()).then(setAnomalies).catch(console.error);
  }, [fetchData]);

  const wardStyle = (feature: any) => {
    const { riskScore, isStale } = feature.properties;
    return {
      fillColor: isStale ? '#94a3b8' : getRiskColor(riskScore, view),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: isStale ? '5, 5' : '0',
      fillOpacity: 0.6,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const { name, total_pop, metric, riskScore, trend, isStale } = feature.properties;
    layer.bindPopup(`
      <div class="p-3 font-sans min-w-[180px]">
        <div class="flex justify-between items-start mb-2">
          <p class="font-bold text-slate-900 text-sm">${name}</p>
          ${isStale ? '<span class="bg-slate-100 text-slate-500 text-[10px] px-1 rounded">STALE</span>' : ''}
        </div>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between text-slate-500">
            <span>Pop: ${total_pop.toLocaleString()}</span>
            <span class="flex items-center font-bold ${trend > 0 ? 'text-red-500' : 'text-emerald-500'}">
              ${trend > 0 ? '↑' : '↓'} ${Math.abs(trend)}%
            </span>
          </div>
          <div class="bg-slate-50 p-2 rounded border border-slate-100">
            <p class="text-[10px] text-slate-400 uppercase font-bold">Current ${view === 'disease' ? 'Cases' : 'HRP'}</p>
            <p class="text-lg font-bold text-slate-800">${metric}</p>
          </div>
          <div class="flex items-center gap-1 mt-2">
            <div class="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-blue-600" style="width: ${riskScore}%"></div>
            </div>
            <span class="font-bold text-slate-700">${riskScore}% Risk</span>
          </div>
        </div>
      </div>
    `);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Health Command Center</h1>
          <p className="text-slate-500 text-sm">Prabhag-level Geospatial Intelligence</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
            <Button
              variant={view === 'disease' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('disease')}
            >
              <Layers className="h-4 w-4 mr-1" /> Disease
            </Button>
            <Button
              variant={view === 'maternal' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('maternal')}
            >
              <Users className="h-4 w-4 mr-1" /> Maternal
            </Button>
          </div>

          <Select value={String(days)} onValueChange={(v) => setDays(parseInt(v))}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 Hours</SelectItem>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        <Card className="lg:col-span-3 border-none shadow-sm overflow-hidden min-h-[650px] relative">
          <MapContainer
            key={`map-${view}-${days}`}
            center={[17.68, 75.92]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
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

          {loading && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-[1000] flex items-center justify-center">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg border">
                <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent animate-spin rounded-full"></div>
                <span className="text-sm font-medium text-slate-600">Syncing Ward Data...</span>
              </div>
            </div>
          )}
        </Card>

        <TriagePanel
          view={view}
          days={days}
          topWards={topWards}
          totalAtRisk={totalAtRisk}
          onAction={(action: string, ward: Ward) => {
            console.log(`Action ${action} triggered for ward ${ward.code}`);
            // Add your custom logic here
          }}
        />

        <div className="lg:col-span-4 bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col overflow-hidden h-full mt-2">
          <div className="bg-white p-2.5 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Anomaly Detection Feed</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
            {anomalies.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No anomalies detected recently</p>
            ) : (
              anomalies.map((a) => (
                <div key={a.id} className="bg-red-50 p-2 border border-red-200 rounded-sm text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-red-800">Ward {a.ward_code}</span>
                    <span className="text-[10px] text-slate-500">{new Date(a.detection_date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-700 mt-1">{a.description}</p>
                  <div className="flex justify-between mt-1 text-[10px] text-slate-600">
                    <span>Observed: {a.observed_cases}</span>
                    <span>Expected: {a.expected_cases}</span>
                    <span>Deviation: {a.deviation_score.toFixed(1)}σ</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}