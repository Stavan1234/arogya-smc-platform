'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Search, MapPin, Activity, Calendar, ShieldAlert, UserCheck, AlertTriangle } from 'lucide-react';

const AshaMap = dynamic(() => import('@/components/dashboard/AshaMap'), { ssr: false });

export default function AshaDirectoryPage() {
  const [data, setData] = useState<any>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/wards/geojson').then(res => res.json()),
      fetch('/api/dashboard/asha/intelligence').then(res => res.json())
    ])
    .then(([geo, apiData]) => {
      setGeoData(geo);
      setData(apiData);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  // Filter Directory Logic
  const filteredDirectory = useMemo(() => {
    if (!data?.directory) return [];
    
    return data.directory.filter((asha: any) => {
       const term = searchQuery.toLowerCase();
       return asha.name.toLowerCase().includes(term) || 
              String(asha.id).toLowerCase().includes(term) || 
              asha.assigned_ward.toString().includes(term);
    });
  }, [data, searchQuery]);

  return (
    <div className="h-full flex flex-col font-sans bg-slate-100 max-w-[1920px] 2xl:mx-auto space-y-3 relative overflow-hidden">
      
      {/* 1. Primary Header Section */}
      <div className="bg-[#1e3a8a] shadow-sm border-b border-[#172554] p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center text-white space-x-2 shrink-0">
           <UserCheck className="h-5 w-5 text-[#60a5fa]" />
           <h1 className="text-sm font-bold tracking-widest uppercase">ASHA Field Force Portal</h1>
        </div>
        
        <div className="flex bg-white/10 px-2 py-1 border border-white/20 items-center">
           <Search className="w-3.5 h-3.5 text-blue-200 mr-2" />
           <input 
              type="text" 
              placeholder="Filter ID, Name, Ward..." 
              className="bg-transparent border-none outline-none text-xs text-white placeholder:text-blue-200/50 w-64"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
           />
        </div>
      </div>

      {/* 2. Performance KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 px-3 shrink-0">
        
        <div className="border border-slate-300 bg-white shadow-sm flex items-stretch h-[80px]">
           <div className="w-3 border-r shrink-0 bg-[#2563eb] border-[#1d4ed8]" />
           <div className="flex-1 p-3 flex flex-col justify-center relative overflow-hidden">
               <UserCheck className="absolute right-2 top-2 h-12 w-12 text-blue-50 opacity-50 pointer-events-none" />
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Total ASHA Force</p>
               <h3 className="text-xl font-extrabold leading-none tracking-tight text-slate-800">
                  {loading ? '...' : data?.kpis?.totalForce.toLocaleString()}
               </h3>
           </div>
        </div>

        <div className="border border-slate-300 bg-white shadow-sm flex items-stretch h-[80px]">
           <div className="w-3 border-r shrink-0 bg-[#16a34a] border-[#15803d]" />
           <div className="flex-1 p-3 flex flex-col justify-center relative overflow-hidden">
               <MapPin className="absolute right-2 top-2 h-12 w-12 text-blue-50 opacity-50 pointer-events-none" />
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Field Presence (24h)</p>
               <h3 className="text-xl font-extrabold leading-none tracking-tight text-[#16a34a]">
                  {loading ? '...' : data?.kpis?.fieldPresence.toLocaleString()}
               </h3>
           </div>
        </div>

        <div className="border border-slate-300 bg-white shadow-sm flex items-stretch h-[80px]">
           <div className="w-3 border-r shrink-0 bg-[#ef4444] border-[#dc2626]" />
           <div className="flex-1 p-3 flex flex-col justify-center relative overflow-hidden">
               <ShieldAlert className="absolute right-2 top-2 h-12 w-12 text-blue-50 opacity-50 pointer-events-none" />
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Compliance Defaulters</p>
               <h3 className="text-xl font-extrabold leading-none tracking-tight text-[#ef4444]">
                  {loading ? '...' : data?.kpis?.defaulters.toLocaleString()}
               </h3>
           </div>
        </div>

        <div className="border border-slate-300 bg-white shadow-sm flex items-stretch h-[80px]">
           <div className="w-3 border-r shrink-0 bg-[#8b5cf6] border-[#7c3aed]" />
           <div className="flex-1 p-3 flex flex-col justify-center relative overflow-hidden">
               <Activity className="absolute right-2 top-2 h-12 w-12 text-blue-50 opacity-50 pointer-events-none" />
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Total Field Pings (Today)</p>
               <h3 className="text-xl font-extrabold leading-none tracking-tight text-[#8b5cf6]">
                  {loading ? '...' : data?.kpis?.fieldPings.toLocaleString()}
               </h3>
           </div>
        </div>

      </div>

      {/* Main Content Area: GIS Map & Directory */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden p-3 pt-0">
        
        {/* Left Panel - Activity Cluster Map */}
        <div className="w-full lg:w-5/12 border border-slate-300 bg-white shadow-sm flex flex-col relative h-[400px] lg:h-full shrink-0">
           <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
               <h3 className="text-[11px] font-extrabold text-[#1e293b] uppercase tracking-widest flex items-center">
                  <MapPin className="h-3.5 w-3.5 mr-1.5 text-slate-600" /> 
                  48h Activity Clusters
               </h3>
               <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center">
                  <span className="w-2 h-2 bg-[#2563eb] border border-[#1e40af] rounded-full mr-1"></span> Live GPS Heatmap
               </span>
           </div>
           
           <div className="flex-1 relative bg-slate-100">
             {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 border-2 border-[#1e3a8a] border-t-transparent animate-spin rounded-full"></div>
                </div>
             ) : (
                <AshaMap geoData={geoData} mapData={data?.mapData} />
             )}
           </div>
        </div>

        {/* Right Panel - Workforce Directory List View */}
        <div className="flex-1 border border-slate-300 bg-white shadow-sm flex flex-col overflow-hidden">
           <div className="p-2 border-b-2 border-slate-800 bg-slate-50 flex items-center justify-between shrink-0">
               <h3 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest flex items-center">
                  <UserCheck className="h-3.5 w-3.5 mr-1.5 text-slate-600" /> 
                  Workforce Directory & Compliance
               </h3>
               <span className="text-[9px] font-bold text-[#16a34a] uppercase bg-[#dcfce7] border border-[#86efac] px-1.5 py-0.5">
                  Synchronized
               </span>
           </div>
           
           <div className="flex-1 overflow-auto bg-white">
              <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-900 sticky top-0 z-10 box-border text-[10px] font-bold text-white uppercase tracking-widest shadow-sm">
                    <tr>
                       <th className="py-2.5 px-3 whitespace-nowrap">Worker ID & Name</th>
                       <th className="py-2.5 px-3 whitespace-nowrap border-l border-slate-700">Assignment</th>
                       <th className="py-2.5 px-3 whitespace-nowrap border-l border-slate-700">Last Sync</th>
                       <th className="py-2.5 px-3 whitespace-nowrap border-l border-slate-700 text-center">Status</th>
                       <th className="py-2.5 px-3 whitespace-nowrap border-l border-slate-700 text-left w-32">Weekly Volume</th>
                    </tr>
                 </thead>
                 <tbody>
                    {loading ? (
                       <tr>
                          <td colSpan={5} className="text-center py-10 text-xs font-bold text-slate-400 uppercase tracking-widest">
                             Loading Directory...
                          </td>
                       </tr>
                    ) : filteredDirectory.length === 0 ? (
                       <tr>
                          <td colSpan={5} className="text-center py-10 text-xs font-bold text-slate-400 uppercase tracking-widest">
                             No Workforce Entries Match Filters.
                          </td>
                       </tr>
                    ) : (
                       filteredDirectory.map((asha: any) => {
                          const isOverdue = asha.status === 'Overdue';
                          const volumePct = Math.min(100, Math.round((asha.submitted / asha.target) * 100));

                          // Relative time formatting parsing
                          const parseRelative = (isoString: string) => {
                             const diffMins = Math.floor((new Date().getTime() - new Date(isoString).getTime()) / 60000);
                             if (diffMins < 60) return `${diffMins}m ago`;
                             const diffHrs = Math.floor(diffMins / 60);
                             if (diffHrs < 24) return `${diffHrs}h ago`;
                             return `${Math.floor(diffHrs / 24)}d ago`;
                          };

                          return (
                             <tr key={asha.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-3">
                                   <div className="flex flex-col">
                                     <span className="text-xs font-extrabold text-[#1e293b] flex items-center">
                                         {asha.name}
                                         {asha.outOfBounds && (
                                            <span title="Reported outside assigned boundary" className="ml-1.5 flex items-center text-[9px] bg-red-100 text-red-700 border border-red-300 px-1 py-0.5 rounded-sm uppercase tracking-wider font-bold">
                                               <AlertTriangle className="w-3 h-3 mr-0.5" /> Out-of-Bounds
                                            </span>
                                         )}
                                     </span>
                                     <span className="text-[10px] font-bold text-slate-500">{asha.id}</span>
                                   </div>
                                </td>
                                <td className="py-2.5 px-3 border-l border-slate-100">
                                   <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 px-1.5 py-0.5">Ward {asha.assigned_ward}</span>
                                </td>
                                <td className="py-2.5 px-3 border-l border-slate-100">
                                   <div className="flex items-center text-xs font-semibold text-slate-600">
                                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> {parseRelative(asha.lastSync)}
                                   </div>
                                </td>
                                <td className="py-2.5 px-3 border-l border-slate-100 text-center">
                                   <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 ${isOverdue ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-[#16a34a] border border-green-200'}`}>
                                      {isOverdue ? 'Overdue' : 'Sync Active'}
                                   </span>
                                </td>
                                <td className="py-2.5 px-3 border-l border-slate-100">
                                   <div className="flex flex-col">
                                      <div className="flex justify-between items-center mb-0.5">
                                         <span className="text-[10px] font-bold text-slate-500">{asha.submitted} / {asha.target}</span>
                                         <span className={`text-[9px] font-extrabold ${volumePct < 50 ? 'text-[#ef4444]' : volumePct < 80 ? 'text-[#f59e0b]' : 'text-[#16a34a]'}`}>{volumePct}%</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-200 overflow-hidden">
                                         <div 
                                            className={`h-full ${volumePct < 50 ? 'bg-[#ef4444]' : volumePct < 80 ? 'bg-[#f59e0b]' : 'bg-[#16a34a]'}`} 
                                            style={{ width: `${volumePct}%` }}
                                         />
                                      </div>
                                   </div>
                                </td>
                             </tr>
                          );
                       })
                    )}
                 </tbody>
              </table>
           </div>
        </div>

      </div>
    </div>
  );
}
