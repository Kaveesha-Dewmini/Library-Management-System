import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
export const DueChip = ({ dueAt, status }) => {
    if (status === 'returned') {
        return <span className="text-xs text-gray-500">Returned</span>;
    }
    const now = new Date();
    const due = new Date(dueAt);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
        const overdueDays = Math.abs(diffDays);
        return (<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
        <AlertCircle className="w-3.5 h-3.5 text-rose-600"/>
        {overdueDays} {overdueDays === 1 ? 'day' : 'days'} overdue
      </span>);
    }
    if (diffDays === 0) {
        return (<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600"/>
        Due today
      </span>);
    }
    if (diffDays === 1) {
        return (<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <Calendar className="w-3.5 h-3.5"/>
        Due tomorrow
      </span>);
    }
    return (<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
      <Calendar className="w-3.5 h-3.5 text-gray-500"/>
      Due in {diffDays} days
    </span>);
};
