'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const WARDS = Array.from({ length: 26 }, (_, i) => `W${(i + 1).toString().padStart(2, '0')}`);
const FACILITY_TYPES = ['PHC', 'CHC', 'Sub-District Hospital', 'District Hospital', 'Private Hospital', 'Clinic'];
const SPECIALTIES_LIST = ['General Medicine', 'Pediatrics', 'Orthopedics', 'Gynecology', 'Cardiology', 'Neurology'];

export default function HospitalRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step management for a minimal intelligent UI
  const [step, setStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    facility_name: '',
    ward_code: 'W01',
    address: '',
    contact: '',
    facility_type: 'PHC',
    specialties: [] as string[],
    location_lat: 17.6599, // Solapur somewhat default
    location_lng: 75.9064,
    full_name: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const validateStep1 = () => {
    if (!formData.facility_name || !formData.address || !formData.contact) {
      setError('Please fill all required facility details');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/hospital/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facility_name: formData.facility_name,
          ward_code: formData.ward_code,
          location_lat: Number(formData.location_lat),
          location_lng: Number(formData.location_lng),
          contact: formData.contact,
          facility_type: formData.facility_type,
          address: formData.address,
          specialties: formData.specialties.length > 0 ? formData.specialties : ['General Medicine'],
          username: formData.username,
          password: formData.password,
          full_name: formData.full_name
        }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Automatically route to login or dashboard
        router.push('/hospital/login?registered=true');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-indigo-100">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Register Hospital / Facility
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Step {step} of 2: {step === 1 ? 'Facility Details' : 'Admin Credentials'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); if (validateStep1()) setStep(2); }}>
          
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Facility Name *</label>
                  <input required name="facility_name" type="text" value={formData.facility_name} onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Facility Type *</label>
                  <select name="facility_type" value={formData.facility_type} onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    {FACILITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ward *</label>
                  <select name="ward_code" value={formData.ward_code} onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Number *</label>
                  <input required name="contact" type="text" value={formData.contact} onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address *</label>
                <textarea required name="address" rows={2} value={formData.address} onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialties</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SPECIALTIES_LIST.map(spec => (
                    <label key={spec} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={formData.specialties.includes(spec)}
                        onChange={() => handleSpecialtyToggle(spec)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <span>{spec}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="pt-4">
                <button type="submit" className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Next: Account Setup
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Admin Full Name *</label>
                <input required name="full_name" type="text" value={formData.full_name} onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Username *</label>
                <input required name="username" type="text" value={formData.username} onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password *</label>
                <input required name="password" type="password" value={formData.password} onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                <input required name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>

              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setStep(1)}
                  className="w-1/3 flex justify-center py-2.5 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Back
                </button>
                <button type="submit" disabled={loading}
                  className={`w-2/3 flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                  {loading ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          )}

        </form>
        
        <div className="text-center mt-4">
          <Link href="/hospital/login" className="text-sm text-indigo-600 hover:text-indigo-500">
            Already registered? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
