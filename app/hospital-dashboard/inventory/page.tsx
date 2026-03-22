'use client';
import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

interface DispatchForm {
  resource_type: string;
  ward_code: string;
  quantity_distributed: number;
  beneficiary_type: string;
}

interface InventoryItem {
  id?: number;
  resource_type: string;
  current_stock: number;
  min_threshold: number;
  last_updated?: string;
}

const COMMON_RESOURCES = [
  'Antipyretic', 'Cough Syrup', 'ORS', 'RDT Kit', 'PPE Kit', 
  'N95 Masks', 'Sanitizer (Liters)', 'Oxygen Cylinders', 'IV Fluids'
];

export default function InventoryManagementPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // New entry form state
  const [newResource, setNewResource] = useState('');
  const [customResource, setCustomResource] = useState('');
  const [currentStock, setCurrentStock] = useState(0);
  const [minThreshold, setMinThreshold] = useState(100);

  // Dispatch modal state
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [dispatchForm, setDispatchForm] = useState<DispatchForm>({
    resource_type: '',
    ward_code: '',
    quantity_distributed: 0,
    beneficiary_type: 'Outpatient',
  });

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/hospital/inventory');
      const json = await res.json();
      if (json.success && json.data) {
        setInventory(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleUpdate = async (item: InventoryItem) => {
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/hospital/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(`Successfully updated ${item.resource_type}`);
        fetchInventory();
      } else {
        setError(data.error || 'Failed to update item');
      }
    } catch (err) {
      setError('An error occurred updating inventory');
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    setMessage('');

    const resourceType = newResource === 'Other' ? customResource : newResource;
    
    if (!resourceType) {
      setError('Please select or enter a resource type');
      setSubmitLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/hospital/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_type: resourceType,
          current_stock: currentStock,
          min_threshold: minThreshold
        }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setMessage('New inventory item added successfully!');
        setNewResource('');
        setCustomResource('');
        setCurrentStock(0);
        setMinThreshold(100);
        fetchInventory();
      } else {
        setError(data.error || 'Failed to add item');
      }
    } catch (err) {
      setError('An error occurred adding inventory');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRowChange = (index: number, field: keyof InventoryItem, value: any) => {
    const updated = [...inventory];
    updated[index] = { ...updated[index], [field]: Number(value) };
    setInventory(updated);
  };

  const openDispatchModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setDispatchForm({
      resource_type: item.resource_type,
      ward_code: '',
      quantity_distributed: 0,
      beneficiary_type: 'Outpatient',
    });
    setShowDispatchModal(true);
  };

  const handleDispatch = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/hospital/inventory/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dispatchForm),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage(`Successfully dispatched ${dispatchForm.quantity_distributed} of ${dispatchForm.resource_type}`);
        setShowDispatchModal(false);
        setSelectedItem(null);
        fetchInventory();
      } else {
        setError(data.error || 'Failed to dispatch stock');
      }
    } catch (err) {
      setError('An error occurred during dispatch');
    }
  };

  if (loading) return <div className="text-center py-10">Loading Inventory...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
          <p className="text-gray-500 mt-1">Track and update your facility medical resources.</p>
        </div>

        {message && <div className="mb-4 p-4 text-green-700 bg-green-50 border border-green-200 rounded-lg">{message}</div>}
        {error && <div className="mb-4 p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}

        {/* Existing Inventory Table */}
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Threshold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((item, index) => (
                <tr key={item.id || item.resource_type}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.resource_type}
                    {item.current_stock < item.min_threshold && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Low</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input type="number" value={item.current_stock}
                      onChange={(e) => handleRowChange(index, 'current_stock', e.target.value)}
                      className="w-24 rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input type="number" value={item.min_threshold}
                      onChange={(e) => handleRowChange(index, 'min_threshold', e.target.value)}
                      className="w-24 rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.last_updated ? new Date(item.last_updated).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleUpdate(item)}
                      className="text-indigo-600 hover:text-indigo-900 font-semibold px-3 py-1 bg-indigo-50 rounded mr-2">
                      Save
                    </button>
                    <Button 
                      onClick={() => openDispatchModal(item)}
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      Dispatch
                    </Button>
                  </td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 text-sm">No inventory recorded yet. Add items below.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dispatch Modal */}
        {showDispatchModal && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Dispatch Stock</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDispatchModal(false);
                    setSelectedItem(null);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleDispatch} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Resource Type</label>
                  <input 
                    type="text" 
                    value={dispatchForm.resource_type}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Ward Code</label>
                  <input 
                    type="text" 
                    value={dispatchForm.ward_code}
                    onChange={(e) => setDispatchForm({...dispatchForm, ward_code: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity (Max: {selectedItem.current_stock})
                  </label>
                  <input 
                    type="number" 
                    value={dispatchForm.quantity_distributed}
                    onChange={(e) => setDispatchForm({...dispatchForm, quantity_distributed: Math.min(Number(e.target.value), selectedItem.current_stock)})}
                    min="1"
                    max={selectedItem.current_stock}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Beneficiary Type</label>
                  <Select value={dispatchForm.beneficiary_type} onValueChange={(value) => setDispatchForm({...dispatchForm, beneficiary_type: value})}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select beneficiary type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Outpatient">Outpatient</SelectItem>
                      <SelectItem value="Inpatient">Inpatient</SelectItem>
                      <SelectItem value="ASHA">ASHA Worker</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                      <SelectItem value="Referral">Referral Unit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowDispatchModal(false);
                      setSelectedItem(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Dispatch Stock</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add New Resource Form */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Resource</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Resource Type</label>
              <select 
                value={newResource} 
                onChange={(e) => setNewResource(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select Resource...</option>
                {COMMON_RESOURCES.map(r => <option key={r} value={r}>{r}</option>)}
                <option value="Other">Other (Custom)</option>
              </select>
            </div>
            
            {newResource === 'Other' && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Custom Name</label>
                <input type="text" value={customResource} onChange={(e) => setCustomResource(e.target.value)} required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              </div>
            )}
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Current Stock</label>
              <input type="number" value={currentStock} onChange={(e) => setCurrentStock(Number(e.target.value))} required min="0" 
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Min Threshold</label>
              <input type="number" value={minThreshold} onChange={(e) => setMinThreshold(Number(e.target.value))} required min="0"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            
            <div>
              <button type="submit" disabled={submitLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${submitLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                {submitLoading ? 'Adding...' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
