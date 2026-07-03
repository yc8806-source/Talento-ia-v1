# ⌨️ Sistema de Typing Test - Talent IA

## Descripción General

El sistema de Typing Test permite evaluar la velocidad y precisión de escritura de los candidatos. Calcula:
- **WPM (Palabras Por Minuto)** - Velocidad de escritura
- **Precisión** - Porcentaje de caracteres correctos
- **Errores** - Cantidad de caracteres incorrectos

## Métricas Calculadas

### WPM (Palabras Por Minuto)
```
WPM = (Caracteres escritos / 5) / (Tiempo en minutos)

Ejemplo:
- Escribiste 350 caracteres en 60 segundos
- WPM Bruto = (350 / 5) / 1 = 70 WPM
- Con 10 errores: WPM Neto = 70 - 10 = 60 WPM
```

### Precisión
```
Precisión = (Caracteres correctos / Total caracteres) * 100

Ejemplo:
- Escribiste 350 caracteres, 340 correctos
- Precisión = (340 / 350) * 100 = 97.14%
```

### Errores
```
Se cuentan caracteres incorrectos o faltantes
- Carácter erróneo: cuenta como 1 error
- Carácter faltante: cuenta como 1 error
```

## Base de Datos

### Tabla: typing_tests
```sql
id                  | SERIAL PRIMARY KEY
title              | VARCHAR(255)      - Nombre del test
description        | TEXT              - Descripción
text               | TEXT              - Texto a escribir
difficulty         | VARCHAR(20)       - easy, medium, hard
duration_seconds   | INTEGER           - Duración de la prueba
word_count         | INTEGER           - Cantidad de palabras
created_at         | TIMESTAMP         - Fecha de creación
```

### Tabla: typing_results
```sql
id                      | SERIAL PRIMARY KEY
candidate_id            | INTEGER           - Candidato que hizo la prueba
candidate_vacancy_id    | INTEGER           - Relación con vacante (opcional)
typing_test_id          | INTEGER           - Test que se realizó
input_text              | TEXT              - Texto que escribió el candidato
wpm                     | DECIMAL           - Palabras por minuto (neto)
accuracy                | DECIMAL           - Precisión en porcentaje
gross_wpm               | DECIMAL           - WPM sin penalidad
net_wpm                 | DECIMAL           - WPM con penalidad
total_errors            | INTEGER           - Cantidad de errores
time_taken_seconds      | INTEGER           - Tiempo utilizado
started_at              | TIMESTAMP         - Cuándo inició
completed_at            | TIMESTAMP         - Cuándo terminó
status                  | VARCHAR(20)       - Estado: completed, abandoned
created_at              | TIMESTAMP         - Fecha de creación
```

## API Endpoints

### 1. Obtener todos los typing tests
```
GET /api/typing/tests?difficulty=medium
```

**Respuesta:**
```json
{
  "total": 5,
  "tests": [
    {
      "id": 1,
      "title": "Texto Fácil - Presentación",
      "description": "Texto simple sobre presentación profesional",
      "difficulty": "easy",
      "durationSeconds": 45,
      "wordCount": 36
    }
  ]
}
```

### 2. Obtener información del test (sin el texto)
```
GET /api/typing/tests/1
```

**Respuesta:**
```json
{
  "id": 1,
  "title": "Texto Fácil - Presentación",
  "description": "...",
  "difficulty": "easy",
  "durationSeconds": 45,
  "wordCount": 36
}
```

### 3. Obtener el texto del test (requiere autenticación)
```
GET /api/typing/tests/1/text
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "id": 1,
  "title": "Texto Fácil - Presentación",
  "text": "Hola, mi nombre es Juan...",
  "durationSeconds": 45
}
```

### 4. Enviar resultado del typing test
```
POST /api/typing/results/submit
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "typingTestId": 1,
  "inputText": "Hola, mi nombre es Juan y tengo cinco años...",
  "timeSeconds": 42,
  "startedAt": "2026-07-03T15:30:00Z",
  "candidateVacancyId": 5
}
```

**Respuesta:**
```json
{
  "message": "Resultado de typing test guardado exitosamente",
  "result": {
    "id": 123,
    "wpm": 65.5,
    "grossWPM": 70.2,
    "netWPM": 65.5,
    "accuracy": 96.8,
    "totalErrors": 3,
    "wordCount": 36,
    "completedAt": "2026-07-03T15:31:42Z"
  }
}
```

### 5. Obtener resultados del candidato
```
GET /api/typing/results/candidate/42
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "candidateId": 42,
  "total": 3,
  "results": [
    {
      "id": 123,
      "testTitle": "Texto Fácil - Presentación",
      "difficulty": "easy",
      "wpm": 65.5,
      "accuracy": 96.8,
      "netWPM": 65.5,
      "totalErrors": 3,
      "timeSeconds": 42,
      "completedAt": "2026-07-03T15:31:42Z"
    }
  ]
}
```

### 6. Obtener reporte de typing
```
GET /api/typing/report/candidate/42
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "candidateId": 42,
  "summary": {
    "totalTests": 3,
    "averageWPM": 62.3,
    "averageAccuracy": 95.5,
    "bestWPM": 70.5,
    "bestAccuracy": 98.2
  },
  "results": [...]
}
```

### 7. Crear nuevo typing test (solo admin)
```
POST /api/typing/tests
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Test Personalizado",
  "description": "Descripción del test",
  "text": "Texto que deben escribir los candidatos...",
  "difficulty": "medium",
  "durationSeconds": 60
}
```

