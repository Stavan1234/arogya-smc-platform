'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Package, Droplets, Stethoscope, Truck, Map as MapIcon, RefreshCw, Layers } from 'lucide-react';

const InventoryMap = dynamic(() => import('@/components/dashboard/InventoryMap'), { ssr: false });

export default function ResourcesPage() {
  const [data, setData] = useState<any>({ kpiMetrics: null, supplyHeatmap: null, distributionLog: [], forecast: [] });
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/wards/geojson').then(res => res.json()),
      fetch('/api/dashboard/resources').then(res => res.json())
    ])
    .then(([geoJson, resData]) => {
      setGeoData(geoJson);
      setData(resData.error ? {
         kpiMetrics: {
           vaccineColdChain: { stock: 0, target: 0, status: 'Red' },
           maternalKits: { balance: 0, status: 'Red' },
           childSupplements: { ashaHands: 0, status: 'Red' },
           emergencyAssets: { activeO2: 0, ambulances: 0, status: 'Red' }
         },
         supplyHeatmap: {},
         distributionLog: [],
         forecast: []
      } : resData);
      setLoading(false);
    })
    .catch(err => {
      console.error('Failed to load resources data:', err);
      setLoading(false);
    });
  }, []);

  const getTrafficColor = (status: string) => {
     if (status === 'Green') return 'bg-[#22c55e] border-[#16a34a]';
     if (status === 'Yellow') return 'bg-[#f59e0b] border-[#d97706]';
     if (status === 'Red') return 'bg-[#ef4444] border-[#dc2626]';
     return 'bg-slate-300 border-slate-400';
  };

  const getTrafficText = (status: string) => {
     if (status === 'Green') return 'text-[#15803d]';
     if (status === 'Yellow') return 'text-[#b45309]';
     if (status === 'Red') return 'text-[#b91c1c]';
     return 'text-slate-600';
  };

  const kpis = data.kpiMetrics;

  return (
    <div className="h-full flex flex-col font-sans bg-slate-100 max-w-[1920px] 2xl:mx-auto space-y-3">
      
      {/* 1. Header Section */}
      <div className="bg-[#1e3a8a] shadow-sm border-b border-[#172554] p-3 flex items-center justify-between shrink-0">
        <div className="flex items-center text-white space-x-2">
           <Package className="h-5 w-5 text-blue-300" />
           <h1 className="text-sm font-bold tracking-widest uppercase">Global Inventory Health</h1>
        </div>
        <div className="text-[10px] font-semibold text-blue-200 tracking-widest uppercase flex items-center">
           Solapur Central Repository <RefreshCw className={loading ? "ml-2 h-3 w-3 animate-spin" : "ml-2 h-3 w-3"} />
        </div>
      </div>

      {/* 2. KPI Traffic Light Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 px-3 shrink-0">
        
        {/* Vaccine Cold Chain */}
        <div className="border border-slate-300 bg-white shadow-sm flex items-stretch h-[80px]">
           <div className={`w-3 border-r shrink-0 ${getTrafficColor(kpis?.vaccineColdChain?.status)}`} />
           <div className="flex-1 p-3 flex flex-col justify-center relative overflow-hidden">
               <Droplets className="absolute right-2 top-2 h-12 w-12 text-blue-50 opacity-50 pointer-events-none" />
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Vaccine Cold Chain</p>
               <h3 className={`text-xl font-extrabold leading-none tracking-tight ${getTrafficText(kpis?.vaccineColdChain?.status)}`}>
                  {kpis?.vaccineColdChain?.stock?.toLocaleString() || 0} <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">/ {kpis?.vaccineColdChain?.target?.toLocaleString() || 0}</span>
               </h3>
           </div>
        </div>

        {/* Maternal Nutrition Kits */}
        <div className="border border-slate-300 bg-white shadow-sm flex items-stretch h-[80px]">
           <div className={`w-3 border-r shrink-0 ${getTrafficColor(kpis?.maternalKits?.status)}`} />
           <div className="flex-1 p-3 flex flex-col justify-center relative overflow-hidden">
               <Package className="absolute right-2 top-2 h-12 w-12 text-blue-50 opacity-50 pointer-events-none" />
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Maternal Nutrition Kits</p>
               <h3 className={`text-xl font-extrabold leading-none tracking-tight ${getTrafficText(kpis?.maternalKits?.status)}`}>
                  {kpis?.maternalKits?.balance?.toLocaleString() || 0} <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Units PHC</span>
               </h3>
           </div>
        </div>

        {/* Child Growth Supplements */}
        <div className="border border-slate-300 bg-white shadow-sm flex items-stretch h-[80px]">
           <div className={`w-3 border-r shrink-0 ${getTrafficColor(kpis?.childSupplements?.status)}`} />
           <div className="flex-1 p-3 flex flex-col justify-center relative overflow-hidden">
               <Stethoscope className="absolute right-2 top-2 h-12 w-12 text-blue-50 opacity-50 pointer-events-none" />
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Child Growth Supplements</p>
               <h3 className={`text-xl font-extrabold leading-none tracking-tight ${getTrafficText(kpis?.childSupplements?.status)}`}>
                  {kpis?.childSupplements?.ashaHands?.toLocaleString() || 0} <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">With ASHA</span>
               </h3>
           </div>
        </div>

        {/* Emergency Assets */}
        <div className="border border-slate-300 bg-white shadow-sm flex items-stretch h-[80px]">
           <div className={`w-3 border-r shrink-0 ${getTrafficColor(kpis?.emergencyAssets?.status)}`} />
           <div className="flex-1 p-3 flex flex-col justify-center relative overflow-hidden">
               <Truck className="absolute right-2 top-2 h-12 w-12 text-blue-50 opacity-50 pointer-events-none" />
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Emergency Assets</p>
               <div className="flex items-baseline space-x-3">
                 <h3 className={`text-xl font-extrabold leading-none tracking-tight ${getTrafficText(kpis?.emergencyAssets?.status)}`}>
                    {kpis?.emergencyAssets?.activeO2?.toLocaleString() || 0} <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">O2</span>
                 </h3>
                 <h3 className={`text-xl font-extrabold leading-none tracking-tight ${getTrafficText(kpis?.emergencyAssets?.status)}`}>
                    {kpis?.emergencyAssets?.ambulances?.toLocaleString() || 0} <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Amb</span>
                 </h3>
               </div>
           </div>
        </div>

      </div>

      {/* Main Content Area: Map & Analytics */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden p-3 pt-0">
        
        {/* Left Panel - Supply/Demand Heatmap */}
        <div className="w-full lg:w-5/12 border border-slate-300 bg-white shadow-sm flex flex-col relative h-[400px] lg:h-full shrink-0">
           <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
               <h3 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest flex items-center">
                  <MapIcon className="h-3.5 w-3.5 mr-1.5 text-slate-600" /> 
                  Supply vs. Demand Mapping
               </h3>
               <div className="flex items-center space-x-3">
                  <div className="flex items-center text-[9px] font-bold text-slate-500 tracking-wider">
                     <div className="w-2 h-2 border border-[#dc2626] bg-[#ef4444] mr-1" /> Shortage
                  </div>
                  <div className="flex items-center text-[9px] font-bold text-slate-500 tracking-wider">
                     <div className="w-2 h-2 border border-[#16a34a] bg-[#22c55e] mr-1" /> Sufficient
                  </div>
               </div>
           </div>
           
           <div className="flex-1 relative bg-slate-100">
             {geoData && !loading ? (
                <InventoryMap geoData={geoData} supplyHeatmap={data.supplyHeatmap} />
             ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 border-2 border-slate-400 border-t-transparent animate-spin rounded-full"></div>
                </div>
             )}
           </div>
        </div>

        {/* Right Panel - ASHA Field Distribution Table */}
        <div className="flex-1 border border-slate-300 bg-white shadow-sm flex flex-col overflow-hidden">
           <div className="p-2 border-b-2 border-slate-800 bg-slate-50 flex items-center justify-between shrink-0">
               <h3 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest flex items-center">
                  <Layers className="h-3.5 w-3.5 mr-1.5 text-slate-600" /> 
                  ASHA Field Distribution Log
               </h3>
               <span className="text-[9px] font-bold text-slate-500 uppercase">Live Tracking</span>
           </div>
           
           <div className="flex-1 overflow-auto bg-white">
              <table className="w-full text-left border-collapse">
                 <thead className="bg-[#f8fafc] sticky top-0 z-10 box-border border-b border-slate-300 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <tr>
                       <th className="py-2.5 px-3 whitespace-nowrap">Ward No</th>
                       <th className="py-2.5 px-3 whitespace-nowrap border-l border-slate-200">Resource Type</th>
                       <th className="py-2.5 px-3 text-right whitespace-nowrap border-l border-slate-200">Target Beneficiaries</th>
                       <th className="py-2.5 px-3 text-right whitespace-nowrap border-l border-slate-200">Distributed Today</th>
                       <th className="py-2.5 px-3 text-center whitespace-nowrap border-l border-slate-200">Compliance</th>
                    </tr>
                 </thead>
                 <tbody>
                    {loading ? (
                       <tr>
                          <td colSpan={5} className="text-center py-10 text-xs font-bold text-slate-400 uppercase tracking-widest">
                             Syncing distribution databases...
                          </td>
                       </tr>
                    ) : data.distributionLog.length === 0 ? (
                       <tr>
                          <td colSpan={5} className="text-center py-10 text-xs font-bold text-slate-400 uppercase tracking-widest">
                             No distribution logs retrieved.
                          </td>
                       </tr>
                    ) : (
                       data.distributionLog.map((log: any) => (
                          <tr key={log.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                             <td className="py-2.5 px-3">
                                <span className="text-xs font-extrabold text-slate-800">{String(log.ward_no).padStart(2, '0')}</span>
                             </td>
                             <td className="py-2.5 px-3 border-l border-slate-100">
                                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 whitespace-nowrap">{log.resource}</span>
                             </td>
                             <td className="py-2.5 px-3 text-right border-l border-slate-100">
                                <span className="text-xs font-semibold text-slate-600">{log.target.toLocaleString()}</span>
                             </td>
                             <td className="py-2.5 px-3 text-right border-l border-slate-100">
                                <span className="text-xs font-extrabold text-slate-800">{log.distributed.toLocaleString()}</span>
                             </td>
                             <td className="py-2.5 px-3 text-center border-l border-slate-100 relative">
                                <div className="flex flex-col items-center justify-center">
                                   <span className={`text-[11px] font-extrabold ${log.compliance >= 80 ? 'text-[#16a34a]' : log.compliance >= 50 ? 'text-[#d97706]' : 'text-[#dc2626]'}`}>
                                      {log.compliance}%
                                   </span>
                                   <div className="w-16 h-1 mt-1 bg-slate-200 overflow-hidden">
                                      <div 
                                         className={`h-full ${log.compliance >= 80 ? 'bg-[#22c55e]' : log.compliance >= 50 ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'}`} 
                                         style={{ width: `${log.compliance}%` }}
                                      />
                                   </div>
                                </div>
                             </td>
                          </tr>
                       ))
                    )}
                 </tbody>
              </table>

              {data.forecast && data.forecast.length > 0 && (
                <div className="mt-6 border-t pt-4 px-3 mb-4">
                  <h3 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest mb-2">Resource Demand Forecast (Next 7 Days)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="p-2">Ward</th>
                          <th className="p-2">Resource</th>
                          <th className="p-2">Date</th>
                          <th className="p-2 text-right">Predicted Demand</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.forecast.map((f: any, i: number) => (
                          <tr key={i} className="border-t border-slate-200">
                            <td className="p-2 font-medium">Ward {f.ward_code}</td>
                            <td className="p-2">{f.resource_type}</td>
                            <td className="p-2 text-slate-600">{new Date(f.forecast_date).toLocaleDateString()}</td>
                            <td className="p-2 text-right font-semibold">{f.predicted_demand}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}
