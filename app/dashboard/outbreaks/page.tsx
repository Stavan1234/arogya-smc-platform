'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

import { Badge } from '@/components/ui/badge';
import { ShieldAlert, AlertTriangle, ShieldCheck, Crosshair, Map as MapIcon, RefreshCw, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ContainmentMap = dynamic(() => import('@/components/dashboard/ContainmentMap'), { ssr: false });

export default function OutbreaksPage() {
  const [data, setData] = useState<any>({ outbreaks: [], metrics: null });
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/wards/geojson').then(res => res.json()),
      fetch('/api/dashboard/outbreaks').then(res => res.json())
    ])
    .then(([geoJson, outbreaksResponse]) => {
      setGeoData(geoJson);
      if (outbreaksResponse.outbreaks && outbreaksResponse.metrics) {
        setData(outbreaksResponse);
      } else {
         // Fallback shape if error payload from API without throwing 500
         setData({
            outbreaks: outbreaksResponse.outbreaks || [],
            metrics: outbreaksResponse.metrics || { activeOutbreaks: 0, containmentSuccessRate: 0, topHighRiskWard: 'N/A' }
         });
      }
      setLoading(false);
    })
    .catch(err => {
      console.error('Failed to load outbreak data:', err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedWard) return;

    fetch(`/api/dashboard/trends?days=14&ward=${selectedWard}`)
      .then(res => res.json())
      .then(fetchedData => {
        const wardPredictions = data.outbreaks.find((o: any) => (o.ward_code || o.ward) === selectedWard)?.predictions || [];
        const historical = fetchedData.historical || fetchedData || [];
        const combined = [
          ...(Array.isArray(historical) ? historical : []),
          ...wardPredictions.map((p: any) => ({ ...p, predicted: true }))
        ];
        setHistoricalData(combined);
      })
      .catch(err => {
        console.error(err);
      });
  }, [selectedWard, data.outbreaks]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-[#fee2e2] text-[#b91c1c] border border-[#f87171] hover:bg-[#fef2f2] text-[9px] font-bold uppercase tracking-widest px-2 py-0 h-5 rounded-none shadow-none"><AlertTriangle className="w-3 h-3 mr-1"/> Active</Badge>;
      case 'Investigative':
        return <Badge className="bg-[#fef3c7] text-[#d97706] border border-[#fbbf24] hover:bg-[#fffbeb] text-[9px] font-bold uppercase tracking-widest px-2 py-0 h-5 rounded-none shadow-none"><Search className="w-3 h-3 mr-1"/> Investigating</Badge>;
      case 'Contained':
        return <Badge className="bg-[#dcfce7] text-[#15803d] border border-[#4ade80] hover:bg-[#f0fdf4] text-[9px] font-bold uppercase tracking-widest px-2 py-0 h-5 rounded-none shadow-none"><ShieldCheck className="w-3 h-3 mr-1"/> Contained</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col font-sans bg-slate-100 max-w-[1920px] 2xl:mx-auto space-y-3">
      
      {/* 1. Header Section */}
      <div className="bg-[#1e3a8a] shadow-sm border-b border-[#172554] p-3 flex items-center justify-between shrink-0">
        <div className="flex items-center text-white space-x-2">
           <ShieldAlert className="h-5 w-5 text-red-400" />
           <h1 className="text-sm font-bold tracking-widest uppercase">Outbreak Command Center</h1>
        </div>
        <div className="text-[10px] font-semibold text-blue-200 tracking-widest uppercase flex items-center">
           MHO Priority View - SMC Solapur <RefreshCw className={loading ? "ml-2 h-3 w-3 animate-spin" : "ml-2 h-3 w-3"} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden p-3 pt-0">
        
        {/* Left Panel - Active Crisis Monitor (High Density Table) */}
        <div className="w-full lg:w-7/12 border border-slate-300 bg-white shadow-sm flex flex-col relative h-[500px] lg:h-full shrink-0">
           <div className="p-2 border-b-2 border-slate-800 bg-slate-50 flex items-center justify-between">
              <h3 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest flex items-center">
                  <Crosshair className="h-3.5 w-3.5 mr-1.5 text-slate-600" /> 
                  Active Crisis Monitor
              </h3>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Sort: Severity (Desc)</span>
           </div>
           <div className="flex-1 overflow-auto bg-white">
              <table className="w-full text-left border-collapse">
                 <thead className="bg-[#f8fafc] sticky top-0 z-10 box-border">
                    <tr className="border-b border-slate-300">
                       <th className="py-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                       <th className="py-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap border-l border-slate-200">Ward Info</th>
                       <th className="py-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-center border-l border-slate-200">Disease</th>
                       <th className="py-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-center border-l border-slate-200">Age (Days)</th>
                       <th className="py-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-l border-slate-200 w-full">Containment Note</th>
                    </tr>
                 </thead>
                 <tbody>
                    {loading ? (
                       <tr>
                          <td colSpan={5} className="text-center py-10 text-xs font-bold text-slate-400 uppercase tracking-widest">
                             Loading Surveillance Data...
                          </td>
                       </tr>
                    ) : data.outbreaks.length === 0 ? (
                       <tr>
                          <td colSpan={5} className="text-center py-10 text-xs font-bold text-slate-400 uppercase tracking-widest">
                             No outbreaks recorded in system.
                          </td>
                       </tr>
                    ) : (
                       data.outbreaks.map((o: any) => (
                          <tr key={o.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors group">
                             <td className="py-2.5 px-3 align-top">
                                {getStatusBadge(o.status)}
                             </td>
                             <td className="py-2.5 px-3 align-top border-l border-slate-100">
                                <span className="text-xs font-bold text-slate-800 tracking-tight block">{o.ward}</span>
                             </td>
                             <td className="py-2.5 px-3 align-top text-center border-l border-slate-100">
                                <span className={'text-[11px] font-bold px-1.5 py-0.5 whitespace-nowrap ' + (o.status === 'Contained' ? 'text-slate-600 bg-slate-100' : 'text-slate-900 bg-slate-200')}>
                                   {o.disease}
                                </span>
                             </td>
                             <td className="py-2.5 px-3 align-top text-center border-l border-slate-100">
                                <span className={'text-xs font-extrabold ' + (o.status === 'Active' && o.age > 3 ? 'text-red-600' : 'text-slate-700')}>
                                   {o.age}d
                                </span>
                             </td>
                             <td className="py-2.5 px-3 align-top border-l border-slate-100 relative">
                                <p className="text-[10px] text-slate-600 leading-snug font-medium mb-1">
                                   {o.note}
                                </p>
                             </td>
                          </tr>
                       ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Right Panel - GIS Containment Map and Metrics */}
        <div className="w-full lg:w-5/12 flex flex-col gap-3 min-w-[300px] overflow-y-auto pr-1">
           
           {/* Summary Metrics */}
           <div className="grid grid-cols-2 gap-3 shrink-0">
              {/* Total Active */}
              <div className="bg-slate-900 border border-slate-800 p-3 relative overflow-hidden flex flex-col justify-center min-h-[85px]">
                 <div className="absolute top-0 right-0 w-12 h-12 bg-red-500 opacity-10 rounded-full -mr-4 -mt-4 pointer-events-none" />
                 <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Active Declared</h3>
                 <span className="text-3xl font-extrabold text-white leading-none">{data?.metrics?.activeOutbreaks || 0}</span>
              </div>
              
              {/* Success Rate */}
              <div className="bg-slate-900 border border-slate-800 p-3 relative overflow-hidden flex flex-col justify-center min-h-[85px]">
                 <div className="absolute top-0 right-0 w-12 h-12 bg-green-500 opacity-10 rounded-full -mr-4 -mt-4 pointer-events-none" />
                 <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Containment Success</h3>
                 <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-extrabold text-[#4ade80] leading-none">{data?.metrics?.containmentSuccessRate || 0}%</span>
                 </div>
              </div>

              {/* Top High-Risk Ward */}
              <div className="bg-white border text-center border-slate-300 p-3 col-span-2 relative overflow-hidden flex flex-col items-center justify-center min-h-[60px]">
                 <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Highest Risk Focus Area</h3>
                 <span className="text-[13px] font-extrabold text-[#b91c1c] uppercase tracking-wider">{data?.metrics?.topHighRiskWard || 'N/A'}</span>
              </div>
           </div>

           {/* GIS Containment Map */}
           <div className="flex-1 border border-slate-300 bg-white shadow-sm flex flex-col overflow-hidden min-h-[350px]">
              <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                  <h3 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest flex items-center">
                     <MapIcon className="h-3.5 w-3.5 mr-1.5 text-slate-600" /> 
                     Containment Zones
                  </h3>
                  <div className="flex items-center space-x-2">
                     <div className="flex items-center text-[9px] font-bold text-slate-500 tracking-wider">
                        <div className="w-2 h-2 rounded-full border border-red-500 bg-red-200 mr-1" /> Active
                     </div>
                  </div>
              </div>
              <div className="flex-1 relative bg-slate-100">
                {geoData && !loading ? (
                   <ContainmentMap geoData={geoData} outbreaks={data.outbreaks} />
                ) : (
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="h-6 w-6 border-2 border-slate-400 border-t-transparent animate-spin rounded-full"></div>
                   </div>
                )}
              </div>
           </div>

           {/* Outbreak Prediction Chart */}
           <div className="bg-white border border-slate-300 shadow-sm p-3 mt-1 shrink-0">
             <div className="flex items-center justify-between mb-3">
               <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Outbreak Prediction (7‑day forecast)</h3>
               <Select value={selectedWard} onValueChange={setSelectedWard}>
                 <SelectTrigger className="w-[180px] h-8 text-xs">
                   <SelectValue placeholder="Select Ward" />
                 </SelectTrigger>
                 <SelectContent>
                   {data.outbreaks.map((o: any) => (
                     <SelectItem key={o.ward_code || o.ward} value={o.ward_code || o.ward}>{o.ward}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             {selectedWard && (
               <div className="h-64">
                 {historicalData.length === 0 ? (
                   <div className="flex items-center justify-center h-full text-xs text-slate-400 uppercase tracking-widest">Loading Chart...</div>
                 ) : (
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={historicalData}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                       <YAxis />
                       <Tooltip />
                       <Legend />
                       <Line type="monotone" dataKey="total_cases" name="Historical Cases" stroke="#2563eb" dot={false} />
                       <Line type="monotone" dataKey="predicted_cases" name="Predicted Cases" stroke="#ef4444" strokeDasharray="5 5" dot={false} />
                     </LineChart>
                   </ResponsiveContainer>
                 )}
               </div>
             )}
           </div>
           
        </div>
      </div>
    </div>
  );
}
