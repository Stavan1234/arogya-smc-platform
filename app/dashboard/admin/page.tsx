'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Building2, Target, Megaphone, History, Search, Plus, 
  MapPin, Phone, Users, CheckCircle, Smartphone, Settings
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('USERS');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // States for Tabs
  const [users, setUsers] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  // Form States
  const [advisoryForm, setAdvisoryForm] = useState({ title: '', severity: 'Medium', ward_code: 'All', description: '' });
  const [advisoryLive, setAdvisoryLive] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [rtiConfig, setRtiConfig] = useState<any>({});

  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', role: 'ASHA', email: '', phone: '' });
  const [editingWard, setEditingWard] = useState<any>(null);
  const [wardForm, setWardForm] = useState({ total_population: 0, target_daily_reports: 0 });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'USERS') {
        const res = await fetch('/api/admin/users').then(r => r.json());
        setUsers(res.users || []);
      } else if (activeTab === 'FACILITIES') {
        const res = await fetch('/api/admin/facilities').then(r => r.json());
        setFacilities(res.facilities || []);
      } else if (activeTab === 'WARDS') {
        const res = await fetch('/api/admin/wards').then(r => r.json());
        setWards(res.wards || []);
      } else if (activeTab === 'AUDIT') {
        const res = await fetch('/api/admin/audit').then(r => r.json());
        setLogs(res.logs || []);
      } else if (activeTab === 'CONFIG') {
        try {
          const res = await fetch('/api/rti').then(r => r.json());
          setRtiConfig(res || {});
        } catch { setRtiConfig({}); }
      }
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    setShowUserModal(false);
    setNewUser({ name: '', role: 'ASHA', email: '', phone: '' });
    fetchData();
    setActionLoading(false);
  };

  const openWardModal = (ward: any) => {
    setEditingWard(ward);
    setWardForm({
      total_population: ward.total_population,
      target_daily_reports: ward.target_daily_reports,
    });
  };

  const handleBroadcastAdvisory = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setAdvisoryLive(false);
    
    await fetch('/api/admin/advisories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...advisoryForm,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        published_by: 'MO Admin'
      })
    });
    
    setAdvisoryLive(true);
    setAdvisoryForm({ title: '', severity: 'Medium', ward_code: 'All', description: '' });
    setActionLoading(false);
    
    setTimeout(() => setAdvisoryLive(false), 5000);
  };

  return (
    <div className="h-full flex flex-col font-sans bg-slate-100 max-w-[1920px] 2xl:mx-auto relative overflow-hidden">
      
      {/* Header */}
      <div className="bg-[#1e3a8a] shadow-sm border-b border-[#172554] p-3 flex items-center shrink-0">
        <ShieldCheck className="h-5 w-5 text-blue-300 mr-2" />
        <h1 className="text-sm font-bold tracking-widest text-white uppercase">System Governance command</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar Vertical Tabs */}
        <div className="w-64 bg-slate-900 border-r border-[#172554] flex flex-col shrink-0">
           <button 
             onClick={() => setActiveTab('USERS')}
             className={`p-4 flex items-center text-xs font-bold uppercase tracking-widest transition-colors border-l-4 ${activeTab === 'USERS' ? 'bg-[#2563eb]/20 text-white border-[#3b82f6]' : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'}`}
           >
              <Users className="w-4 h-4 mr-3" /> User Management
           </button>
           <button 
             onClick={() => setActiveTab('FACILITIES')}
             className={`p-4 flex items-center text-xs font-bold uppercase tracking-widest transition-colors border-l-4 ${activeTab === 'FACILITIES' ? 'bg-[#2563eb]/20 text-white border-[#3b82f6]' : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'}`}
           >
              <Building2 className="w-4 h-4 mr-3" /> Facility Master
           </button>
           <button 
             onClick={() => setActiveTab('WARDS')}
             className={`p-4 flex items-center text-xs font-bold uppercase tracking-widest transition-colors border-l-4 ${activeTab === 'WARDS' ? 'bg-[#2563eb]/20 text-white border-[#3b82f6]' : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'}`}
           >
              <Target className="w-4 h-4 mr-3" /> Ward Targets
           </button>
           <button 
             onClick={() => setActiveTab('BROADCAST')}
             className={`p-4 flex items-center text-xs font-bold uppercase tracking-widest transition-colors border-l-4 ${activeTab === 'BROADCAST' ? 'bg-[#2563eb]/20 text-white border-[#3b82f6]' : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'}`}
           >
              <Megaphone className="w-4 h-4 mr-3" /> Broadcast Hub
           </button>
           <button 
             onClick={() => setActiveTab('AUDIT')}
             className={`p-4 flex items-center text-xs font-bold uppercase tracking-widest transition-colors border-l-4 ${activeTab === 'AUDIT' ? 'bg-[#2563eb]/20 text-white border-[#3b82f6]' : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'}`}
           >
              <History className="w-4 h-4 mr-3" /> System Audit Trail
           </button>
           <button 
             onClick={() => setActiveTab('CONFIG')}
             className={`p-4 flex items-center text-xs font-bold uppercase tracking-widest transition-colors border-l-4 ${activeTab === 'CONFIG' ? 'bg-[#2563eb]/20 text-white border-[#3b82f6]' : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'}`}
           >
              <Settings className="w-4 h-4 mr-3" /> System Config
           </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col p-4 w-full">
           
           {/* TAB: USER MANAGEMENT */}
           {activeTab === 'USERS' && (
              <div className="flex-1 flex flex-col bg-white border border-slate-300 shadow-sm">
                 <div className="p-3 border-b-2 border-slate-800 bg-slate-50 flex justify-between items-center shrink-0">
                    <h2 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest">Active System Identities</h2>
                    <div className="flex items-center space-x-3">
                       <div className="flex items-center bg-white border border-slate-300 px-2 py-1">
                          <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
                          <input 
                             type="text" 
                             placeholder="Search users..." 
                             className="text-xs outline-none w-48 text-slate-800 placeholder:text-slate-400"
                             value={userSearch}
                             onChange={e => setUserSearch(e.target.value)}
                          />
                       </div>
                       <button 
                          onClick={() => setShowUserModal(true)}
                          className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white px-3 py-1.5 flex items-center text-[10px] font-extrabold uppercase tracking-widest transition-colors"
                       >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Provision Identity
                       </button>
                    </div>
                 </div>
                 <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                       <thead className="bg-[#f8fafc] sticky top-0 z-10 box-border border-b border-slate-300 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <tr>
                             <th className="py-2.5 px-3">Identity (Name & ID)</th>
                             <th className="py-2.5 px-3 border-l border-slate-200">System Role</th>
                             <th className="py-2.5 px-3 border-l border-slate-200">Contact</th>
                             <th className="py-2.5 px-3 border-l border-slate-200 text-center">Status</th>
                             <th className="py-2.5 px-3 border-l border-slate-200">Provision Date</th>
                          </tr>
                       </thead>
                       <tbody>
                          {users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.id.toLowerCase().includes(userSearch.toLowerCase())).map((u, i) => (
                             <tr key={i} className="border-b border-slate-200 hover:bg-slate-50">
                                <td className="py-2 px-3">
                                   <div className="flex flex-col">
                                      <span className="text-xs font-extrabold text-slate-800">{u.name}</span>
                                      <span className="text-[10px] font-bold text-slate-500">{u.id}</span>
                                   </div>
                                </td>
                                <td className="py-2 px-3 border-l border-slate-100">
                                   <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 border
                                      ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700 border-purple-300' : 
                                      u.role === 'Hospital' ? 'bg-blue-100 text-blue-700 border-blue-300' : 
                                      'bg-emerald-100 text-emerald-700 border-emerald-300'}`}
                                   >
                                      {u.role}
                                   </span>
                                </td>
                                <td className="py-2 px-3 border-l border-slate-100">
                                   <div className="flex flex-col text-[10px] font-semibold text-slate-600">
                                      <span>{u.email}</span>
                                      <span>{u.phone}</span>
                                   </div>
                                </td>
                                <td className="py-2 px-3 border-l border-slate-100 text-center">
                                   <span className={`text-[10px] font-bold uppercase ${u.status === 'Active' ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                                      {u.status}
                                   </span>
                                </td>
                                <td className="py-2 px-3 border-l border-slate-100 text-[11px] font-bold text-slate-500">
                                   {new Date(u.created_at).toLocaleDateString()}
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           )}

           {/* TAB: FACILITY MASTER */}
           {activeTab === 'FACILITIES' && (
              <div className="flex-1 flex flex-col bg-white border border-slate-300 shadow-sm">
                 <div className="p-3 border-b-2 border-slate-800 bg-slate-50 flex justify-between items-center shrink-0">
                    <h2 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest">Medical Infrastructure Master</h2>
                 </div>
                 <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                       <thead className="bg-[#f8fafc] sticky top-0 z-10 box-border border-b border-slate-300 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <tr>
                             <th className="py-2.5 px-3">Facility Node</th>
                             <th className="py-2.5 px-3 border-l border-slate-200 text-center">Ward</th>
                             <th className="py-2.5 px-3 border-l border-slate-200">GIS Coordinates</th>
                             <th className="py-2.5 px-3 border-l border-slate-200">Direct Contact</th>
                             <th className="py-2.5 px-3 flex justify-end">Action</th>
                          </tr>
                       </thead>
                       <tbody>
                          {facilities.map((f, i) => (
                             <tr key={i} className="border-b border-slate-200 hover:bg-slate-50">
                                <td className="py-2 px-3">
                                   <div className="flex flex-col">
                                      <span className="text-xs font-extrabold text-slate-800">{f.name}</span>
                                      <span className="text-[10px] font-bold text-slate-500">{f.id} • {f.type}</span>
                                   </div>
                                </td>
                                <td className="py-2 px-3 border-l border-slate-100 text-center">
                                   <span className="text-xs font-bold text-slate-700 bg-slate-200 px-1 py-0.5">W{f.ward_no}</span>
                                </td>
                                <td className="py-2 px-3 border-l border-slate-100">
                                   <div className="flex items-center text-[10px] font-bold text-slate-500 font-mono">
                                      <MapPin className="w-3 h-3 mr-1 text-slate-400" /> {f.lat.toFixed(5)}, {f.lng.toFixed(5)}
                                   </div>
                                </td>
                                <td className="py-2 px-3 border-l border-slate-100">
                                   <div className="flex items-center text-xs font-semibold text-slate-600">
                                      <Phone className="w-3 h-3 mr-1 text-slate-400" /> {f.phone}
                                   </div>
                                </td>
                                <td className="py-2 px-3 border-l border-slate-100 flex justify-end">
                                   <button className="text-[10px] font-bold text-[#2563eb] hover:underline uppercase tracking-wider">
                                      Edit Node
                                   </button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           )}

           {/* TAB: WARD TARGETS */}
           {activeTab === 'WARDS' && (
              <div className="flex-1 flex flex-col bg-white border border-slate-300 shadow-sm max-w-4xl mx-auto w-full">
                 <div className="p-3 border-b-2 border-slate-800 bg-slate-50 flex justify-between items-center shrink-0">
                    <h2 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest">Reporting Target Parameters</h2>
                 </div>
                 <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                       <thead className="bg-[#f8fafc] sticky top-0 z-10 box-border border-b border-slate-300 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <tr>
                             <th className="py-2.5 px-3">Ward Identity</th>
                             <th className="py-2.5 px-3 border-l border-slate-200">Registered Population</th>
                             <th className="py-2.5 px-3 border-l border-slate-200">Daily Report Target Limit</th>
                             <th className="py-2.5 px-3 flex justify-end">Modifications</th>
                          </tr>
                       </thead>
                       <tbody>
                          {wards.map((w, i) => (
                             <tr key={i} className="border-b border-slate-200 hover:bg-slate-50">
                                <td className="py-2 px-3 text-xs font-extrabold text-slate-800">
                                   {w.name} (Code: {w.id})
                                </td>
                                <td className="py-2 px-3 border-l border-slate-100">
                                   <span className="text-xs font-semibold text-slate-600 font-mono">{w.total_population.toLocaleString()}</span>
                                </td>
                                <td className="py-2 px-3 border-l border-slate-100">
                                   <span className="text-xs font-bold text-[#2563eb] bg-blue-50 border border-blue-200 px-2 py-0.5">
                                      {w.target_daily_reports} / Day
                                   </span>
                                </td>
                                <td className="py-2 px-3 border-l border-slate-100 flex justify-end">
                                   <button 
                                     onClick={() => openWardModal(w)}
                                     className="text-[10px] font-bold text-[#2563eb] hover:underline uppercase tracking-wider"
                                   >
                                     Configure
                                   </button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           )}

           {/* TAB: BROADCAST HUB */}
           {activeTab === 'BROADCAST' && (
              <div className="flex-1 border border-slate-300 shadow-sm max-w-3xl mx-auto w-full flex flex-col h-full">
                 <div className="p-3 border-b-2 border-slate-800 bg-slate-50 flex justify-between items-center shrink-0">
                    <h2 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest flex items-center">
                       <Megaphone className="w-3.5 h-3.5 mr-1" /> Public Application Broadcast Hub
                    </h2>
                 </div>
                 <div className="p-6 bg-white flex-1 flex flex-col justify-center">
                    
                    {advisoryLive && (
                       <div className="mb-4 p-3 bg-green-50 border border-green-300 text-green-800 flex items-center">
                          <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                          <div>
                             <h4 className="text-xs font-bold uppercase tracking-widest">Transmission Successful</h4>
                             <p className="text-[10px] font-semibold mt-0.5 opacity-80 flex items-center">
                                <Smartphone className="w-3 h-3 mr-1" /> Payload is now active on the Solapur Public Flutter Application.
                             </p>
                          </div>
                       </div>
                    )}

                    <form onSubmit={handleBroadcastAdvisory} className="space-y-4">
                       <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Alert Title</label>
                          <input 
                            required type="text" 
                            className="w-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#2563eb]"
                            value={advisoryForm.title} onChange={e => setAdvisoryForm({...advisoryForm, title: e.target.value})}
                          />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Ward Code</label>
                             <select 
                               className="w-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#2563eb]"
                               value={advisoryForm.ward_code} onChange={e => setAdvisoryForm({...advisoryForm, ward_code: e.target.value})}
                             >
                                <option value="All">All Wards (City-wide)</option>
                                {Array.from({length:26}).map((_,i) => <option key={i} value={i+1}>Ward {i+1}</option>)}
                             </select>
                          </div>
                          <div>
                             <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Severity Tier</label>
                             <select 
                               className="w-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#2563eb]"
                               value={advisoryForm.severity} onChange={e => setAdvisoryForm({...advisoryForm, severity: e.target.value})}
                             >
                                <option value="Low">Low - Informational</option>
                                <option value="Medium">Medium - Advisory</option>
                                <option value="High">High - Emergency Priority</option>
                             </select>
                          </div>
                       </div>

                       <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Protocol Description</label>
                          <textarea 
                            required rows={4}
                            className="w-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#2563eb] resize-none"
                            value={advisoryForm.description} onChange={e => setAdvisoryForm({...advisoryForm, description: e.target.value})}
                          />
                       </div>

                       <button 
                         type="submit" 
                         disabled={actionLoading}
                         className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white py-3 flex justify-center items-center text-xs font-extrabold uppercase tracking-widest transition-colors mt-4"
                       >
                          {actionLoading ? 'Encrypting & Transmitting...' : 'Transmit Live Broadcast'}
                       </button>
                    </form>
                 </div>
              </div>
           )}

           {/* TAB: AUDIT LOGS */}
           {activeTab === 'AUDIT' && (
              <div className="flex-1 flex flex-col bg-white border border-slate-300 shadow-sm relative h-full">
                 <div className="p-3 border-b-2 border-slate-800 bg-slate-50 flex justify-between items-center shrink-0">
                    <h2 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest flex items-center">
                       <History className="w-3.5 h-3.5 mr-1" /> Cryptographic System Audit Trail
                    </h2>
                    <span className="text-[9px] font-bold bg-[#1e293b] text-white px-2 py-0.5 tracking-widest uppercase rounded-sm">LATEST 100 RECORDS</span>
                 </div>
                 <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                       <thead className="bg-[#f8fafc] sticky top-0 z-10 box-border border-b border-slate-300 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <tr>
                             <th className="py-2.5 px-3">UTC Timestamp</th>
                             <th className="py-2.5 px-3 border-l border-slate-200">Executing Identity</th>
                             <th className="py-2.5 px-3 border-l border-slate-200">Action Protocol</th>
                             <th className="py-2.5 px-3 border-l border-slate-200">Cryptographic Details</th>
                          </tr>
                       </thead>
                       <tbody>
                          {logs.map((log, i) => (
                             <tr key={i} className="border-b border-slate-200 hover:bg-slate-50 font-mono">
                                <td className="py-2 px-3 text-[10px] text-slate-500">
                                   {new Date(log.timestamp).toISOString()}
                                </td>
                                <td className="py-2 px-3 border-l border-slate-100 text-xs font-bold text-slate-800">
                                   {log.user_name}
                                </td>
                                <td className="py-2 px-3 border-l border-slate-100">
                                   <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-1 py-0.5 uppercase tracking-wider">{log.action}</span>
                                </td>
                                <td className="py-2 px-3 border-l border-slate-100 text-[10px] font-semibold text-slate-600 truncate max-w-md">
                                   {log.details}
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           )}

           {/* TAB: SYSTEM CONFIGURATION */}
           {activeTab === 'CONFIG' && (
              <div className="flex-1 flex flex-col bg-white border border-slate-300 shadow-sm max-w-4xl mx-auto w-full h-full p-6 overflow-auto">
                 <div className="border-b-2 border-slate-800 pb-3 mb-6 flex justify-between items-center">
                    <h2 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest flex items-center">
                       <Settings className="w-3.5 h-3.5 mr-1" /> System Settings CMS
                    </h2>
                 </div>
                 <form className="space-y-4" onSubmit={async (e) => {
                    e.preventDefault();
                    setActionLoading(true);
                    await fetch('/api/admin/config', {
                       method: 'PUT',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify(rtiConfig)
                    });
                    setActionLoading(false);
                 }}>
                    {Object.keys(rtiConfig).length > 0 ? Object.entries(rtiConfig).map(([key, value]) => (
                       <div key={key}>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</label>
                          <input 
                            type="text" className="w-full border border-slate-300 px-3 py-2 text-xs font-semibold outline-none focus:border-[#2563eb]"
                            value={String(value)} onChange={e => setRtiConfig({...rtiConfig, [key]: e.target.value})}
                          />
                       </div>
                    )) : (
                       <div className="text-sm text-slate-500 italic">No configuration found. Provide manual keys.</div>
                    )}
                    {Object.keys(rtiConfig).length === 0 && (
                       <>
                         <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">RTI Officer Name</label>
                            <input type="text" className="w-full border border-slate-300 px-3 py-2 text-xs font-semibold outline-none focus:border-[#2563eb]"
                               onChange={e => setRtiConfig({...rtiConfig, rti_officer_name: e.target.value})} />
                         </div>
                       </>
                    )}
                    <button type="submit" disabled={actionLoading} className="w-full bg-[#2563eb] text-white font-extrabold uppercase tracking-widest py-3 text-xs mt-4 hover:bg-[#1d4ed8]">
                       {actionLoading ? 'Saving...' : 'Save Configuration'}
                    </button>
                 </form>
              </div>
           )}
           
        </div>
      </div>

      {/* User Creation Modal Overlay */}
      {showUserModal && (
         <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
           {/* Backdrop */}
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]" onClick={() => setShowUserModal(false)}></div>
           
           {/* Modal Dialog */}
           <div className="relative bg-white w-full max-w-md border-t-4 border-[#2563eb] shadow-2xl flex flex-col">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                 <h3 className="text-xs font-extrabold text-[#1e293b] uppercase tracking-widest">Provision New Identity</h3>
                 <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-800"><History className="w-4 h-4 rotate-45" /></button>
              </div>
              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                 <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Full Name</label>
                    <input required type="text" className="w-full border border-slate-300 px-3 py-2 text-xs font-semibold outline-none focus:border-[#2563eb]"
                       value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">System Role</label>
                        <select className="w-full border border-slate-300 px-3 py-2 text-xs font-semibold outline-none focus:border-[#2563eb]"
                           value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                           <option value="ASHA">ASHA Worker</option>
                           <option value="Hospital">Hospital Authority</option>
                           <option value="Admin">DMO / Admin</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Direct Phone</label>
                        <input required type="text" className="w-full border border-slate-300 px-3 py-2 text-xs font-semibold outline-none focus:border-[#2563eb]"
                           placeholder="+91-" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Official Email</label>
                    <input required type="email" className="w-full border border-slate-300 px-3 py-2 text-xs font-semibold outline-none focus:border-[#2563eb]"
                       value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                 </div>
                 <button type="submit" disabled={actionLoading} className="w-full bg-[#2563eb] text-white font-extrabold uppercase tracking-widest py-3 text-xs mt-4 hover:bg-[#1d4ed8]">
                    {actionLoading ? 'Provisioning...' : 'Provision Key'}
                 </button>
              </form>
           </div>
         </div>
      )}

      {/* Ward Editing Modal Overlay */}
      {editingWard && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]" onClick={() => setEditingWard(null)}></div>
          <div className="relative bg-white w-full max-w-md border-t-4 border-[#2563eb] shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-xs font-extrabold text-[#1e293b] uppercase tracking-widest">Edit Ward: {editingWard.name}</h3>
              <button onClick={() => setEditingWard(null)} className="text-slate-400 hover:text-slate-800">
                ✕
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setActionLoading(true);
              const res = await fetch('/api/admin/wards', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: editingWard.id,
                  total_population: wardForm.total_population,
                  target_daily_reports: wardForm.target_daily_reports,
                }),
              });
              if (res.ok) {
                setEditingWard(null);
                fetchData();
              }
              setActionLoading(false);
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Population</label>
                <input type="number" className="w-full border border-slate-300 px-3 py-2 text-xs font-semibold"
                  value={wardForm.total_population} onChange={e => setWardForm({...wardForm, total_population: parseInt(e.target.value)})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Daily Report Target</label>
                <input type="number" className="w-full border border-slate-300 px-3 py-2 text-xs font-semibold"
                  value={wardForm.target_daily_reports} onChange={e => setWardForm({...wardForm, target_daily_reports: parseInt(e.target.value)})} />
              </div>
              <button type="submit" disabled={actionLoading} className="w-full bg-[#2563eb] text-white font-extrabold uppercase tracking-widest py-3 text-xs mt-4 hover:bg-[#1d4ed8]">
                {actionLoading ? 'Updating...' : 'Update Ward'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
