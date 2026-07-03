# Data Seeding - Talent IA Backend

## Overview

Los scripts de seeding permiten popular la base de datos con un banco completo de preguntas y exámenes listos para usar en evaluaciones.

## Estructura

```
backend/scripts/
├── seedQuestions.js    # Crea banco de 25 preguntas (5 por competencia)
└── seedExams.js        # Crea 4 exámenes predefinidos con preguntas
```

## Requisitos Previos

Antes de ejecutar el seeding, asegúrate de que:

1. ✅ La base de datos está creada y accesible
2. ✅ Las tablas están migradas (users, competencies, questions, exams, etc.)
3. ✅ Existen competencias en la base de datos

### Crear Competencias (si no existen)

Si aún no tienes competencias, crea las 6 competencias clave:

```sql
INSERT INTO competencies (name, description) VALUES
  ('Comunicación', 'Capacidad para comunicar ideas de forma clara y efectiva'),
  ('Liderazgo', 'Capacidad para guiar y motivar a otros'),
  ('Empatía', 'Capacidad para entender y conectar con otros'),
  ('Resolución de Problemas', 'Capacidad para identificar y resolver problemas'),
  ('Trabajo en Equipo', 'Capacidad para colaborar efectivamente'),
  ('Adaptabilidad', 'Capacidad para adaptarse a cambios');
```

## Cómo Usar

### Ejecutar Seeding Completo (RECOMENDADO)

```bash
npm run seed
```

Esto ejecuta en orden:
1. `seedQuestions.js` - Crea 40 preguntas
2. `seedExams.js` - Crea 4 exámenes
3. `seedVacancies.js` - Crea 6 vacantes
4. `seedCandidates.js` - Crea 35 candidatos asignados

### Ejecutar Solo Preguntas

```bash
npm run seed:questions
```

Crea 25 preguntas de evaluación:
- **5 preguntas por competencia** × 6 competencias
- **Mix de tipos**: multiple choice, true/false, likert scale
- **Puntuaciones**: 0-100 según calidad de respuesta

### Ejecutar Solo Exámenes

```bash
npm run seed:exams
```

Crea 4 exámenes predefinidos.

### Ejecutar Solo Vacantes

```bash
npm run seed:vacancies
```

Crea 6 vacantes con exámenes asignados.

### Ejecutar Solo Candidatos

```bash
npm run seed:candidates
```

Crea 35 candidatos y los asigna a las vacantes.

#### 1. Evaluación Integral de Competencias
- **Competencias**: Todas (6)
- **Duración**: 90 minutos
- **Puntuación mínima**: 60%
- **Preguntas**: 30 (5 por competencia)
- **Uso**: Evaluaciones generales de candidatos

#### 2. Evaluación de Habilidades Técnicas y Comunicación
- **Competencias**: Comunicación, Resolución de Problemas
- **Duración**: 60 minutos
- **Puntuación mínima**: 65%
- **Preguntas**: 8 (4 por competencia)
- **Uso**: Roles técnicos

#### 3. Evaluación de Liderazgo y Equipo
- **Competencias**: Liderazgo, Trabajo en Equipo, Empatía
- **Duración**: 60 minutos
- **Puntuación mínima**: 70%
- **Preguntas**: 12 (4 por competencia)
- **Uso**: Roles de liderazgo

#### 4. Evaluación de Adaptabilidad y Agilidad
- **Competencias**: Adaptabilidad, Resolución de Problemas
- **Duración**: 45 minutos
- **Puntuación mínima**: 60%
- **Preguntas**: 6 (3 por competencia)
- **Uso**: Roles en entornos de cambio rápido

## Banco de Preguntas

### Tipos de Preguntas Soportadas

1. **Multiple Choice** (opción múltiple)
   - 3-4 opciones por pregunta
   - Una respuesta correcta
   - Puntuación por opción

2. **True/False** (verdadero/falso)
   - 2 opciones
   - Rápido de responder

3. **Likert Scale** (escala Likert)
   - 5 niveles: Muy deficiente → Muy bueno
   - Autoevaluación

### Competencias Cubiertas

#### 1. **Comunicación** (5 preguntas)
- Claridad en la comunicación
- Adaptación a la audiencia
- Escucha activa
- Comunicación de información difícil
- Solicitud de feedback

#### 2. **Liderazgo** (5 preguntas)
- Estilo de liderazgo
- Manejo de rendimiento
- Desarrollo de talento
- Gestión de conflictos
- Capacidad de inspiración

#### 3. **Empatía** (5 preguntas)
- Construcción de relaciones
- Sensibilidad ante dificultades
- Inteligencia emocional
- Manejo de errores ajenos
- Consideración en decisiones

#### 4. **Resolución de Problemas** (5 preguntas)
- Análisis de problemas
- Identificación de causas raíz
- Generación de soluciones
- Adaptabilidad de soluciones
- Implementación y seguimiento

#### 5. **Trabajo en Equipo** (5 preguntas)
- Rol en el equipo
- Disposición a ayudar
- Receptividad al feedback
- Manejo de desacuerdos
- Contribución al éxito colectivo

