'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface HospitalReport {
  report_date: string;
  beds_available: number;
  beds_total: number;
  icu_available: number;
  icu_total: number;
  ventilators_available: number;
  ventilators_total: number;
  oxygen_available: boolean;
}

export default function HospitalDashboard() {
  const [latest, setLatest] = useState<HospitalReport | null>(null);
  const hospitalId = 1; // hardcoded for demo; in real app get from JWT

  useEffect(() => {
    fetch(`/api/hospital/reports?hospitalId=${hospitalId}`)
      .then(res => res.json())
      .then(data => setLatest(data[0])); // first is latest
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Hospital Dashboard</h1>
      {latest && (
        <div className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Last Report: {latest.report_date}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>Beds: {latest.beds_available}/{latest.beds_total}</div>
            <div>ICU: {latest.icu_available}/{latest.icu_total}</div>
            <div>Ventilators: {latest.ventilators_available}/{latest.ventilators_total}</div>
            <div>Oxygen: {latest.oxygen_available ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}
      <Link href="/hospital/report/new" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
        + New Report
      </Link>
    </div>
  );
}
