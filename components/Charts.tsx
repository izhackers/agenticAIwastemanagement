import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  Legend
} from 'recharts';
import { WasteFacility } from '../types';

interface ChartProps {
  data: WasteFacility[];
}

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6'];

export const StateDistributionChart: React.FC<ChartProps> = ({ data }) => {
  const stateCounts = data.reduce((acc, curr) => {
    acc[curr.negeri] = (acc[curr.negeri] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(stateCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => (b.count as number) - (a.count as number));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tick={{ fill: '#94a3b8' }} />
          <YAxis stroke="#94a3b8" fontSize={12} tick={{ fill: '#94a3b8' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
            itemStyle={{ color: '#f1f5f9' }}
            formatter={(value: number) => [value, 'Jumlah']}
            labelFormatter={(label) => `Negeri: ${label}`}
          />
          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Jumlah" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CategoryPieChart: React.FC<ChartProps> = ({ data }) => {
  const catCounts = data.reduce((acc, curr) => {
    // Simplify category names for better display with Malay translation
    let cat = curr.kat_fasili;
    const lowerCat = cat.toLowerCase();
    
    if (lowerCat.includes('sanitari') && !lowerCat.includes('bukan')) cat = 'TP Sanitari';
    else if (lowerCat.includes('bukan sanitari')) cat = 'Bukan Sanitari';
    else if (lowerCat.includes('stesen pemindahan')) cat = 'Stesen Pemindahan';
    else if (lowerCat.includes('ltp')) cat = 'Loji Rawatan (LTP)';
    else if (lowerCat.includes('insinerator') || lowerCat.includes('incinerator')) cat = 'Insinerator';
    else cat = 'Lain-lain';
    
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(catCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
             contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const GeoScatterChart: React.FC<ChartProps> = ({ data }) => {
    // Simple filter for invalid coordinates
    const validData = data.filter(d => d.x > 90 && d.y > 0);

    return (
        <div className="h-[300px] w-full relative">
            <div className="absolute top-2 right-2 text-xs text-slate-500 bg-slate-900/80 p-1 rounded z-10">
                Taburan Lat/Lon
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" dataKey="x" name="Longitud" domain={['auto', 'auto']} stroke="#94a3b8" unit="°" />
                    <YAxis type="number" dataKey="y" name="Latitud" domain={['auto', 'auto']} stroke="#94a3b8" unit="°" />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }} 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} 
                      formatter={(value: number, name: string) => [value, name === 'Longitud' ? 'Longitud' : 'Latitud']}
                    />
                    <Scatter name="Fasiliti" data={validData} fill="#22c55e" shape="circle" />
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    )
}