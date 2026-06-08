import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = ({ text = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      <p className="text-slate-500 font-bold">{text}</p>
    </div>
  );
};

export default LoadingState;
