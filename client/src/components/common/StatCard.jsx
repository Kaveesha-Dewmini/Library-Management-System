import React from 'react';
export const StatCard = ({ label, value, icon: Icon, subtext, color = 'blue' }) => {
    const colorStyles = {
        blue: 'bg-blue-50 text-[#1E3A5F] border-blue-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
        green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        red: 'bg-rose-50 text-rose-700 border-rose-100'
    };
    const iconBgStyles = {
        blue: 'bg-blue-100 text-[#1E3A5F]',
        amber: 'bg-amber-100 text-amber-700',
        green: 'bg-emerald-100 text-emerald-700',
        red: 'bg-rose-100 text-rose-700'
    };
    return (<div className={`p-5 rounded-2xl bg-white border ${colorStyles[color]} shadow-sm transition hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgStyles[color]}`}>
          <Icon className="w-5 h-5"/>
        </div>
      </div>
      <div className="mt-3">
        <div className="text-3xl font-bold font-serif text-[#1A2238]">{value}</div>
        {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
      </div>
    </div>);
};
