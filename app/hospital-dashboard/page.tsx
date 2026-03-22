'use client';

import { useState, useEffect } from 'react';

interface DashboardData {
  facility_id: number;
  facility_name: string;
  ward_code: string;
  ward_name: string;
  facility_type: string;
  contact: string;
  address: string;
  specialties: string[];
  beds_total: number;
  beds_available: number;
  icu_total: number;
  icu_available: number;
  ventilators_total: number;
  ventilators_available: number;
  oxygen_available: boolean;
  bed_utilization: number;
  last_capacity_report: string;
  inventory_status: { resource_type: string; current_stock: number; min_threshold: number }[];
}

export default function HospitalDashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/hospital/dashboard');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Failed to load dashboard data');
        }
      } catch (err) {
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-10">Loading Dashboard...</div>;
  if (error) return <div className="text-red-500 bg-red-50 p-4 rounded">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-800">{data.facility_name}</h2>
          <p className="text-gray-500 mt-1">{data.facility_type} • Ward {data.ward_name} ({data.ward_code})</p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 block">Contact</span>
              <span className="font-medium">{data.contact}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Address</span>
              <span className="font-medium">{data.address}</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-gray-500 block text-sm mb-1">Specialties</span>
            <div className="flex flex-wrap gap-2">
              {data.specialties?.map(s => (
                <span key={s} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">{s}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center items-center text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 ${
            data.bed_utilization > 90 ? 'bg-red-100 text-red-600' : 
            data.bed_utilization > 75 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
          }">
            <span className="text-2xl font-bold">{data.bed_utilization ? Number(data.bed_utilization).toFixed(1) : 0}%</span>
          </div>
          <h3 className="text-gray-600 font-medium">Bed Utilization</h3>
          <p className="text-xs text-gray-400 mt-1">Last Update: {new Date(data.last_capacity_report).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Regular Beds</h3>
          <p className="text-2xl font-bold mt-2">{data.beds_available || 0} <span className="text-sm font-normal text-gray-400">/ {data.beds_total || 0}</span></p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">ICU Beds</h3>
          <p className="text-2xl font-bold mt-2">{data.icu_available || 0} <span className="text-sm font-normal text-gray-400">/ {data.icu_total || 0}</span></p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Ventilators</h3>
          <p className="text-2xl font-bold mt-2">{data.ventilators_available || 0} <span className="text-sm font-normal text-gray-400">/ {data.ventilators_total || 0}</span></p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Oxygen Supply</h3>
            <p className="text-lg font-bold mt-2">{data.oxygen_available ? 'Available' : 'Critical'}</p>
          </div>
          <div className={`w-4 h-4 rounded-full ${data.oxygen_available ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Current Inventory Status</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(data.inventory_status || []).map((item, idx) => {
                const isLow = item.current_stock < item.min_threshold;
                return (
                  <tr key={idx}>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{item.resource_type}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">{item.current_stock}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">{item.min_threshold}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isLow ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {isLow ? 'Low Stock' : 'Adequate'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(!data.inventory_status || data.inventory_status.length === 0) && (
            <p className="text-center text-gray-500 py-4">No inventory data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
