import React from 'react';

function KPIWidget({ title, value, icon, trend, color = 'blue', onRemove }) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    green: 'from-green-50 to-green-100 border-green-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    orange: 'from-orange-50 to-orange-100 border-orange-200',
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg p-6 relative group`}>
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-200 rounded"
        title="Remover widget"
      >
        ✕
      </button>

      {/* Icon */}
      <div className={`text-4xl mb-3`}>{icon}</div>

      {/* Title */}
      <p className="text-gray-600 text-sm font-medium">{title}</p>

      {/* Value */}
      <div className="flex items-baseline gap-2 mt-2">
        <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
        {trend && (
          <span className={`text-xs font-semibold ${
            trend > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

export default KPIWidget;
