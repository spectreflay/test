import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SalesChartProps {
  data: Array<{
    name: string;
    sales: number;
  }>;
}

const SalesChart = ({ data }: SalesChartProps) => {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="sales" className='fill-primary' />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;