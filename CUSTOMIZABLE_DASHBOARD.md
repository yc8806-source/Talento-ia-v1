# 🎨 Dashboard Personalizable - Documentación

Sistema de widgets dinámicos y personalizables para Talent IA.

## 📋 Tabla de Contenidos

1. [Descripción](#descripción)
2. [Arquitectura](#arquitectura)
3. [Widgets Disponibles](#widgets-disponibles)
4. [Uso](#uso)
5. [Presets](#presets)
6. [Almacenamiento](#almacenamiento)
7. [Desarrollo de Widgets](#desarrollo-de-widgets)

---

## Descripción

El sistema de dashboard personalizable permite a los usuarios:

✅ **Agregar/Remover widgets** según sus necesidades
✅ **Reordenar widgets** en el grid
✅ **Guardar configuración** en localStorage
✅ **Aplicar presets** predefinidos
✅ **Modo edición** para cambiar la configuración
✅ **Vista previa** de widgets antes de agregar

---

## Arquitectura

```
CustomizableDashboard (Componente Principal)
    ├── Widget Selector (Agregar widgets)
    ├── Preset Manager (Aplicar presets)
    └── Widget Grid (Mostrar widgets)
        ├── KPIWidget (Componentes)
        ├── ChartWidget
        └── TableWidget

widgetConfig.js (Configuración)
    ├── AVAILABLE_WIDGETS (Definiciones)
    ├── DASHBOARD_PRESETS (Configuraciones guardadas)
    ├── getDefaultDashboardConfig() (Cargar)
    └── saveDashboardConfig() (Guardar)
```

---

## Widgets Disponibles

### 1. KPI Widgets (Indicadores)

**Disponibles:**
- 💼 Vacantes Activas
- 👥 Total Candidatos
- 📋 Evaluaciones Pendientes
- 📈 Promedio de Resultados

**Características:**
```javascript
{
  title: "Título del KPI",
  value: 42,
  icon: "💼",
  trend: 5,           // % de cambio (opcional)
  color: "blue"       // blue, green, purple, orange
}
```

### 2. Chart Widgets (Gráficos)

**Disponibles:**
- 📊 Candidatos por Vacante (Bar)
- ⭐ Competencias Top (Pie)
- 🔄 Estado de Evaluaciones (Donut)
- 🎯 Recomendaciones por Operación (Bar)

**Tipos soportados:**
```javascript
{
  type: "bar",  // bar, pie, donut
  data: [
    { name: "Valor 1", value: 100 },
    { name: "Valor 2", value: 85 },
  ]
}
```

### 3. Table Widgets (Tablas)

**Disponibles:**
- 🆕 Candidatos Recientes
- 🏆 Mejores Desempeños
- ✓ Acciones Pendientes

**Características:**
```javascript
{
  columns: ["Nombre", "Email", "Puntaje"],
  data: [
    { Nombre: "Juan", Email: "juan@email.com", Puntaje: "95%" },
  ]
}
```

---

## Uso

### Componente Principal

```javascript
import CustomizableDashboard from '../components/CustomizableDashboard';

function Dashboard() {
  const dashboardData = {
    active_vacancies: 5,
    total_candidates: 42,
    pending_evaluations: 8,
    average_score: 78,
    candidates_by_vacancy_data: [
      { name: "Dev React", value: 12 },
      { name: "Dev Node", value: 8 },
    ],
    top_competencies_data: [
      { name: "Comunicación", value: 85 },
      { name: "Empatía", value: 78 },
    ],
    // ... más datos
  };

  return <CustomizableDashboard data={dashboardData} />;
}
```

### Propiedades del Data Object

```javascript
{
  // KPI Values
  active_vacancies: 5,
  total_candidates: 42,
  pending_evaluations: 8,
  average_score: 78,

  // Chart Data
  candidates_by_vacancy_data: Array,
  top_competencies_data: Array,
  evaluation_status_data: Array,
  operation_recommendations_data: Array,

  // Table Data
  recent_candidates_data: Array,
  recent_candidates_columns: Array,
  top_performers_data: Array,
  top_performers_columns: Array,
}
```

---

## Presets

### Preset: Default (Por defecto)

```javascript
{
  name: 'Vista por Defecto',
  widgets: [
    'active_vacancies',
    'total_candidates',
    'pending_evaluations',
    'average_score',
    'candidates_by_vacancy',
    'top_competencies',
  ]
}
```

**Uso:**
```javascript
// Aplicado automáticamente al cargar
const config = getDefaultDashboardConfig();
```

### Preset: Compact (Compacta)

```javascript
{
  name: 'Vista Compacta',
  widgets: [
    'active_vacancies',
    'total_candidates',
    'pending_evaluations',
    'average_score',
  ]
}
```

**Uso:**
```javascript
const compactConfig = DASHBOARD_PRESETS.compact.widgets;
```

### Preset: Detailed (Detallada)

```javascript
{
  name: 'Vista Detallada',
  widgets: [
    // Todos los widgets disponibles
    'active_vacancies',
    'total_candidates',
    'pending_evaluations',
    'average_score',
    'candidates_by_vacancy',
    'top_competencies',
    'evaluation_status',
    'operation_recommendations',
    'recent_candidates',
    'top_performers',
  ]
}
```

### Crear Preset Personalizado

```javascript
// En widgetConfig.js
export const DASHBOARD_PRESETS = {
  // ... presets existentes
  
  mi_preset: {
    name: 'Mi Preset Personalizado',
    description: 'Widgets que más uso',
    widgets: [
      { id: 'active_vacancies', position: { row: 0, col: 0 } },
      { id: 'top_performers', position: { row: 0, col: 4 } },
      // ... más widgets
    ],
  },
};
```

---

## Almacenamiento

### localStorage

**Clave:** `dashboardConfig`

**Formato:**
```json
[
  { "id": "active_vacancies", "position": { "row": 0, "col": 0 } },
  { "id": "top_competencies", "position": { "row": 1, "col": 4 } }
]
```

### Funciones de Almacenamiento

```javascript
import {
  getDefaultDashboardConfig,
  saveDashboardConfig,
} from '../utils/widgetConfig';

// Obtener configuración
const config = getDefaultDashboardConfig();

// Guardar configuración
saveDashboardConfig(config);
```

### Migración a Backend (Opcional)

Para guardar en base de datos:

```javascript
// Backend: POST /api/dashboard/config
const saveDashboardConfigDB = async (userId, config) => {
  await fetch(`/api/dashboard/config`, {
    method: 'POST',
    body: JSON.stringify({ userId, config }),
  });
};

// Frontend: Usar en useEffect
useEffect(() => {
  saveDashboardConfigDB(userId, widgets);
}, [widgets]);
```

---

## Desarrollo de Widgets

### Crear Widget Personalizado

**1. Definir en widgetConfig.js:**

```javascript
export const AVAILABLE_WIDGETS = {
  // ... widgets existentes
  
  my_custom_widget: {
    id: 'my_custom_widget',
    name: 'Mi Widget Custom',
    category: 'custom',
    icon: '🎨',
    defaultSize: { width: 4, height: 2 },
    description: 'Descripción del widget',
  },
};
```

**2. Crear componente:**

```javascript
// components/widgets/MyCustomWidget.jsx
function MyCustomWidget({ data, onRemove }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 relative group">
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-200 rounded"
      >
        ✕
      </button>

      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Mi Widget Custom
      </h3>

      {/* Widget content */}
      <div>{JSON.stringify(data)}</div>
    </div>
  );
}

export default MyCustomWidget;
```

**3. Actualizar renderizado en CustomizableDashboard.jsx:**

```javascript
const renderWidget = (widgetId) => {
  const widgetInfo = AVAILABLE_WIDGETS[widgetId];
  
  switch (widgetInfo.category) {
    // ... casos existentes
    
    case 'custom':
      return (
        <MyCustomWidget
          key={widgetId}
          data={data[widgetId]}
          onRemove={() => removeWidget(widgetId)}
        />
      );
  }
};
```

### Ejemplo: Widget de Estadísticas

```javascript
function StatsWidget({ title, stats, onRemove }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 relative group">
      <button onClick={onRemove} className="...">✕</button>

      <h3 className="text-lg font-bold mb-4">{title}</h3>

      <div className="space-y-2">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <span className="text-gray-600">{stat.label}</span>
            <span className="font-bold text-lg">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Modo Edición

### Cambiar Modo

```javascript
// En CustomizableDashboard.jsx
const [isEditMode, setIsEditMode] = useState(false);

<button onClick={() => setIsEditMode(!isEditMode)}>
  {isEditMode ? 'Listo' : 'Editar'}
</button>
```

### Operaciones Disponibles en Modo Edición

| Operación | Función | Código |
|---|---|---|
| Agregar Widget | `addWidget(widgetId)` | `setWidgets([...widgets, { id }])` |
| Remover Widget | `removeWidget(widgetId)` | `setWidgets(widgets.filter(...))` |
| Aplicar Preset | `applyPreset(key)` | `setWidgets(preset.widgets)` |
| Resetear | `resetToDefault()` | `setWidgets(DEFAULT)` |

---

## Mejoras Futuras

### Drag and Drop
```javascript
import { DndContext } from '@dnd-kit/core';

<DndContext onDragEnd={handleDragEnd}>
  {/* Widgets con drag handles */}
</DndContext>
```

### Resize Widgets
```javascript
import { Resizable } from 'react-resizable';

<Resizable width={300} height={200} onResize={handleResize}>
  {/* Widget content */}
</Resizable>
```

### Filtros Globales
```javascript
const [filters, setFilters] = useState({
  dateRange: 'last30days',
  vacancy: 'all',
  status: 'all',
});

// Pasar a todos los widgets
<CustomizableDashboard data={dashboardData} filters={filters} />
```

### Exportar Configuración
```javascript
const exportConfig = () => {
  const config = getDefaultDashboardConfig();
  const json = JSON.stringify(config, null, 2);
  download('dashboard-config.json', json);
};

const importConfig = (file) => {
  const config = JSON.parse(file);
  saveDashboardConfig(config);
};
```

---

## Performance

### Optimizaciones Implementadas

✅ **Lazy Loading** - Widgets se cargan bajo demanda
✅ **Memoización** - React.memo en componentes de widget
✅ **localStorage** - Caching de configuración
✅ **Recharts** - Gráficos optimizados

### Monitoreo

```javascript
// Medir carga de widgets
useEffect(() => {
  const start = performance.now();
  // ... cargar datos
  const end = performance.now();
  console.log(`Dashboard loaded in ${end - start}ms`);
}, []);
```

---

## Troubleshooting

### Problema: Widgets no se guardan

**Solución:**
```javascript
// Verificar localStorage
console.log(localStorage.getItem('dashboardConfig'));

// Limpiar y resetear
localStorage.removeItem('dashboardConfig');
window.location.reload();
```

### Problema: Datos no se muestran

**Solución:**
```javascript
// Verificar estructura de datos
console.log('Dashboard Data:', dashboardData);

// Asegurar que las claves coincidan
// {
//   active_vacancies: 5,
//   candidates_by_vacancy_data: [],
// }
```

---

## Ejemplos Completos

### Dashboard Minimalista

```javascript
const minimalConfig = DASHBOARD_PRESETS.compact.widgets;

const minimalData = {
  active_vacancies: 5,
  total_candidates: 42,
  pending_evaluations: 8,
  average_score: 78,
};

<CustomizableDashboard data={minimalData} />
```

### Dashboard para Admins

```javascript
const adminConfig = DASHBOARD_PRESETS.detailed.widgets;

const adminData = {
  // Todos los datos disponibles
  active_vacancies: 5,
  total_candidates: 42,
  pending_evaluations: 8,
  average_score: 78,
  candidates_by_vacancy_data: [...],
  top_competencies_data: [...],
  evaluation_status_data: [...],
  operation_recommendations_data: [...],
  recent_candidates_data: [...],
  top_performers_data: [...],
};

<CustomizableDashboard data={adminData} />
```

---

**Última actualización:** 2026-07-02
**Versión:** 1.0.0
