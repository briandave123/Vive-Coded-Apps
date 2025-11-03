import React from 'react';

interface MetricsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
}

export const MetricsCard = ({ title, value, icon }: MetricsCardProps) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 flex items-center justify-between transition-transform duration-200 hover:scale-105 hover:border-slate-600 min-w-[160px]">
      <div>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
      <div className="text-slate-500">{icon}</div>
    </div>
  );
};