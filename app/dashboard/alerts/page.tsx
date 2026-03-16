'use client';

import { useEffect, useState } from 'react';
import { Alert } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    fetch('/api/dashboard/alerts')
      .then(res => res.json())
      .then(setAlerts);
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Alert Management</h1>
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
    </div>
  );
}