'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Search, Map as MapIcon, Grid, X, PhoneCall, Building2, Activity, Clock, ShieldCheck, HeartPulse, AlertTriangle, Eye } from 'lucide-react';

const FacilityMap = dynamic(() => import('@/components/dashboard/FacilityMap'), { ssr: false });

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [viewMode, setViewMode] = useState<'GIS' | 'GRID'>('GIS');
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWard, setSelectedWard] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  useEffect(() => {
    fetch('/api/dashboard/facilities/intelligence')
      .then(res => res.json())
      .then(data => {
         if (data.facilities) {
           setFacilities(data.facilities);
         }
         setLoading(false);
      })
      .catch(err => {
         console.error(err);
         setLoading(false);
      });
  }, []);

  // Filter Logic Omni-Search
  const filteredFacilities = useMemo(() => {
    return facilities.filter(fac => {
       const matchesSearch = 
           fac.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           fac.specialties.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
           fac.ward_no.toString().includes(searchQuery);
       
       const matchesWard = selectedWard === 'All' || fac.ward_no.toString() === selectedWard;
       const matchesType = selectedType === 'All' || fac.type === selectedType;

       return matchesSearch && matchesWard && matchesType;
    });
  }, [facilities, searchQuery, selectedWard, selectedType]);

  // Unique wards and types for dropdowns
  const availableWards = Array.from(new Set(facilities.map(f => f.ward_no.toString()))).sort((a,b) => parseInt(a) - parseInt(b));
  const availableTypes = Array.from(new Set(facilities.map(f => f.type)));

  return (
    <div className="h-full flex flex-col font-sans bg-slate-100 max-w-[1920px] 2xl:mx-auto space-y-3 relative overflow-hidden">
      
      {/* 1. Header & Filters Section */}
      <div className="bg-[#1e3a8a] shadow-sm border-b border-[#172554] p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        
        <div className="flex items-center text-white space-x-2 shrink-0">
           <Building2 className="h-5 w-5 text-blue-300" />
           <h1 className="text-sm font-bold tracking-widest uppercase">Facility Intelligence Command</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           {/* Omni-Search */}
           <div className="flex items-center bg-white/10 px-2 py-1 border border-white/20">
              <Search className="w-3.5 h-3.5 text-blue-200 mr-2" />
              <input 
                type="text" 
                placeholder="Search Name, Ward, Specialty..." 
                className="bg-transparent border-none outline-none text-xs text-white placeholder:text-blue-200/50 w-48"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>

           {/* Ward Filter */}
           <select 
              value={selectedWard} 
              onChange={e => setSelectedWard(e.target.value)}
              className="bg-white/10 text-xs text-white font-semibold outline-none cursor-pointer border border-white/20 px-2 py-1"
            >
              <option value="All" className="text-slate-900">All Wards</option>
              {availableWards.map(w => <option key={w} value={w} className="text-slate-900">Ward {w}</option>)}
           </select>

           {/* Type Filter */}
           <select 
              value={selectedType} 
              onChange={e => setSelectedType(e.target.value)}
              className="bg-white/10 text-xs text-white font-semibold outline-none cursor-pointer border border-white/20 px-2 py-1"
            >
              <option value="All" className="text-slate-900">All Types</option>
              {availableTypes.map(t => <option key={t as string} value={t as string} className="text-slate-900">{t}</option>)}
           </select>

           {/* Dual-View Toggle Switch */}
           <div className="flex bg-slate-900 p-0.5 border border-[#172554]">
              <button 
                onClick={() => setViewMode('GRID')}
                className={`flex items-center px-3 py-1 text-xs font-bold uppercase transition-colors ${viewMode === 'GRID' ? 'bg-[#2563eb] text-white shadow-inner' : 'text-slate-400 hover:text-white'}`}
              >
                  <Grid className="w-3.5 h-3.5 mr-1.5" /> Grid
              </button>
              <button 
                onClick={() => setViewMode('GIS')}
                className={`flex items-center px-3 py-1 text-xs font-bold uppercase transition-colors ${viewMode === 'GIS' ? 'bg-[#2563eb] text-white shadow-inner' : 'text-slate-400 hover:text-white'}`}
              >
                  <MapIcon className="w-3.5 h-3.5 mr-1.5" /> GIS Map
              </button>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden p-3 pt-0 gap-3 relative">
         
         {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-white border border-slate-300">
               <div className="h-6 w-6 border-2 border-[#1e3a8a] border-t-transparent animate-spin rounded-full mr-3"></div>
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Aggregating Facility Vitals...</span>
            </div>
         ) : viewMode === 'GIS' ? (
            <div className="flex-1 border-2 border-slate-300 bg-white shadow-sm flex flex-col relative w-full h-full min-h-[500px]">
               {/* Map Legend Overlay */}
               <div className="absolute top-4 right-4 z-[400] bg-white/95 p-2 shadow-md border border-slate-300 hover:bg-white transition-colors">
                  <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-1 mb-1">Status Legend</h4>
                  <div className="flex items-center space-x-2 mt-1.5">
                     <span className="w-2.5 h-2.5 rounded-full border border-[#16a34a] bg-[#22c55e]"></span>
                     <span className="text-[9px] font-bold text-slate-600 uppercase">Healthy (&gt;30% Free)</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1.5">
                     <div className="relative w-2.5 h-2.5 flex items-center justify-center">
                       <span className="absolute w-full h-full rounded-full bg-[#ef4444] animate-ping opacity-75"></span>
                       <span className="relative w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span>
                     </div>
                     <span className="text-[9px] font-bold text-red-600 uppercase">Overburdened (&lt;10%)</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1.5">
                     <span className="w-2.5 h-2.5 border border-[#64748b] bg-[#94a3b8] rounded-sm"></span>
                     <span className="text-[9px] font-bold text-slate-500 uppercase">Stale Data (&gt;24h)</span>
                  </div>
               </div>

               <FacilityMap 
                 facilities={filteredFacilities} 
                 onSelectFacility={(fac) => setSelectedFacility(fac)} 
               />
            </div>
         ) : (
            <div className="flex-1 border border-slate-300 bg-white shadow-sm overflow-auto w-full h-full">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-900 sticky top-0 z-[5] box-border text-[10px] font-bold text-white uppercase tracking-widest">
                    <tr>
                       <th className="py-2.5 px-3 whitespace-nowrap">Facility Name</th>
                       <th className="py-2.5 px-3 whitespace-nowrap border-l border-slate-700">Type / Ward</th>
                       <th className="py-2.5 px-3 whitespace-nowrap border-l border-slate-700">Specialties</th>
                       <th className="py-2.5 px-3 whitespace-nowrap border-l border-slate-700 text-center">Beds Free (%)</th>
                       <th className="py-2.5 px-3 whitespace-nowrap border-l border-slate-700 text-center">Compliance (%)</th>
                       <th className="py-2.5 px-3 whitespace-nowrap border-l border-slate-700 text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody>
                    {filteredFacilities.map(fac => (
                       <tr key={fac.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedFacility(fac)}>
                          <td className="py-2.5 px-3 flex items-center">
                             {fac.markerState === 'RedPulse' && <AlertTriangle className="w-3.5 h-3.5 text-red-500 mr-2 shrink-0" />}
                             {fac.markerState === 'Gray' && <Clock className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />}
                             {fac.markerState === 'Green' && <ShieldCheck className="w-3.5 h-3.5 text-green-500 mr-2 shrink-0" />}
                             <span className="text-xs font-extrabold text-[#1e293b]">{fac.name}</span>
                          </td>
                          <td className="py-2.5 px-3 border-l border-slate-200">
                             <div className="flex items-center space-x-2">
                               <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5">{fac.type}</span>
                               <span className="text-xs font-semibold text-slate-500">W{fac.ward_no}</span>
                             </div>
                          </td>
                          <td className="py-2.5 px-3 border-l border-slate-200 text-xs font-semibold text-slate-600 truncate max-w-[200px]">
                             {fac.specialties.join(', ')}
                          </td>
                          <td className="py-2.5 px-3 border-l border-slate-200 text-center">
                             <span className={`text-xs font-extrabold ${fac.vitals.bedsFreePct < 10 ? 'text-red-600' : 'text-slate-800'}`}>
                               {fac.vitals.bedsFreePct}%
                             </span>
                          </td>
                          <td className="py-2.5 px-3 border-l border-slate-200 text-center">
                             <span className={`text-xs font-extrabold ${fac.compliance_percentage >= 80 ? 'text-[#16a34a]' : 'text-orange-600'}`}>
                               {fac.compliance_percentage}%
                             </span>
                          </td>
                          <td className="py-2.5 px-3 border-l border-slate-200 text-right">
                             <button className="text-[10px] font-bold text-[#2563eb] hover:underline uppercase tracking-wider flex items-center justify-end w-full">
                                <Eye className="w-3 h-3 mr-1" /> Profile
                             </button>
                          </td>
                       </tr>
                    ))}
                    {filteredFacilities.length === 0 && (
                       <tr>
                          <td colSpan={6} className="py-10 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No Facilities Found Matching Filters</td>
                       </tr>
                    )}
                 </tbody>
               </table>
            </div>
         )}
      </div>

      {/* 3. Facility Performance Profile (Digital Bio Sheet Overlay) */}
      {selectedFacility && (
         <>
         {/* Backdrop */}
         <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] z-[990]"
            onClick={() => setSelectedFacility(null)}
         ></div>

         {/* Sliding Panel */}
         <div className="absolute inset-y-0 right-0 w-full sm:w-[400px] bg-white border-l-2 border-slate-300 shadow-2xl z-[1000] flex flex-col transform transition-transform duration-300 translate-x-0">
            {/* Sheet Header */}
            <div className="bg-slate-900 p-4 border-b-4 border-[#2563eb] flex justify-between items-start shrink-0">
               <div className="flex-1 pr-4">
                  <div className="flex items-center space-x-2 mb-1">
                     <span className="text-[10px] font-bold bg-white/20 text-white px-1.5 py-0.5 uppercase tracking-widest">{selectedFacility.type} Facility</span>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ward {selectedFacility.ward_no}</span>
                  </div>
                  <h2 className="text-lg font-extrabold text-white leading-tight break-words">{selectedFacility.name}</h2>
               </div>
               <button onClick={() => setSelectedFacility(null)} className="p-1 hover:bg-white/10 text-slate-300 hover:text-white transition-colors shrink-0">
                  <X className="h-5 w-5" />
               </button>
            </div>

            {/* Sheet Content Scrollable */}
            <div className="flex-1 overflow-auto bg-slate-50 p-4 space-y-4">
               
               {/* Contact Actions */}
               <div className="grid grid-cols-2 gap-2">
                  <a href={`tel:${selectedFacility.phone}`} className="flex items-center justify-center p-3 bg-[#1e293b] text-white hover:bg-[#0f172a] transition-colors border border-slate-800">
                     <PhoneCall className="w-4 h-4 mr-2" />
                     <span className="text-xs font-bold tracking-widest uppercase">Direct Call</span>
                  </a>
                  <div className="p-3 bg-white border border-slate-300 flex flex-col justify-center items-center text-center">
                     <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-0.5">Last Sync</span>
                     <span className={`text-[10px] font-extrabold tracking-widest uppercase ${selectedFacility.markerState === 'Gray' ? 'text-red-500' : 'text-[#16a34a]'}`}>
                        {selectedFacility.lastReported ? new Date(selectedFacility.lastReported).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'UNKNOWN'}
                     </span>
                  </div>
               </div>

               {/* Performance Metrics: Compliance Progress */}
               <div className="bg-white border border-slate-300 p-3">
                  <div className="flex justify-between items-end mb-2">
                     <h3 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center">
                        <Activity className="h-3.5 w-3.5 mr-1" /> Reporting Compliance (v_perf)
                     </h3>
                     <span className={`text-lg font-extrabold leading-none ${selectedFacility.compliance_percentage >= 80 ? 'text-[#16a34a]' : 'text-orange-500'}`}>
                        {selectedFacility.compliance_percentage}%
                     </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 relative overflow-hidden">
                     <div 
                        className={`absolute top-0 left-0 h-full ${selectedFacility.compliance_percentage >= 80 ? 'bg-[#16a34a]' : 'bg-orange-500'}`} 
                        style={{ width: `${Math.min(100, selectedFacility.compliance_percentage)}%` }} 
                     />
                  </div>
               </div>

               {/* Live Vitals Grid */}
               <h3 className="text-[10px] font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-1 pt-2">Live Capacity Vitals</h3>
               <div className="grid grid-cols-2 gap-2">
                  
                  {/* Beds Available */}
                  <div className="bg-white border border-slate-300 p-3 flex flex-col">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">General Beds Open</span>
                     <div className="flex items-baseline space-x-1">
                        <span className={`text-2xl font-extrabold leading-none ${selectedFacility.vitals.bedsFreePct < 10 ? 'text-red-600' : 'text-slate-800'}`}>
                           {selectedFacility.vitals.beds_avail}
                        </span>
                        <span className="text-xs font-bold text-slate-400 border-l border-slate-300 pl-1">/ {selectedFacility.vitals.beds_total}</span>
                     </div>
                  </div>

                  {/* ICU Beds */}
                  <div className="bg-white border border-slate-300 p-3 flex flex-col">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">ICU Beds Open</span>
                     <div className="flex items-baseline space-x-1">
                        <span className={`text-2xl font-extrabold leading-none ${(selectedFacility.vitals.icu_avail / (selectedFacility.vitals.icu_total || 1)) < 0.2 ? 'text-red-600' : 'text-slate-800'}`}>
                           {selectedFacility.vitals.icu_avail}
                        </span>
                        <span className="text-xs font-bold text-slate-400 border-l border-slate-300 pl-1">/ {selectedFacility.vitals.icu_total}</span>
                     </div>
                  </div>

                  {/* Oxygen Stock */}
                  <div className="bg-white border text-center border-slate-300 p-3 col-span-2">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center mb-1">
                        <HeartPulse className="h-3 w-3 mr-1 text-slate-400" /> Medical Oxygen Stock
                     </span>
                     <span className="text-xl font-extrabold text-[#1d4ed8]">{selectedFacility.vitals.oxygen_stock_kg.toLocaleString()} <span className="text-[10px] text-slate-500">KG</span></span>
                  </div>

               </div>

               {/* Specialties Tags */}
               <div className="mt-4 flex flex-col pt-3 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Registered Specialties</span>
                  <div className="flex flex-wrap gap-1.5">
                     {selectedFacility.specialties.map((spec: string, i: number) => (
                        <span key={i} className="bg-slate-200 text-slate-700 text-[10px] font-extrabold uppercase px-2 py-1 tracking-wider border border-slate-300">
                           {spec}
                        </span>
                     ))}
                  </div>
               </div>

            </div>
         </div>
         </>
      )}

    </div>
  );
}