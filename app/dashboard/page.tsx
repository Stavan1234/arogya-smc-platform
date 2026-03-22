'use client';

import { useEffect, useState } from 'react';
import { 
  ArrowUpRight, ArrowDownRight, AlertCircle, Users, Activity, Phone
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import TrendChart from '@/components/dashboard/TrendChart';
import DashboardMap from '@/components/dashboard/DashboardMap';
import ComplianceChart from '@/components/dashboard/ComplianceChart';
import { DashboardSummary, WardRisk, TrendDataPoint, Alert } from '@/types';
import { useToast } from "@/components/ui/use-toast";

export default function DashboardOverview() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/summary?view=disease').then(res => res.json()),
      fetch('/api/dashboard/trends?days=7').then(res => res.json()),
      fetch('/api/dashboard/alerts?limit=10').then(res => res.json())
    ])
    .then(([summaryData, trendsData, alertsData]) => {
      setSummary(summaryData);
      setTrends(trendsData);
      setRecentAlerts(alertsData);
      setLoading(false);
    })
    .catch(err => {
      console.error('Failed to load dashboard data:', err);
      // Fallback mocks mapping to summary API structure
      setSummary({
        topWards: [],
        metrics: {
          activeOutbreaks: 5,
          reportingCompliance: 91,
          criticalAlerts: 18,
          bedAvailability: { available: 6540, total: 10000 },
          ashaSyncStatus: 95
        },
        totalAtRisk: 0,
        lastUpdated: new Date().toISOString()
      } as any);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Real-time alert:', data);
      if (data.type === 'alert') {
        toast({
          title: 'New Alert',
          description: data.data.description || data.data.title || 'New alert received',
          variant: 'destructive',
        });
        // Optionally update recentAlerts state without refresh
        setRecentAlerts(prev => [data.data, ...prev.slice(0, 9)]);
      }
    };
    return () => eventSource.close();
  }, [toast]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center">
        <div className="h-8 w-8 border-4 border-[#1e3a8a] border-t-transparent animate-spin rounded-full mb-4"></div>
        <p className="text-sm font-bold tracking-widest text-[#1e3a8a] uppercase">Loading System Data...</p>
      </div>
    </div>
  );
  if (!summary || !summary.metrics) return <div className="text-red-600 font-bold p-4 bg-red-50 border border-red-200">System Initialization Failed.</div>;

  const { metrics } = summary as any;

  return (
    <div className="space-y-4 max-w-[1920px] 2xl:mx-auto">
      
      {/* Top Banner Context */}
      <div className="flex justify-between items-end pb-2 border-b-2 border-slate-300">
        <h2 className="text-xl font-extrabold text-[#111827] tracking-tight uppercase">Dashboard <span className="text-sm text-slate-500 font-semibold tracking-normal capitalize ml-1">(Active)</span></h2>
        <p className="text-xs font-bold text-slate-500 tracking-wider">District Medical Officer (DMO)</p>
      </div>

      {/* KPI Section - 5 Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Outbreaks */}
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col pt-3 pb-2 px-4 relative overflow-hidden group">
          <div className="absolute bottom-0 left-0 h-1 w-full bg-[#3b82f6] transition-all group-hover:h-1.5" />
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Active Outbreaks</h3>
          <div className="flex items-baseline space-x-3">
            <span className="text-3xl font-extrabold text-slate-800 tracking-tighter leading-none">{metrics.activeOutbreaks}</span>
            <div className="flex flex-col text-[9px] font-semibold text-slate-600 leading-tight">
              <span>• 3 Dengue</span>
              <span>• 1 Malaria</span>
              <span>• 1 Typhoid</span>
            </div>
          </div>
        </div>

        {/* Compliance */}
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col pt-3 pb-2 px-4 relative overflow-hidden group">
           <div className="absolute bottom-0 left-0 h-1 w-full bg-[#10b981] transition-all group-hover:h-1.5" />
           <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Daily Reporting Compliance</h3>
           <div className="flex items-baseline space-x-3">
             <span className="text-3xl font-extrabold text-slate-800 tracking-tighter leading-none">{metrics.reportingCompliance}%</span>
           </div>
           <div className="flex justify-between items-center mt-1 text-[10px] font-semibold">
              <span className="text-slate-500">8,190/9,000 facilities</span>
              <span className="text-red-600">Defaulters: 810</span>
           </div>
        </div>

        {/* Alerts */}
         <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-sm shadow-sm flex flex-col pt-3 pb-2 px-4 relative overflow-hidden group">
           <div className="absolute top-2 right-2 cursor-pointer text-[#ef4444] opacity-50 hover:opacity-100">✕</div>
           <h3 className="text-[10px] font-bold text-[#b91c1c] uppercase tracking-widest mb-1">Critical Alerts (Last 24H)</h3>
           <div className="flex flex-col">
             <span className="text-3xl font-extrabold text-[#b91c1c] tracking-tighter leading-none">{metrics.criticalAlerts}</span>
             <span className="text-[9px] text-[#991b1b] font-semibold mt-1">Linked to side panel</span>
           </div>
        </div>

        {/* Bed Availability */}
         <div className="bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col pt-3 pb-2 px-4 relative overflow-hidden group">
           <div className="absolute bottom-0 left-0 h-1 w-full bg-[#22c55e] transition-all group-hover:h-1.5" />
           <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Bed Availability (Public Hospitals)</h3>
           <div className="flex items-baseline">
             <span className="text-2xl font-extrabold text-slate-800 tracking-tighter leading-none">
               {metrics.bedAvailability?.available?.toLocaleString()} <span className="text-slate-400 font-semibold text-lg">/ {metrics.bedAvailability?.total?.toLocaleString()}</span>
             </span>
           </div>
           <span className="text-[10px] text-slate-500 font-bold mt-1">
             {metrics.bedAvailability?.total > 0 ? ((metrics.bedAvailability.available / metrics.bedAvailability.total) * 100).toFixed(1) : 0}% Available
           </span>
        </div>

        {/* ASHA */}
         <div className="bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col pt-3 pb-2 px-4 relative overflow-hidden group">
           <div className="absolute bottom-0 left-0 h-1 w-full bg-[#059669] transition-all group-hover:h-1.5" />
           <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">ASHA Worker Sync Status (Today)</h3>
           <div className="flex items-baseline space-x-2 my-auto">
             <span className="text-3xl font-extrabold text-slate-800 tracking-tighter leading-none">{metrics.ashaSyncStatus}%</span>
             <span className="text-[10px] font-semibold text-slate-500 tracking-wide mt-1">4,750/5,000 active</span>
           </div>
        </div>
      </div>

      {/* Active Hotspots Risk Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {summary?.topWards?.slice(0, 6).sort((a: any, b: any) => b.riskScore - a.riskScore).map((ward: WardRisk, idx: number) => {
          const getStatus = (score: number) => {
            if (score > 70) return { label: 'Critical', class: 'bg-red-600 hover:bg-red-700 text-white' };
            if (score > 40) return { label: 'Moderate', class: 'bg-orange-500 hover:bg-orange-600 text-white' };
            return { label: 'Low', class: 'bg-green-500 hover:bg-green-600 text-white' };
          };
          const status = getStatus(ward.riskScore);
          const trendUp = ward.trend > 0;
          const absTrend = Math.abs(ward.trend);
          return (
            <div key={idx} className="group bg-white border border-slate-300 rounded-sm shadow-sm hover:shadow-md p-3 flex flex-col h-[140px] cursor-pointer transition-all overflow-hidden relative">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-800 text-sm leading-tight truncate mr-2">Ward {ward.name}</h4>
                <Badge className={`text-[10px] font-bold h-5 px-2.5 shadow-sm shrink-0 ${status.class.replace('text-white', 'text-white')}`}>{status.label}</Badge>
              </div>
              <div className="flex-1 flex flex-col justify-end">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Cases</span>
                  <span className="text-2xl font-extrabold text-slate-800 tracking-tighter leading-none">{ward.metric.toLocaleString()}</span>
                </div>
                <div className="flex items-center text-[11px] font-bold">
                  {trendUp ? <ArrowUpRight className="h-3.5 w-3.5 mr-1 text-red-500" /> : <ArrowDownRight className="h-3.5 w-3.5 mr-1 text-green-500 rotate-[-125deg]" />}
                  <span className={`font-bold ${trendUp ? 'text-red-500' : 'text-green-500'}`}>
                    {trendUp ? '+' : ''}{absTrend.toFixed(1)}% {trendUp ? '↑' : '↓'} vs Yesterday
                  </span>
                </div>
              </div>
            </div>
          );
        }) || (
          <div className="col-span-full text-center py-8 text-slate-400 font-semibold text-sm">No active risk wards detected</div>
        )}
      </div>

      {/* Map Section */}
      <div className="h-[450px] w-full border border-slate-300 bg-white shadow-sm p-1 rounded-sm">
         <DashboardMap />
      </div>

      {/* Bottom Grid Charts / Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-80">
        
        {/* Trend Chart */}
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col p-3 overflow-hidden">
           <div className="flex justify-between items-center mb-2">
             <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Disease Trends</h3>
             <span className="text-[10px] text-slate-400 font-semibold tracking-wider">Temporal Analysis</span>
           </div>
           <div className="flex-1 min-h-0 bg-slate-50 border border-slate-100 p-2">
             {trends.length > 0 ? (
                <TrendChart data={trends} />
              ) : (
                <div className="flex items-center justify-center h-full text-[10px] text-slate-400 font-semibold uppercase tracking-widest">No trend data available</div>
              )}
           </div>
        </div>

        {/* Reporting Status */}
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col p-1 overflow-hidden h-full">
           <ComplianceChart />
        </div>

        {/* Alerts Feed */}
        <div className="bg-[#f8fafc] border border-slate-300 rounded-sm shadow-sm flex flex-col overflow-hidden h-full">
            <div className="bg-white p-2.5 border-b border-slate-200">
               <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Real-Time Alerts Feed</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
              {recentAlerts.length > 0 ? recentAlerts.map((alert: any, idx: number) => {
                const getAlertStyle = (severity: string) => {
                  switch (severity?.toLowerCase()) {
                    case 'critical': return { border: 'border-[#fca5a5]', badge: 'bg-[#b91c1c] hover:bg-[#991b1b]' };
                    case 'high': return { border: 'border-[#fcd34d]', badge: 'bg-[#d97706] hover:bg-[#b45309]' };
                    case 'medium': return { border: 'border-[#fef08a]', badge: 'bg-[#eab308] hover:bg-[#ca8a04]' };
                    case 'low': 
                    default: return { border: 'border-[#bbf7d0]', badge: 'bg-[#16a34a] hover:bg-[#15803d]' };
                  }
                };
                const style = getAlertStyle(alert.severity);
                // format time e.g., "14:32"
                const timeStr = alert.generated_at ? new Date(alert.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                return (
                  <div key={idx} className={`flex justify-between items-start bg-white p-2 border ${style.border} rounded-sm text-xs`}>
                    <span className="font-semibold text-slate-800">{timeStr} - {alert.title}</span>
                    <Badge className={`${style.badge} text-white rounded-sm px-1.5 py-0 text-[9px] font-bold tracking-widest h-5 ml-2 shrink-0`}>
                      {(alert.severity || 'INFO').toUpperCase()}
                    </Badge>
                  </div>
                );
              }) : (
                <div className="flex items-center justify-center h-full text-[10px] text-slate-400 font-semibold uppercase tracking-widest">No recent alerts</div>
              )}
            </div>
            
            <div className="bg-white border-t border-slate-200 p-1 flex justify-center text-[9px] text-slate-500 font-semibold tracking-wider">
               IHIP v3.2.1 | Data refreshed: Just now | Helpdesk: 1800-XXX-XXXX
            </div>
        </div>

      </div>
    </div>
  );
}