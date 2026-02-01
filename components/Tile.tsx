import React from 'react';
import { Info } from 'lucide-react';

interface TileProps {
  title: string;
  value: number | string;
  unit: string;
  onClick: () => void;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const Tile: React.FC<TileProps> = ({ title, value, unit, onClick, subtext, trend }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group relative"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h4>
        <Info className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : value}
        </span>
        <span className="text-xs text-gray-500 font-medium">{unit}</span>
      </div>
      {subtext && <div className="mt-2 text-xs text-gray-400">{subtext}</div>}
    </div>
  );
};

export default Tile;
