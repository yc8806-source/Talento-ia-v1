import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function ChartWidget({ title, data, type = 'bar', onRemove }) {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="bg-white rounded-lg shadow p-6 relative group">
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-200 rounded z-10"
        title="Remover widget"
      >
        ✕
      </button>

      {/* Title */}
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          ) : type === 'pie' ? (
            <PieChart>
              <Pie
                data={data || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(data || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          ) : (
            <BarChart data={data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ChartWidget;
