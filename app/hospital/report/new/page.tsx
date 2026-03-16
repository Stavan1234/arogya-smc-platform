'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function NewReportPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    bedsTotal: 100,
    bedsAvailable: 25,
    icuTotal: 10,
    icuAvailable: 2,
    ventilatorsTotal: 8,
    ventilatorsAvailable: 1,
    oxygenAvailable: true,
    malaria: 0,
    dengue: 0,
    covidLike: 0,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/hospital/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospitalId: 1, // hardcoded for demo; in real app get from JWT
        reportDate: new Date().toISOString().split('T')[0],
        bedsTotal: formData.bedsTotal,
        bedsAvailable: formData.bedsAvailable,
        icuTotal: formData.icuTotal,
        icuAvailable: formData.icuAvailable,
        ventilatorsTotal: formData.ventilatorsTotal,
        ventilatorsAvailable: formData.ventilatorsAvailable,
        oxygenAvailable: formData.oxygenAvailable,
        diseaseCounts: {
          malaria: formData.malaria,
          dengue: formData.dengue,
          covid_like: formData.covidLike,
        },
      }),
    });
    if (res.ok) {
      router.push('/hospital');
    } else {
      alert('Submission failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Capacity Report</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Total Beds</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={formData.bedsTotal}
              onChange={e => setFormData({...formData, bedsTotal: parseInt(e.target.value)})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Available Beds</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={formData.bedsAvailable}
              onChange={e => setFormData({...formData, bedsAvailable: parseInt(e.target.value)})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Total ICU</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={formData.icuTotal}
              onChange={e => setFormData({...formData, icuTotal: parseInt(e.target.value)})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Available ICU</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={formData.icuAvailable}
              onChange={e => setFormData({...formData, icuAvailable: parseInt(e.target.value)})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Total Ventilators</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={formData.ventilatorsTotal}
              onChange={e => setFormData({...formData, ventilatorsTotal: parseInt(e.target.value)})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Available Ventilators</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={formData.ventilatorsAvailable}
              onChange={e => setFormData({...formData, ventilatorsAvailable: parseInt(e.target.value)})}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Oxygen Available</label>
            <select
              className="w-full p-2 border rounded"
              value={formData.oxygenAvailable ? 'true' : 'false'}
              onChange={e => setFormData({...formData, oxygenAvailable: e.target.value === 'true'})}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Malaria Cases</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={formData.malaria}
              onChange={e => setFormData({...formData, malaria: parseInt(e.target.value)})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dengue Cases</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={formData.dengue}
              onChange={e => setFormData({...formData, dengue: parseInt(e.target.value)})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">COVID-like Cases</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={formData.covidLike}
              onChange={e => setFormData({...formData, covidLike: parseInt(e.target.value)})}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Submit Report
          </button>
        </div>
      </form>
    </div>
  );
}