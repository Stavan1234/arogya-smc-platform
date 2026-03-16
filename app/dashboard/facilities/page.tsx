'use client';

import { useEffect, useState } from 'react';
import { Facility } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);

  useEffect(() => {
    fetch('/api/public/facilities') // reuse public endpoint
      .then(res => res.json())
      .then(setFacilities);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Facility Resource Monitor</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {facilities.map(f => (
          <Card key={f.id}>
            <CardHeader>
              <CardTitle>{f.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Beds:</span>
                  <span className="font-semibold">
                    {f.beds_available}/{f.beds_total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ICU:</span>
                  <span className="font-semibold">
                    {f.icu_available}/{f.icu_total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ventilators:</span>
                  <span className="font-semibold">
                    {f.ventilators_available}/{f.ventilators_total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Oxygen:</span>
                  <Badge variant={f.oxygen_available ? 'default' : 'destructive'}>
                    {f.oxygen_available ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Last updated: {new Date(f.last_updated).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}