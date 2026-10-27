import React from 'react';
export const EmptyState = ({ icon: Icon, title, description, actionText, onAction }) => {
    return (<div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="w-14 h-14 rounded-full bg-blue-50 text-[#1E3A5F] flex items-center justify-center mb-4">
        <Icon className="w-7 h-7"/>
      </div>
      <h3 className="text-lg font-serif font-semibold text-[#1A2238]">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mt-1 mb-5">{description}</p>
      {actionText && onAction && (<button onClick={onAction} className="px-4 py-2 bg-[#1E3A5F] hover:bg-[#162C47] text-white text-sm font-medium rounded-xl transition shadow-sm">
          {actionText}
        </button>)}
    </div>);
};
