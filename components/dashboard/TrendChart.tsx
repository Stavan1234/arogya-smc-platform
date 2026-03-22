'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendDataPoint } from '@/types';

interface TrendChartProps {
  data: TrendDataPoint[];
}

export default function TrendChart({ data }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#e2e8f0" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} 
          tickLine={false} 
          axisLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }}
          dy={5}
        />
        <YAxis 
          tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} 
          tickLine={false} 
          axisLine={false}
          tickFormatter={(value) => value.toString()}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '2px', border: '1px solid #cbd5e1', padding: '4px', fontSize: '10px', fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          itemStyle={{ padding: 0 }}
          labelStyle={{ color: '#475569', marginBottom: '2px' }}
        />
        <Legend 
          iconType="circle" 
          iconSize={6}
          wrapperStyle={{ fontSize: '10px', fontWeight: 700, color: '#334155', paddingTop: '10px' }}
        />
        <Line type="monotone" dataKey="fever" name="Fever" stroke="#0f172a" strokeWidth={2} dot={{ r: 2, fill: '#0f172a' }} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="cough" name="Cough" stroke="#0284c7" strokeWidth={2} dot={{ r: 2, fill: '#0284c7' }} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="diarrhea" name="Diarrhea" stroke="#10b981" strokeWidth={2} dot={{ r: 2, fill: '#10b981' }} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}