# 📝 Sistema de Pruebas de Ortografía y Gramática - Talent IA

## Descripción General

Sistema completo de evaluación de ortografía y gramática en español. Permite:
- Identificar errores ortográficos
- Corregir frases gramaticalmente incorrectas
- Seleccionar respuestas correctas
- Llenar espacios en blanco
- Calcular puntuación y precisión

## Tipos de Preguntas

### 1. Identificar Error (identify_error)
```
¿Cuál está mal escrito? "Ayer fuimos al spital"
- Respuesta correcta: "spital" (debe ser "hospital")
```

### 2. Opción Múltiple (multiple_choice)
```
"Si yo _______ una segunda oportunidad, cambiaría todo"
- tuviera (CORRECTO)
- tengo
- tendría
- tenía
```

### 3. Llenar Espacios en Blanco (fill_blank)
```
Completa: "Cuando _______ al cine, siempre compro palomitas"
- Respuesta correcta: "voy"
```

### 4. Corregir Oraciones (correct_sentence)
```
Corrige: "¿Que te parece mi trabajo?"
- Respuesta correcta: "¿Qué te parece mi trabajo?"
```

## Niveles de Dificultad

| Nivel | Descripción | Ejemplo |
|-------|-------------|---------|
| **Easy** | Ortografía básica | Errores comunes, palabras simples |
| **Medium** | Gramática, puntuación | Conjugación, tildes, homófonos |
| **Hard** | Redacción avanzada | Estilo, coherencia, redundancia |

## Base de Datos

### Tabla: spelling_grammar_tests
```sql
id              | SERIAL PRIMARY KEY
title           | VARCHAR(255)    - Nombre del test
description     | TEXT            - Descripción
difficulty      | VARCHAR(20)     - Nivel: easy, medium, hard
language        | VARCHAR(20)     - Idioma (es, en, etc)
test_type       | VARCHAR(50)     - Tipo: spelling, grammar
created_at      | TIMESTAMP       - Fecha de creación
```

### Tabla: spelling_grammar_questions
```sql
id              | SERIAL PRIMARY KEY
test_id         | INTEGER         - Test al que pertenece
question_type   | VARCHAR(50)     - Tipo de pregunta
question_text   | TEXT            - Enunciado de la pregunta
correct_answer  | TEXT            - Respuesta correcta
explanation     | TEXT            - Explicación
options         | JSONB           - Opciones (si es multiple choice)
difficulty      | VARCHAR(20)     - Dificultad individual
order_number    | INTEGER         - Orden en el test
created_at      | TIMESTAMP       - Fecha de creación
```

### Tabla: spelling_grammar_results
```sql
id                      | SERIAL PRIMARY KEY
candidate_id            | INTEGER           - Candidato
candidate_vacancy_id    | INTEGER           - Vacante (opcional)
test_id                 | INTEGER           - Test realizado
total_questions         | INTEGER           - Total de preguntas
correct_answers         | INTEGER           - Respuestas correctas
score                   | DECIMAL           - Puntuación (0-100)
accuracy                | DECIMAL           - Precisión en porcentaje
time_taken_seconds      | INTEGER           - Tiempo utilizado
answers                 | JSONB             - Detalle de respuestas
started_at              | TIMESTAMP         - Cuándo inició
completed_at            | TIMESTAMP         - Cuándo completó
status                  | VARCHAR(20)       - Estado: completed
created_at              | TIMESTAMP         - Fecha de creación
```

## API Endpoints

### 1. Obtener todos los tests
```
GET /api/spelling-grammar/tests?difficulty=medium&language=es
```

**Respuesta:**
```json
{
  "total": 5,
  "tests": [
    {
      "id": 1,
      "title": "Ortografía Básica - Nivel Fácil",
      "description": "Test básico de ortografía",
      "difficulty": "easy",
      "testType": "spelling"
    }
  ]
}
```

### 2. Obtener test con preguntas
```
GET /api/spelling-grammar/tests/1
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "id": 1,
  "title": "Ortografía Básica - Nivel Fácil",
  "difficulty": "easy",
  "testType": "spelling",
  "language": "es",
  "totalQuestions": 3,
  "questions": [
    {
      "id": 1,
      "type": "identify_error",
      "text": "¿Cuál es la palabra incorrecta?",
      "options": ["opción1", "opción2"],
      "difficulty": "easy",
      "explanation": "Explicación de la respuesta"
    }
  ]
}
```

### 3. Enviar respuestas
```
POST /api/spelling-grammar/results/submit
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "testId": 1,
  "answers": {
    "1": "spital",
    "2": "tuviera",
    "3": "voy"
  },
  "timeSeconds": 300,
  "startedAt": "2026-07-03T15:30:00Z",
  "candidateVacancyId": 5
}
```

**Respuesta:**
```json
{
  "message": "Resultado guardado exitosamente",
  "result": {
    "id": 123,
    "score": 85.5,
    "accuracy": 85.5,
    "correctAnswers": 3,
    "totalQuestions": 3,
    "completedAt": "2026-07-03T15:35:00Z",
    "detailedResults": [
      {
        "questionId": 1,
        "userAnswer": "spital",
        "correctAnswer": "spital",
        "isCorrect": true,
        "type": "identify_error"
      }
    ]
  }
}
```