#### 6. **Adaptabilidad** (5 preguntas)
- Reacción ante cambios
- Capacidad de aprendizaje
- Mentalidad de crecimiento
- Flexibilidad en planes
- Búsqueda de oportunidades

## Salida de Ejecución

### Seeding de Preguntas

```
🌱 Iniciando seeding de preguntas...

✅ 6 competencias encontradas:

  • Adaptabilidad (ID: 1)
  • Comunicación (ID: 2)
  • Empatía (ID: 3)
  • Liderazgo (ID: 4)
  • Resolución de Problemas (ID: 5)
  • Trabajo en Equipo (ID: 6)

📝 Agregando preguntas para: Adaptabilidad (ID: 1)
   ✓ Pregunta creada: "¿Cómo reaccionas ante cambios inesperados..."
   ✓ Pregunta creada: "Tu capacidad para aprender nuevas habilidades es..."
   [... más preguntas ...]

📊 Resumen de Seeding:
   • Total preguntas creadas: 30
   • Total opciones creadas: 145
   • Competencias procesadas: 6

✨ Seeding completado exitosamente!
```

### Seeding de Exámenes

```
🌱 Iniciando seeding de exámenes...

📋 Creando examen: Evaluación Integral de Competencias
   ✓ 5 preguntas asignadas de Adaptabilidad
   ✓ 5 preguntas asignadas de Comunicación
   [... más competencias ...]
   ✓ Examen creado (ID: 1)

📊 Resumen de Seeding:
   • Total exámenes creados: 4
   • Total preguntas asignadas: 56

✨ Seeding de exámenes completado exitosamente!
```

## Verificación

Después de ejecutar el seeding, verifica que los datos se crearon correctamente:

```bash
# Ver preguntas creadas
psql -U usuario -d talent_ia -c "SELECT COUNT(*) FROM questions;"
# Debería retornar: 30

# Ver exámenes creados
psql -U usuario -d talent_ia -c "SELECT COUNT(*) FROM exams;"
# Debería retornar: 4

# Ver preguntas por examen
psql -U usuario -d talent_ia -c "SELECT exam_id, COUNT(*) as question_count FROM exam_questions GROUP BY exam_id;"
```

## Limpiar Seeding (Deshacer)

Si necesitas limpiar los datos creados:

```sql
-- Eliminar preguntas de exámenes
DELETE FROM exam_questions;

-- Eliminar exámenes
DELETE FROM exams;

-- Eliminar opciones de preguntas
DELETE FROM question_options;

-- Eliminar preguntas
DELETE FROM questions;

-- Resetear secuencias (PostgreSQL)
ALTER SEQUENCE questions_id_seq RESTART WITH 1;
ALTER SEQUENCE question_options_id_seq RESTART WITH 1;
ALTER SEQUENCE exams_id_seq RESTART WITH 1;
ALTER SEQUENCE exam_questions_id_seq RESTART WITH 1;
```

## Personalizar Seeding

Para agregar más preguntas o modificar las existentes:

1. Edita `scripts/seedQuestions.js`
2. Modifica el objeto `questionBank` con nuevas preguntas
3. Ejecuta `npm run seed:questions` nuevamente

Estructura de una pregunta:

```javascript
{
  title: 'Enunciado de la pregunta',
  type: 'multiple_choice|true_false|likert',
  description: 'Descripción breve',
  options: [
    { text: 'Opción 1', score: 100 },
    { text: 'Opción 2', score: 50 },
    { text: 'Opción 3', score: 20 }
  ]
}
```

## Troubleshooting

### Error: "No hay competencias en la base de datos"
**Solución**: Crea las competencias primero usando el SQL anterior.

### Error: "Cannot find module '../src/config/database'"
**Solución**: Asegúrate de ejecutar desde el directorio `backend`:
```bash
cd backend
npm run seed
```

### Error: "connect ECONNREFUSED"
**Solución**: Verifica que PostgreSQL está corriendo y las credenciales de conexión son correctas en `.env`.

### Las preguntas ya existen y se duplicaron
**Solución**: Limpia los datos con el SQL de "Limpiar Seeding" y ejecuta nuevamente.

## Vacantes y Candidatos

Después de ejecutar `npm run seed`, se crean automáticamente:

### 6 Vacantes
- **Ejecutivo de Televentas** → Comunicación y Servicio + Excelencia Operacional
- **Especialista en Cobranzas** → Resolución y Adaptación + Integral
- **Representante de Atención Inbound** → Comunicación y Servicio + Integral
- **Especialista en eCare** → Integral + Comunicación y Servicio
- **Supervisor de Televentas** → Integral + Excelencia Operacional
- **Agente de Cobranzas Senior** → Integral + Resolución y Adaptación

### 35 Candidatos
- 5 candidatos por vacante
- Datos realistas: nombres, emails, teléfonos colombianos
- Estado: "invited" (listos para evaluación)

## Próximos Pasos

Después del seeding:

1. ✅ Candidatos asignados a vacantes
2. ✅ Invitar candidatos a evaluaciones (generar links)
3. ✅ Candidatos completan evaluaciones
4. ✅ Ver resultados en dashboards
5. ✅ Generar reportes de selección

