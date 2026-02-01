import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface GaugeChartProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  thresholds?: { low: number; high: number }; // boundaries for zones
  inverse?: boolean; // if true, low is good (green)
  tooltipContent?: React.ReactNode; // Optional custom tooltip content
}

const RADIAN = Math.PI / 180;

const GaugeChart: React.FC<GaugeChartProps> = ({ 
  value, 
  max, 
  label, 
  unit, 
  thresholds = { low: 33, high: 66 },
  inverse = false,
  tooltipContent
}) => {
  const percentage = Math.min(Math.max(value / max, 0), 1);
  
  // Define zones
  const lowVal = thresholds.low;
  const midVal = thresholds.high - thresholds.low;
  const highVal = max - thresholds.high;
  
  // Check if configuration is valid for PieChart data, else fallback to safe defaults
  const safeData = (lowVal > 0 && midVal > 0 && highVal > 0) ? [
      { name: 'Low', value: lowVal, color: inverse ? '#16a34a' : '#dc2626' }, // Green if inverse, else Red
      { name: 'Mid', value: midVal, color: '#eab308' }, // Yellow
      { name: 'High', value: highVal, color: inverse ? '#dc2626' : '#16a34a' }, // Red if inverse, else Green
  ] : [
      { name: 'All', value: max, color: '#e5e7eb' }
  ];

  // Calculate Needle Angle (180 to 0)
  const angle = 180 - (percentage * 180);
  
  return (
    <div className={`flex flex-col items-center justify-center h-full relative group ${tooltipContent ? 'cursor-help' : ''}`}>
      {/* Tooltip Popup */}
      {tooltipContent && (
        <div className="absolute opacity-0 group-hover:opacity-100 transition-all duration-200 bottom-[85%] left-1/2 transform -translate-x-1/2 mb-2 z-50 w-64 bg-gray-900/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-gray-700 pointer-events-none">
          {tooltipContent}
          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900/95"></div>
        </div>
      )}

      <div className="relative w-full h-32 flex items-end justify-center overflow-hidden">
        <ResponsiveContainer width="100%" height="200%">
          <PieChart>
            <Pie
              data={safeData}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={80}
              outerRadius={110}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              {safeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Needle */}
        <div 
            className="absolute bottom-0 left-1/2 w-1 h-[90px] bg-gray-800 origin-bottom rounded-full transition-transform duration-1000 ease-out z-10"
            style={{ 
                transform: `translateX(-50%) rotate(${angle - 90}deg)`, // -90 adjustment because div starts vertical
                boxShadow: '0 0 5px rgba(0,0,0,0.3)'
            }}
        >
            <div className="w-4 h-4 bg-gray-900 rounded-full absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 border-2 border-white"></div>
        </div>
      </div>
      
      <div className="mt-4 text-center z-10">
        <div className="text-3xl font-bold text-gray-800 leading-none">
            {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
        </div>
        <div className="text-xs text-gray-500 font-medium uppercase mt-1">{unit}</div>
        <div className="text-sm font-semibold text-gray-600 mt-2 border-t border-gray-200 pt-2 w-full">{label}</div>
      </div>
    </div>
  );
};

export default GaugeChart;