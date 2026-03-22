// components/dashboard/TriagePanel.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, TrendingUp, TrendingDown } from 'lucide-react';

export interface Ward {
  code: string;
  name: string;
  metric: number;
  riskScore: number;
  trend: number | string;
  actions: string[];
}

interface TriagePanelProps {
  view: 'disease' | 'maternal';
  days: number;
  topWards?: Ward[];
  totalAtRisk?: number;
  onAction?: (action: string, ward: Ward) => void;
}

export default function TriagePanel({
  view,
  days,
  topWards = [],
  totalAtRisk = 0,
  onAction = () => {},
}: TriagePanelProps) {
  const title = view === 'disease' ? 'Top Outbreak Wards' : 'High-Risk Maternal Wards';
  const metricLabel = view === 'disease' ? 'Cases' : 'HRP';

  const handleAction = async (action: string, ward: Ward) => {
    try {
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: `CLICK_${action.toUpperCase().replace(/\s+/g, '_')}`,
          tableName: 'wards',
          recordId: ward.code,
          newData: { view, days, wardCode: ward.code, wardName: ward.name },
        }),
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
    onAction(action, ward);
  };

  // Ensure topWards is an array (it already is via default)
  const wards = Array.isArray(topWards) ? topWards : [];

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{totalAtRisk}</p>
          <p className="text-xs text-slate-500 mt-1">
            Wards with active {view === 'disease' ? 'cases' : 'risks'}
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Critical Wards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {wards.length > 0 ? (
            wards.map((ward) => (
              <div
                key={ward.code}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-slate-800">{ward.name}</p>
                    <p className="text-xs text-slate-500">{ward.code}</p>
                  </div>
                  <Badge variant={ward.riskScore > 50 ? 'destructive' : 'secondary'}>
                    Risk {ward.riskScore}
                  </Badge>
                </div>
                <div className="mt-2 flex justify-between items-center text-sm">
                  <span className="text-slate-600">
                    {metricLabel}: <span className="font-bold">{ward.metric}</span>
                  </span>
                  <span className="flex items-center text-xs">
                    {Number(ward.trend) > 0 ? (
                      <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                    )}
                    {Math.abs(Number(ward.trend))}%
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  {(ward.actions || []).map((action) => (
                    <Button
                      key={`${ward.code}-${action}`}
                      size="xs"
                      variant="outline"
                      onClick={() => handleAction(action, ward)}
                    >
                      {action === 'Call Ward In-charge' && <Phone className="h-3 w-3 mr-1" />}
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}