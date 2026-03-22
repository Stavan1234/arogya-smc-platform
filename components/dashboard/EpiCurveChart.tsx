'use client';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export interface EpiDataPoint {
  date: string;
  dengue: number;
  malaria: number;
  fever: number;
  diarrhea: number;
  cholera: number;
}

interface EpiCurveChartProps {
  data: EpiDataPoint[];
}

export default function EpiCurveChart({ data }: EpiCurveChartProps) {
  const colors = {
    dengue: '#dc2626',
    malaria: '#ea580c', 
    fever: '#eab308',
    diarrhea: '#10b981',
    cholera: '#1d4ed8'
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.7} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} 
          tickLine={false} 
          axisLine={{ stroke: '#cbd5e1' }}
          dy={2}
        />
        <YAxis 
          tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} 
          tickLine={false} 
          axisLine={false}
          tickFormatter={(value: number) => value.toLocaleString()}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '4px', 
            border: '1px solid #e2e8f0', 
            padding: '8px', 
            fontSize: '11px', 
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
          labelStyle={{ color: '#1e293b', fontWeight: 700 }}
        />
        <Legend 
          iconType="rect" 
          iconSize={10}
          wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '8px' }}
          formatter={(value: string) => value.charAt(0).toUpperCase() + value.slice(1)}
        />
        <Bar dataKey="dengue" stackId="a" fill={colors.dengue} name="Dengue" />
        <Bar dataKey="malaria" stackId="a" fill={colors.malaria} name="Malaria" />
        <Bar dataKey="fever" stackId="a" fill={colors.fever} name="Fever" />
        <Bar dataKey="diarrhea" stackId="a" fill={colors.diarrhea} name="Diarrhea" />
        <Bar dataKey="cholera" stackId="a" fill={colors.cholera} name="Cholera" />
      </BarChart>
    </ResponsiveContainer>
  );
}