### 4. Obtener resultados del candidato
```
GET /api/spelling-grammar/results/candidate/42
Authorization: Bearer {token}
```

### 5. Obtener reporte
```
GET /api/spelling-grammar/report/candidate/42
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "candidateId": 42,
  "summary": {
    "totalTests": 3,
    "averageScore": 82.33,
    "averageAccuracy": 82.33
  },
  "results": [...]
}
```

### 6. Crear nuevo test (solo admin)
```
POST /api/spelling-grammar/tests
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Test Personalizado",
  "description": "Descripción",
  "difficulty": "medium",
  "testType": "grammar",
  "language": "es",
  "questions": [
    {
      "type": "multiple_choice",
      "text": "Pregunta aquí",
      "correctAnswer": "opción correcta",
      "explanation": "Por qué es correcta",
      "options": ["opción1", "opción2", "opción3"],
      "difficulty": "medium"
    }
  ]
}
```

## Componente React

### SpellingGrammarTest.jsx

```jsx
<SpellingGrammarTest
  testId={1}
  testTitle="Ortografía Básica"
  testType="spelling"
  onComplete={(result) => {
    console.log('Score:', result.score);
    console.log('Accuracy:', result.accuracy);
  }}
/>
```

**Props:**
- `testId` (number) - ID del test
- `testTitle` (string) - Título para mostrar
- `testType` (string) - 'spelling' o 'grammar'
- `onComplete` (function) - Callback cuando termina

## Tests Incluidos

### 1. Ortografía Básica - Nivel Fácil
- 3 preguntas sobre errores comunes
- Tipo: identify_error, fill_blank
- Ejemplo: "spital" vs "hospital"

### 2. Gramática - Conjugación Verbal
- 3 preguntas sobre conjugación
- Tipo: multiple_choice, correct_sentence
- Ejemplo: "tuviera" vs "tengo"

### 3. Puntuación y Acentuación
- 3 preguntas sobre tildes y signos
- Tipo: identify_error, correct_sentence, fill_blank
- Ejemplo: "¿Que" vs "¿Qué"

### 4. Ortografía Avanzada - Homófonos
- 3 preguntas sobre palabras que suenan igual
- Tipo: multiple_choice, correct_sentence
- Ejemplo: "se" vs "sé"

### 5. Redacción y Estilo
- 2 preguntas sobre claridad y coherencia
- Tipo: correct_sentence, multiple_choice
- Ejemplo: "impotente" vs "competente"

## Estándares de Puntuación

| Puntuación | Nivel |
|------------|-------|
| 0-50% | Deficiente |
| 51-70% | Bajo |
| 71-85% | Bueno |
| 86-95% | Muy Bueno |
| 96-100% | Excelente |

## Flujo de Uso

```
1. Candidato selecciona un test
   ↓
2. Frontend carga las preguntas
   ↓
3. Candidato responde una por una
   ↓
4. Navegación con botones Anterior/Siguiente
   ↓
5. Botón "Enviar" al final
   ↓
6. Backend valida todas las respuestas
   ↓
7. Se calcula puntuación y precisión
   ↓
8. Se muestra resultado con explicaciones
   ↓
9. Se registra en auditoría
```

## Validación de Respuestas

**Case-Insensitive:**
```
"Tuviera" == "tuviera" ✓
```

**Espacios Normalizados:**
```
"  tuviera  " == "tuviera" ✓
```

**Por Tipo:**
- `multiple_choice`: Coincidencia exacta
- `fill_blank`: Coincidencia exacta (normalizada)
- `identify_error`: Número o texto del error
- `correct_sentence`: Coincidencia exacta (normalizada)

## Scripts de Seeding

### Crear tablas
```bash
npm run seed:spelling
```

### Agregar a seed general
```bash
npm run seed
# Incluye spelling/grammar tests automáticamente
```

## Análisis de Rendimiento

### Query para ver mejores puntuaciones
```sql
SELECT
  c.first_name, c.last_name,
  AVG(sgr.score) as avg_score,
  MAX(sgr.score) as best_score,
  COUNT(*) as total_tests
FROM spelling_grammar_results sgr
JOIN candidates c ON sgr.candidate_id = c.id
GROUP BY c.id
ORDER BY avg_score DESC;
```

### Query para identificar áreas débiles
```sql
SELECT
  sgt.title,
  AVG(sgr.score) as avg_score,
  COUNT(*) as total_attempts
FROM spelling_grammar_results sgr
JOIN spelling_grammar_tests sgt ON sgr.test_id = sgt.id
GROUP BY sgt.id, sgt.title
ORDER BY avg_score ASC;
```

## Buenas Prácticas

✅ **DO:**
- Incluir explicaciones claras para cada pregunta
- Variar tipos de preguntas en un test
- Aumentar dificultad gradualmente
- Registrar todas las respuestas para análisis
- Proporcionar feedback inmediato

❌ **DON'T:**
- Preguntas ambiguas o confusas
- Explicaciones insuficientes
- Todos los tests del mismo tipo
- Olvidar normalizar respuestas
- Preguntas capciosas

## Próximas Mejoras

- [ ] Preguntas dinámicas generadas por IA
- [ ] Análisis de patrones de errores
- [ ] Retroalimentación personalizada
- [ ] Tests adaptativos por dificultad
- [ ] Comparativa con otros candidatos
- [ ] Certificados de dominio del idioma
