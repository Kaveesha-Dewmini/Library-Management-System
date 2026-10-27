import React from 'react';
export const StatusBadge = ({ status }) => {
    const normalized = status.toLowerCase();
    const styles = {
        active: 'bg-blue-50 text-blue-700 border-blue-200',
        overdue: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
        returned: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        pending: 'bg-gray-100 text-gray-700 border-gray-200',
        ready: 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse font-medium',
        fulfilled: 'bg-purple-50 text-purple-700 border-purple-200',
        expired: 'bg-gray-100 text-gray-500 border-gray-200 line-through',
        cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
        unpaid: 'bg-rose-50 text-rose-700 border-rose-200 font-medium',
        paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        waived: 'bg-gray-100 text-gray-600 border-gray-300',
        suspended: 'bg-red-50 text-red-700 border-red-300'
    };
    const currentStyle = styles[normalized] || 'bg-gray-50 text-gray-700 border-gray-200';
    return (<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border capitalize ${currentStyle}`}>
      {status}
    </span>);
};
