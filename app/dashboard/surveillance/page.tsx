'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer } from 'recharts';
import EpiCurveChart, { EpiDataPoint } from '@/components/dashboard/EpiCurveChart';

const SurveillanceMap = dynamic(() => import('@/components/dashboard/SurveillanceMap'), { ssr: false });
import { Layers, Activity, Clock, Search, Filter } from 'lucide-react';
export default function SurveillancePage() {
  const [disease, setDisease] = useState('All');
  const [type, setType] = useState('S'); // S, P, L
  const [span, setSpan] = useState('7d');
  
  const [mapData, setMapData] = useState<any>(null);
  const [epiData, setEpiData] = useState<EpiDataPoint[]>([]);
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState<any>(null);

  const zoomToWard = (wardCode: string) => {
    if (!geoData || !mapInstance) return;
    const feature = geoData.features.find((f: any) => f.properties.code === wardCode);
    if (feature) {
      // Approximate centroid from first coordinate in polygon
      const coords = feature.geometry.coordinates[0][0][0];
      mapInstance.flyTo([coords[1], coords[0]], 14);
    }
  };

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch GeoJSON
      const geoRes = await fetch('/api/wards/geojson');
      const geoJson = await geoRes.json();
      setGeoData(geoJson);

      // 2. Fetch Map Info
      const dataRes = await fetch(`/api/dashboard/heatmap-data?disease=${disease}&type=${type}&span=${span}`);
      const payload = await dataRes.json();
      setMapData(payload);

      // 3. Fetch EPI Curve
      const epiRes = await fetch(`/api/dashboard/epi-curve?disease=${disease}&span=${span}`);
      const epiPayload = await epiRes.json();
      setEpiData(epiPayload);
    } catch (err) {
      console.error("Failed to fetch surveillance data:", err);
    } finally {
      setLoading(false);
    }
  }, [disease, type, span]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const SPLData = [
    { name: 'Suspected (S)', value: 65, color: '#fcd34d' },
    { name: 'Presumptive (P)', value: 25, color: '#f97316' },
    { name: 'Lab-Confirmed (L)', value: 10, color: '#dc2626' }
  ];

  const hotspots = mapData?.wardStats 
    ? Object.values(mapData.wardStats).filter((w: any) => w.incidenceRate > 1).sort((a:any, b:any) => b.incidenceRate - a.incidenceRate) 
    : [];

  return (
    <div className="h-full flex flex-col font-sans bg-slate-100 max-w-[1920px] 2xl:mx-auto space-y-3">
      
      {/* 1. Header Section - Disease Command Bar */}
      <div className="bg-[#1e3a8a] shadow-md border-b border-[#172554] p-3 flex flex-wrap gap-4 items-center justify-between shrink-0">
        <div className="flex items-center text-white space-x-2">
           <Activity className="h-5 w-5 text-blue-300" />
           <h1 className="text-sm font-bold tracking-widest uppercase">Disease Surveillance Command</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Disease Selector */}
          <div className="flex items-center bg-white/10 p-1 px-2 rounded-sm border border-white/20">
            <Filter className="h-3 w-3 text-blue-200 mr-2" />
            <select 
              value={disease} 
              onChange={e => setDisease(e.target.value)}
              className="bg-transparent text-xs text-white font-semibold outline-none cursor-pointer appearance-none pr-4"
            >
              <option value="All" className="text-slate-900">All Diseases</option>
              <option value="Dengue" className="text-slate-900">Dengue</option>
              <option value="Malaria" className="text-slate-900">Malaria</option>
              <option value="Typhoid" className="text-slate-900">Typhoid</option>
              <option value="Cholera" className="text-slate-900">Cholera</option>
            </select>
          </div>

          {/* Surveillance Type Toggle */}
          <div className="flex items-center bg-white border border-slate-300 p-0.5 rounded-sm overflow-hidden">
             {['S', 'P', 'L'].map(t => (
               <button 
                 key={t}
                 onClick={() => setType(t)}
                 className={`px-3 py-1 text-xs font-bold ${type === t ? 'bg-[#2563eb] text-white shadow-inner' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
               >
                 {t === 'S' ? 'Suspected (S)' : t === 'P' ? 'Presumptive (P)' : 'Lab-Confirmed (L)'} 
               </button>
             ))}
          </div>

          {/* Time Span */}
          <div className="flex items-center bg-white border border-slate-300 p-0.5 rounded-sm overflow-hidden">
             {['24h', '7d', '30d'].map(s => (
               <button 
                 key={s}
                 onClick={() => setSpan(s)}
                 className={`px-3 py-1 text-xs font-bold uppercase ${span === s ? 'bg-slate-800 text-white shadow-inner' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
               >
                 {s} 
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden p-3 pt-0">
        
        {/* Left/Main Panel - GIS Map */}
        <div className="flex-1 border-2 border-slate-300 bg-white shadow-sm flex flex-col relative w-full h-full min-h-[500px]">
           <SurveillanceMap 
             disease={disease} 
             span={span} 
             geoData={geoData} 
             mapData={mapData} 
             loading={loading} 
             onMapReady={setMapInstance}
           />
        </div>
        
        {/* Right Sidebar - Analytics */}
        <div className="w-full lg:w-80 flex flex-col gap-3 shrink-0">
           
           {/* Active Hotspots */}
           <div className="flex-1 bg-white border border-slate-300 shadow-sm flex flex-col overflow-hidden">
              <div className="p-3 border-b border-slate-200 bg-slate-50 shrink-0 flex items-center justify-between">
                 <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Hotspots</h3>
                 <Badge className="bg-red-500 hover:bg-red-600 text-[9px] rounded-sm px-1.5 h-5 font-bold text-white">{hotspots.length}</Badge>
              </div>
              <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                {hotspots.length > 0 ? hotspots.map((ward: any, idx: number) => (
                  <div key={idx} className="bg-white border border-slate-200 p-2 mb-1.5 hover:border-slate-300 hover:shadow-sm cursor-pointer transition-all relative rounded-sm" onClick={() => zoomToWard(ward.code || ward.ward_code)}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-slate-800">{ward.name}</span>
                      {ward.isStale && <Badge variant="outline" className="text-slate-500 border-slate-300 bg-slate-100/50 text-[8px] h-4 rounded-sm px-1 font-bold">STALE</Badge>}
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Reported Cases</span>
                        <span className="text-xl font-bold text-red-600 leading-none mt-0.5">{ward.cases}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Incidence/1k</span>
                        <span className="text-sm font-bold text-amber-600">{ward.incidenceRate.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center font-semibold text-slate-400 text-xs mt-10">No active hotspots detected.</div>
                )}
              </div>
           </div>

           {/* EPI Curve */}
           <div className="flex-1 bg-white border border-slate-300 shadow-sm flex flex-col min-h-0">
             <div className="p-2 border-b border-slate-200 shrink-0">
                <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">EPI Curve</h3>
             </div>
             <div className="flex-1 min-h-0 p-2">
               {epiData.length > 0 ? (
                 <EpiCurveChart data={epiData} />
               ) : (
                 <div className="flex items-center justify-center h-full text-slate-400 text-sm font-semibold uppercase tracking-wider">No EPI data</div>
               )}
             </div>
           </div>
           
        </div>
      </div>
    </div>
  );
}

