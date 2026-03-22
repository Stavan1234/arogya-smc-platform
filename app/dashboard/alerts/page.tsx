'use client';

import { useEffect, useState } from 'react';
import { Alert } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({ type: 'Outbreak', severity: 'high', ward_code: 'Ward 1', title: '', description: '' });

  useEffect(() => {
    fetch('/api/dashboard/alerts')
      .then(async res => {
        if (!res.ok) {
          throw new Error('Failed to fetch alerts.');
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Received non-JSON response.');
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setAlerts(data);
        } else {
          console.error('Unexpected data format for alerts:', data);
          setAlerts([]);
        }
      })
      .catch(error => {
        console.error('Error fetching alerts:', error);
        setAlerts([]);
      });
  }, []);

  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-100';
  };

  const handleAcknowledge = async (id: number) => {
    const res = await fetch(`/api/dashboard/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'acknowledged', acknowledged_at: new Date().toISOString() }),
    });
    if (res.ok) {
      setAlerts(alerts.map(a => a.id === id ? { ...a, status: 'acknowledged' } : a));
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dispatchForm),
    });
    if (res.ok) {
      setShowDispatchModal(false);
      const { data } = await res.json();
      if (data) setAlerts([data, ...alerts]);
      setDispatchForm({ type: 'Outbreak', severity: 'high', ward_code: 'Ward 1', title: '', description: '' });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Alert Management</h1>
        <Button onClick={() => setShowDispatchModal(true)}>Dispatch Alert</Button>
      </div>
      <div className="bg-white rounded shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Severity</TableHead>
              <TableHead>Ward</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Generated</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map(alert => (
              <TableRow key={alert.id}>
                <TableCell>
                  <Badge className={getSeverityBadge(alert.severity)}>
                    {alert.severity}
                  </Badge>
                </TableCell>
                <TableCell>{alert.ward_code}</TableCell>
                <TableCell>{alert.type}</TableCell>
                <TableCell>{alert.description}</TableCell>
                <TableCell>{new Date(alert.generated_at).toLocaleDateString()}</TableCell>
                <TableCell>{alert.status}</TableCell>
                <TableCell>
                  {alert.status === 'active' && (
                    <Button size="sm" onClick={() => handleAcknowledge(alert.id)}>
                      Acknowledge
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded max-w-lg w-full p-6 shadow-xl relative">
            <h3 className="text-xl font-bold mb-4">Dispatch Manual Alert</h3>
            <form onSubmit={handleDispatch} className="space-y-4 bg-white">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select 
                    className="w-full border rounded p-2" 
                    value={dispatchForm.type} onChange={e => setDispatchForm({...dispatchForm, type: e.target.value})}
                  >
                    <option>Outbreak</option><option>Weather</option><option>System</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Severity</label>
                  <select 
                    className="w-full border rounded p-2" 
                    value={dispatchForm.severity} onChange={e => setDispatchForm({...dispatchForm, severity: e.target.value})}
                  >
                    <option value="low">Low</option><option value="medium">Medium</option>
                    <option value="high">High</option><option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium mb-1">Ward Code</label>
                   <input 
                     type="text" className="w-full border rounded p-2" required
                     value={dispatchForm.ward_code} onChange={e => setDispatchForm({...dispatchForm, ward_code: e.target.value})}
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium mb-1">Title</label>
                   <input 
                     type="text" className="w-full border rounded p-2" required
                     value={dispatchForm.title} onChange={e => setDispatchForm({...dispatchForm, title: e.target.value})}
                   />
                 </div>
              </div>
              <div>
                 <label className="block text-sm font-medium mb-1">Description</label>
                 <textarea 
                   className="w-full border rounded p-2" rows={3} required
                   value={dispatchForm.description} onChange={e => setDispatchForm({...dispatchForm, description: e.target.value})}
                 />
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" type="button" onClick={() => setShowDispatchModal(false)}>Cancel</Button>
                <Button type="submit">Deploy Alert Trigger</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}