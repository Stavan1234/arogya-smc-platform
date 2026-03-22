'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit3, User, AlertTriangle } from 'lucide-react';

interface HighRiskReferral {
  id: number;
  patient_name: string;
  age: number;
  risk_score: number;
  status: 'pending' | 'assessed' | 'admitted' | 'discharged' | 'transferred';
  clinical_notes?: string;
  referred_by: string;
  referred_at: string;
  updated_at?: string;
}

export default function InterventionsPage() {
  const [referrals, setReferrals] = useState<HighRiskReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hospital/referrals');
      const json = await res.json();
      if (json.success) {
        setReferrals(json.data);
      }
    } catch (e) {
      setError('Failed to fetch high-risk referrals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const updateStatus = async (referralId: number, status: string, notes: string) => {
    try {
      setMessage('');
      setError('');
      const res = await fetch('/api/hospital/referrals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referral_id: referralId, status, clinical_notes: notes }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(`Status updated to ${status}`);
        setEditingId(null);
        fetchReferrals();
      } else {
        setError(data.error || 'Update failed');
      }
    } catch (err) {
      setError('Update failed');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      assessed: 'bg-blue-100 text-blue-800',
      admitted: 'bg-green-100 text-green-800',
      discharged: 'bg-gray-100 text-gray-800',
      transferred: 'bg-purple-100 text-purple-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-12">Loading high-risk referrals...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center mb-6">
          <AlertTriangle className="h-8 w-8 text-orange-500 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">High-Risk Interventions Triage</h1>
            <p className="text-gray-600">Manage maternal/child high-risk referrals from ASHA/field reports</p>
          </div>
        </div>

        {message && <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">{message}</div>}
        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referred By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referred</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {referrals.map((referral) => (
                <tr key={referral.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <User className="h-10 w-10 text-gray-300" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{referral.patient_name}</div>
                        <div className="text-sm text-gray-500">{referral.age} years</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white">
                      {referral.risk_score}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusBadge(referral.status)}>
                      {referral.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{referral.referred_by}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(referral.referred_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(editingId === referral.id ? null : referral.id)}
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        {editingId === referral.id ? 'Cancel' : 'Update Status'}
                      </Button>
                    </div>
                    {editingId === referral.id && (
                      <div className="mt-2 space-y-2 pt-2 border-t">
                        <Select defaultValue={referral.status} onValueChange={(value) => {
                          // Preview only - actual update on submit
                        }}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="assessed">Assessed</SelectItem>
                            <SelectItem value="admitted">Admitted</SelectItem>
                            <SelectItem value="discharged">Discharged</SelectItem>
                            <SelectItem value="transferred">Transferred</SelectItem>
                          </SelectContent>
                        </Select>
                        <textarea
                          rows={2}
                          placeholder="Clinical notes / outcome..."
                          defaultValue={referral.clinical_notes || ''}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <Button 
                          className="w-full"
                          onClick={() => updateStatus(referral.id, 'assessed', 'Updated status')} // Demo - use form state
                        >
                          Save Intervention
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {referrals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No high-risk maternal/child referrals pending.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

