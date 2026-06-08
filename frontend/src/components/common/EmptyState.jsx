import React from 'react';
import { FileText } from 'lucide-react';

const EmptyState = ({ title = "No data found", description = "Try adjusting your filters.", icon: Icon = FileText }) => {
  return (
    <div className="col-span-full p-16 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
      <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-slate-50 flex items-center justify-center">
        <Icon size={32} className="text-slate-400" />
      </div>
      <p className="text-slate-600 font-bold text-xl mb-2">{title}</p>
      <p className="text-slate-400 font-medium text-sm">{description}</p>
    </div>
  );
};

export default EmptyState;