## Componente Frontend

### TypingTest.jsx

```jsx
<TypingTest
  testId={1}
  testTitle="Texto Fácil - Presentación"
  testText="Hola, mi nombre es Juan..."
  durationSeconds={45}
  onComplete={(result) => {
    console.log('WPM:', result.wpm);
    console.log('Accuracy:', result.accuracy);
  }}
/>
```

**Props:**
- `testId` (number) - ID del test
- `testTitle` (string) - Título para mostrar
- `testText` (string) - Texto a escribir
- `durationSeconds` (number) - Duración en segundos
- `onComplete` (function) - Callback cuando termina

**Callback Result:**
```json
{
  "wpm": 65.5,
  "grossWPM": 70.2,
  "accuracy": 96.8,
  "errors": 3,
  "timeUsed": 42,
  "charCount": 350,
  "correctChars": 340
}
```

## Niveles de Dificultad

| Nivel | Palabras | Duración | Complejidad |
|-------|----------|----------|-------------|
| **Easy** | 21-40 | 30-45s | Vocabulario simple |
| **Medium** | 45-60 | 60s | Vocabulario profesional |
| **Hard** | 60+ | 90s+ | Términos técnicos |

## Estándares de Referencia

### WPM (Palabras por minuto)
- **< 40 WPM**: Principiante
- **40-60 WPM**: Intermedio
- **60-80 WPM**: Bueno
- **80+ WPM**: Excelente
- **100+ WPM**: Profesional

### Precisión
- **< 90%**: Necesita mejorar
- **90-95%**: Bueno
- **95-98%**: Muy bueno
- **> 98%**: Excelente

## Flujo de Uso

```
1. Candidato selecciona un test
   ↓
2. Frontend carga información del test
   ↓
3. Candidato presiona "Iniciar"
   ↓
4. Frontend obtiene el texto completo
   ↓
5. Candidato escribe mientras se cuenta el tiempo
   ↓
6. Se muestra feedback en vivo (verde/rojo)
   ↓
7. Tiempo se acaba o candidato termina
   ↓
8. Se calcula WPM, precisión y errores
   ↓
9. Se envía resultado al backend
   ↓
10. Se muestra resultado y reporte
```

## Ejemplo de Integración en Dashboard

```jsx
import TypingTest from '../components/TypingTest';
import { useState, useEffect } from 'react';
import { typingAPI } from '../api/api';

function CandidateDashboard() {
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    // Cargar tests disponibles
    typingAPI.getAllTests().then(res => {
      setSelectedTest(res.data.tests[0]);
    });
  }, []);

  const handleTestComplete = async (result) => {
    // Enviar resultado
    await typingAPI.submitResult({
      typingTestId: selectedTest.id,
      inputText: result.inputText,
      timeSeconds: result.timeUsed,
    });

    // Mostrar reporte
    const report = await typingAPI.getReport(currentUserId);
    console.log('Promedio WPM:', report.summary.averageWPM);
  };

  if (!selectedTest) return <div>Cargando...</div>;

  return (
    <TypingTest
      testId={selectedTest.id}
      testTitle={selectedTest.title}
      testText={selectedTest.text}
      durationSeconds={selectedTest.durationSeconds}
      onComplete={handleTestComplete}
    />
  );
}
```

## Scripts de Seeding

### Crear tablas
```bash
npm run seed:typing
```

### Agregar a seed general
```bash
npm run seed
# Incluye typing tests automáticamente
```

## Análisis de Resultados

### Query para encontrar mejores tipógrafos
```sql
SELECT
  c.first_name, c.last_name,
  AVG(tr.wpm) as avg_wpm,
  AVG(tr.accuracy) as avg_accuracy,
  MAX(tr.wpm) as best_wpm,
  COUNT(*) as total_tests
FROM typing_results tr
JOIN candidates c ON tr.candidate_id = c.id
GROUP BY c.id, c.first_name, c.last_name
HAVING AVG(tr.wpm) > 60
ORDER BY avg_wpm DESC;
```

### Query para identificar áreas de mejora
```sql
SELECT
  tt.difficulty,
  AVG(tr.accuracy) as avg_accuracy,
  AVG(tr.wpm) as avg_wpm,
  COUNT(*) as attempts
FROM typing_results tr
JOIN typing_tests tt ON tr.typing_test_id = tt.id
GROUP BY tt.difficulty
ORDER BY avg_accuracy ASC;
```

## Buenas Prácticas

✅ **DO:**
- Usar textos variados para evitar memorización
- Incluir tests de diferentes dificultades
- Requerir autenticación para ver el texto
- Registrar todos los intentos
- Mostrar feedback en vivo durante la prueba

❌ **DON'T:**
- Permitir que candidatos vean el texto antes de empezar
- Aceptar inputs demasiado cortos (< 10 segundos)
- Cacular WPM si el candidato no escribió nada
- Perder el texto original para auditoría

## Seguridad

- El texto completo solo se muestra cuando el usuario se autentica
- Se registra auditoría de cada resultado
- No se permite trampa/copia del texto (validación en backend)
- Los resultados se guardan inmutablemente

## Próximas Mejoras

- [ ] Textos dinámicos generados por IA
- [ ] Análisis de patrones de escritura
- [ ] Comparación con otros candidatos
- [ ] Certificados de velocidad de escritura
- [ ] Estadísticas por teclado/idioma
