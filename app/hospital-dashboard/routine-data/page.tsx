'use client';
import { useState, useEffect, FormEvent } from 'react';

export default function RoutineDataPage() {
  const [formData, setFormData] = useState({
    beds_total: 0,
    beds_available: 0,
    icu_total: 0,
    icu_available: 0,
    ventilators_total: 0,
    ventilators_available: 0,
    oxygen_available: true,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch today's data if it exists
    async function fetchTodayData() {
      try {
        const res = await fetch('/api/hospital/capacity');
        const json = await res.json();
        if (json.success && json.data) {
          setFormData({
            beds_total: json.data.beds_total || 0,
            beds_available: json.data.beds_available || 0,
            icu_total: json.data.icu_total || 0,
            icu_available: json.data.icu_available || 0,
            ventilators_total: json.data.ventilators_total || 0,
            ventilators_available: json.data.ventilators_available || 0,
            oxygen_available: json.data.oxygen_available ?? true,
          });
        }
      } catch (e) {
        console.error('Failed to fetch existing data');
      }
    }
    fetchTodayData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    
    // Quick validation
    if (formData.beds_available > formData.beds_total) {
      setError('Available beds cannot exceed total beds');
      setLoading(false);
      return;
    }
    if (formData.icu_available > formData.icu_total) {
      setError('Available ICU beds cannot exceed total ICU beds');
      setLoading(false);
      return;
    }
    if (formData.ventilators_available > formData.ventilators_total) {
      setError('Available ventilators cannot exceed total ventilators');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/hospital/capacity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setMessage('Capacity report updated successfully!');
      } else {
        setError(data.error || 'Failed to update capacity');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Routine Capacity Tracking</h2>
          <p className="text-gray-500 mt-1">Please update your facility's bed and resources capacity regularly.</p>
        </div>

        {message && <div className="mb-4 p-4 text-green-700 bg-green-50 border border-green-200 rounded-lg">{message}</div>}
        {error && <div className="mb-4 p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Regular Beds */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="font-semibold text-gray-700">General Beds</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Beds</label>
                <input type="number" name="beds_total" min="0" required
                  value={formData.beds_total} onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Beds</label>
                <input type="number" name="beds_available" min="0" required
                  value={formData.beds_available} onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
            </div>

            {/* ICU Beds */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="font-semibold text-gray-700">ICU Capacity</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total ICU Beds</label>
                <input type="number" name="icu_total" min="0" required
                  value={formData.icu_total} onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available ICU Beds</label>
                <input type="number" name="icu_available" min="0" required
                  value={formData.icu_available} onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
            </div>

            {/* Ventilators */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="font-semibold text-gray-700">Ventilators</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Ventilators</label>
                <input type="number" name="ventilators_total" min="0" required
                  value={formData.ventilators_total} onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Ventilators</label>
                <input type="number" name="ventilators_available" min="0" required
                  value={formData.ventilators_available} onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
            </div>

            {/* Oxygen Status */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col justify-center">
              <h3 className="font-semibold text-gray-700">Oxygen Status</h3>
              <div className="flex items-center space-x-3 mt-4">
                <input type="checkbox" name="oxygen_available" id="oxygen_available" 
                  checked={formData.oxygen_available} onChange={handleChange}
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                <label htmlFor="oxygen_available" className="text-gray-700 font-medium">Oxygen Supply Available</label>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button type="submit" disabled={loading}
              className={`px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {loading ? 'Submitting...' : 'Submit Capacity Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
