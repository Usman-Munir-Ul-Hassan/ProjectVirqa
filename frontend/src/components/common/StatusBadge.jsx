import React from 'react';
import { getStatusColor } from '../../utils/formatUtils';

const StatusBadge = ({ status }) => {
  return (
    <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
