import React, { useState, useEffect } from 'react';
import { FiPlus, FiSettings, FiRotateCcw } from 'react-icons/fi';
import KPIWidget from './widgets/KPIWidget';
import ChartWidget from './widgets/ChartWidget';
import TableWidget from './widgets/TableWidget';
import {
  AVAILABLE_WIDGETS,
  DASHBOARD_PRESETS,
  getDefaultDashboardConfig,
  saveDashboardConfig,
  getWidgetsByCategory,
} from '../utils/widgetConfig';

function CustomizableDashboard({ data = {} }) {
  const [widgets, setWidgets] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);

  // Cargar configuración guardada al montar
  useEffect(() => {
    const config = getDefaultDashboardConfig();
    setWidgets(config);
  }, []);

  // Guardar configuración cuando cambia
  useEffect(() => {
    saveDashboardConfig(widgets);
  }, [widgets]);

  // Agregar widget
  const addWidget = (widgetId) => {
    if (!widgets.find(w => w.id === widgetId)) {
      setWidgets([...widgets, { id: widgetId, position: { row: 0, col: 0 } }]);
    }
    setShowWidgetSelector(false);
  };

  // Remover widget
  const removeWidget = (widgetId) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
  };

  // Aplicar preset
  const applyPreset = (presetKey) => {
    const preset = DASHBOARD_PRESETS[presetKey];
    if (preset) {
      setWidgets(preset.widgets);
    }
  };

  // Resetear a default
  const resetToDefault = () => {
    setWidgets(DASHBOARD_PRESETS.default.widgets);
  };

  // Renderizar widget según tipo
  const renderWidget = (widgetId) => {
    const widgetInfo = AVAILABLE_WIDGETS[widgetId];
    if (!widgetInfo) return null;

    const handleRemove = () => removeWidget(widgetId);

    switch (widgetInfo.category) {
      case 'kpi':
        return (
          <KPIWidget
            key={widgetId}
            title={widgetInfo.name}
            icon={widgetInfo.icon}
            value={data[widgetId] || 0}
            color={['blue', 'green', 'purple', 'orange'][Math.floor(Math.random() * 4)]}
            onRemove={handleRemove}
          />
        );

      case 'chart':
        return (
          <ChartWidget
            key={widgetId}
            title={widgetInfo.name}
            type={widgetInfo.chartType}
            data={data[`${widgetId}_data`] || []}
            onRemove={handleRemove}
          />
        );

      case 'table':
        return (
          <TableWidget
            key={widgetId}
            title={widgetInfo.name}
            columns={data[`${widgetId}_columns`] || ['Nombre', 'Valor']}
            data={data[`${widgetId}_data`] || []}
            onRemove={handleRemove}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dashboard Personalizable</h1>
          <p className="text-gray-600 mt-1">Configura tu panel según tus necesidades</p>
        </div>

        <div className="flex gap-2">
          {isEditMode && (
            <>
              <button
                onClick={() => setShowWidgetSelector(!showWidgetSelector)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition"
              >
                <FiPlus className="w-5 h-5" />
                Agregar Widget
              </button>
              <button
                onClick={resetToDefault}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold flex items-center gap-2 transition"
              >
                <FiRotateCcw className="w-5 h-5" />
                Reset
              </button>
            </>
          )}

          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition ${
              isEditMode
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            <FiSettings className="w-5 h-5" />
            {isEditMode ? 'Listo' : 'Editar'}
          </button>
        </div>
      </div>

      {/* Widget Selector */}
      {isEditMode && showWidgetSelector && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 className="font-bold text-gray-900">Widgets Disponibles</h3>

          {/* KPI Widgets */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">📊 KPIs</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {getWidgetsByCategory('kpi').map(widget => (
                <button
                  key={widget.id}
                  onClick={() => addWidget(widget.id)}
                  className={`p-3 rounded-lg border-2 transition text-center ${
                    widgets.find(w => w.id === widget.id)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <p className="text-2xl mb-1">{widget.icon}</p>
                  <p className="text-xs font-semibold text-gray-900">{widget.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Chart Widgets */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">📈 Gráficos</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {getWidgetsByCategory('chart').map(widget => (
                <button
                  key={widget.id}
                  onClick={() => addWidget(widget.id)}
                  className={`p-3 rounded-lg border-2 transition text-center ${
                    widgets.find(w => w.id === widget.id)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <p className="text-2xl mb-1">{widget.icon}</p>
                  <p className="text-xs font-semibold text-gray-900">{widget.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Table Widgets */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">📋 Tablas</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {getWidgetsByCategory('table').map(widget => (
                <button
                  key={widget.id}
                  onClick={() => addWidget(widget.id)}
                  className={`p-3 rounded-lg border-2 transition text-center ${
                    widgets.find(w => w.id === widget.id)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <p className="text-2xl mb-1">{widget.icon}</p>
                  <p className="text-xs font-semibold text-gray-900">{widget.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Presets */}
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-gray-700 mb-3">⚙️ Presets</h4>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(DASHBOARD_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded text-sm font-semibold transition"
                  title={preset.description}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-max">
        {widgets.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p className="text-lg mb-4">📭 No hay widgets configurados</p>
            <button
              onClick={() => {
                setIsEditMode(true);
                setShowWidgetSelector(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Agregar un Widget
            </button>
          </div>
        ) : (
          widgets.map(widget => renderWidget(widget.id))
        )}
      </div>

      {/* Edit Mode Hint */}
      {isEditMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
          💡 <strong>Modo edición activado:</strong> Agrega, remueve o reorganiza widgets.
          Haz clic en "Listo" cuando termines.
        </div>
      )}
    </div>
  );
}

export default CustomizableDashboard;
