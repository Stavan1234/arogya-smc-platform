'use client';

import { useState } from 'react';

export default function FacilityProfile() {
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtyInput, setSpecialtyInput] = useState('');
  
  const [doctors, setDoctors] = useState<{name: string, specialization: string, timings: string}[]>([]);
  const [docForm, setDocForm] = useState({ name: '', specialization: '', timings: '' });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const addSpecialty = () => {
    if (specialtyInput.trim()) {
      setSpecialties([...specialties, specialtyInput.trim()]);
      setSpecialtyInput('');
    }
  };

  const removeSpecialty = (index: number) => {
    setSpecialties(specialties.filter((_, i) => i !== index));
  };

  const addDoctor = () => {
    if (docForm.name.trim() && docForm.specialization.trim()) {
      setDoctors([...doctors, docForm]);
      setDocForm({ name: '', specialization: '', timings: '' });
    }
  };

  const removeDoctor = (index: number) => {
    setDoctors(doctors.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch('/api/hospital/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialties, doctors })
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Facility Profile Management</h1>
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          Profile updated successfully!
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Facility Specialties</h2>
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            placeholder="Add specialty (e.g. Cardiology)" 
            className="flex-1 border-gray-300 rounded-md shadow-sm border px-3 py-2"
            value={specialtyInput}
            onChange={(e) => setSpecialtyInput(e.target.value)}
            onKeyDown={(e) => { if(e.key === 'Enter') addSpecialty(); }}
          />
          <button onClick={addSpecialty} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {specialties.map((spec, index) => (
            <span key={index} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium text-sm">
              {spec}
              <button onClick={() => removeSpecialty(index)} className="text-indigo-400 hover:text-indigo-900">&times;</button>
            </span>
          ))}
          {specialties.length === 0 && <span className="text-gray-500 text-sm italic">No specialties added yet.</span>}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Medical Doctors Roster</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input 
            type="text" placeholder="Doctor Name" className="border-gray-300 rounded-md shadow-sm border px-3 py-2"
            value={docForm.name} onChange={e => setDocForm({...docForm, name: e.target.value})}
          />
          <input 
            type="text" placeholder="Specialization" className="border-gray-300 rounded-md shadow-sm border px-3 py-2"
            value={docForm.specialization} onChange={e => setDocForm({...docForm, specialization: e.target.value})}
          />
          <div className="flex gap-2">
            <input 
              type="text" placeholder="Timings (e.g. 9AM-5PM)" className="flex-1 border-gray-300 rounded-md shadow-sm border px-3 py-2"
              value={docForm.timings} onChange={e => setDocForm({...docForm, timings: e.target.value})}
              onKeyDown={(e) => { if(e.key === 'Enter') addDoctor(); }}
            />
            <button onClick={addDoctor} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Add</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timings</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {doctors.map((doc, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.specialization}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.timings}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => removeDoctor(index)} className="text-red-600 hover:text-red-900">Remove</button>
                  </td>
                </tr>
              ))}
              {doctors.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 italic">No doctors in roster.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-[#1e3a8a] text-white px-8 py-3 rounded-lg font-bold tracking-wide hover:bg-blue-800 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Facility Profile'}
        </button>
      </div>
    </div>
  );
}
