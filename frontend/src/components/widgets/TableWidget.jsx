import React from 'react';

function TableWidget({ title, columns, data, onRemove }) {
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-2 text-left font-semibold text-gray-700">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {(data || []).slice(0, 5).map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={`${idx}-${col}`} className="px-4 py-3 text-gray-900">
                    {row[col] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(data || []).length === 0 && (
        <p className="text-center text-gray-500 py-8">Sin datos disponibles</p>
      )}
    </div>
  );
}

export default TableWidget;
