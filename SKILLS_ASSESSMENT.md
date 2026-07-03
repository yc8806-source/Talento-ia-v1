# Skills Assessment System

Evaluaciones de habilidades técnicas que permiten a los candidatos demostrar su conocimiento en lógica, programación, resolución de problemas y estructuras de datos.

## Características

### Tipos de Evaluaciones
- **Lógica y Pensamiento Crítico**: Problemas de secuencias, patrones y operaciones matemáticas
- **Programación en JavaScript**: Problemas de código con múltiples test cases
- **Resolución de Problemas Avanzada**: Problemas complejos de optimización y algoritmos
- **Manejo de Datos y Estructuras**: Búsqueda binaria, árboles binarios y estructuras de datos

### Características de Puntuación
- Validación automática de soluciones contra múltiples test cases
- Puntuación basada en problemas resueltos correctamente
- Cálculo de puntuación total como porcentaje
- Comparación contra umbral de aprobación configurable
- Seguimiento de tiempo de finalización

### Test Cases
Cada problema puede tener múltiples test cases con entradas y salidas esperadas. La validación:
- Normaliza output (minúsculas, espacios simples)
- Compara contra cada test case
- Requiere pasar todos los test cases para contar como correcto

## API Endpoints

### Obtener Todas las Evaluaciones
```http
GET /api/skills/assessments?skillType=logic&difficulty=easy
```

**Parámetros:**
- `skillType` (opcional): logic, programming, problem-solving, data-structures
- `difficulty` (opcional): easy, medium, hard

**Respuesta:**
```json
{
  "total": 4,
  "assessments": [
    {
      "id": 1,
      "title": "Lógica y Pensamiento Crítico",
      "description": "Evaluación de habilidades de lógica",
      "skillType": "logic",
      "difficulty": "easy",
      "estimatedTime": 20,
      "totalPoints": 30,
      "passingScore": 60
    }
  ]
}
```

### Obtener Evaluación con Problemas
```http
GET /api/skills/assessments/:assessmentId
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "id": 1,
  "title": "Lógica y Pensamiento Crítico",
  "description": "...",
  "totalProblems": 3,
  "skill_type": "logic",
  "difficulty": "easy",
  "estimated_time_minutes": 20,
  "total_points": 30,
  "passing_score": 60,
  "problems": [
    {
      "id": 1,
      "number": 1,
      "title": "Secuencia Numérica",
      "description": "¿Cuál es el próximo número?",
      "type": "logic",
      "language": null,
      "starterCode": "// Tu respuesta aquí",
      "expectedOutput": "32",
      "testCases": [
        {
          "input": "",
          "expectedOutput": "32"
        }
      ],
      "points": 10,
      "difficulty": "easy"
    }
  ]
}
```

### Enviar Solución
```http
POST /api/skills/solutions/submit
Authorization: Bearer {token}
Content-Type: application/json

{
  "assessmentId": 1,
  "problemId": 1,
  "code": "function solve() { return 32; }",
  "output": "32"
}
```

**Respuesta:**
```json
{
  "message": "Solución correcta!",
  "result": {
    "id": 123,
    "isCorrect": true,
    "pointsEarned": 10,
    "feedback": "Pasó 1/1 test cases",
    "testResults": [
      {
        "input": "",
        "expected": "32",
        "passed": true
      }
    ],
    "submittedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Completar Evaluación
```http
POST /api/skills/assessments/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "assessmentId": 1,
  "totalPoints": 30,
  "pointsEarned": 25,
  "problemsSolved": 2,
  "totalProblems": 3,
  "timeSeconds": 900,
  "startedAt": "2024-01-15T10:00:00Z",
  "candidateVacancyId": null
}
```

**Respuesta:**
```json
{
  "message": "Evaluación completada",
  "result": {
    "id": 456,
    "score": 83.33,
    "passed": true,
    "completedAt": "2024-01-15T10:15:00Z"
  }
}
```

### Obtener Resultados de Candidato
```http
GET /api/skills/results/candidate/:candidateId
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "candidateId": 1,
  "total": 2,
  "results": [
    {
      "id": 1,
      "assessmentTitle": "Lógica y Pensamiento Crítico",
      "skillType": "logic",
      "difficulty": "easy",
      "score": 80,
      "passed": true,
      "problemsSolved": 2,
      "totalProblems": 3,
      "timeSeconds": 600,
      "completedAt": "2024-01-15T10:15:00Z"
    }
  ]
}
```

### Obtener Reporte de Candidato
```http
GET /api/skills/report/candidate/:candidateId
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "candidateId": 1,
  "summary": {
    "totalAssessments": 2,
    "averageScore": 85.5,
    "passedCount": 2,
    "averageCompletion": 90
  },
  "bySkillType": [
    {
      "skillType": "logic",
      "averageScore": 80,
      "attempts": 1,
      "passed": 1
    }
  ],
  "results": [...]
}
```

## Componentes Frontend

### SkillsAssessmentTest
Componente principal para tomar una evaluación. Incluye:
- Navegación entre problemas
- Editor de código
- Entrada de output
- Validación en tiempo real
- Resultados detallados
- Pantalla de finalización

### SkillsAssessmentsPage
Página de listado que muestra:
- Todas las evaluaciones disponibles
- Filtrado por dificultad
- Información de tiempo estimado y puntos
- Botones para iniciar evaluación

## Sistema de Puntuación

### Cálculo de Puntuación
```
Score (%) = (pointsEarned / totalPoints) * 100
```

### Validación de Soluciones
1. Se valida cada problema contra sus test cases
2. Si pasa TODOS los test cases → isCorrect = true
3. Se asignan los puntos asociados al problema
4. La puntuación final se calcula como porcentaje
5. Se compara contra passing_score para determinar aprobación

### Puntuación por Evaluación (predeterminada)
- Lógica y Pensamiento Crítico: 30 puntos (60% para aprobar)
- Programación en JavaScript: 40 puntos (60% para aprobar)
- Resolución de Problemas: 50 puntos (70% para aprobar)
- Manejo de Datos y Estructuras: 30 puntos (60% para aprobar)

## Seeding

### Ejecutar Script de Seeding
```bash
npm run seed:skills
```

El script crea:
- 4 evaluaciones con diferentes tipos de habilidades
- 10 problemas totales
- Test cases configurados para cada problema

### Datos de Prueba

**Lógica y Pensamiento Crítico** (easy)
- Secuencia Numérica: 2, 4, 8, 16, ? → 32
- Análisis de Patrones: A, B, D, G, ? → K
- Operaciones Matemáticas: 2x + 5 = 13 → x = 4

**Programación en JavaScript** (medium)
- Invertir Array: [1,2,3] → [3,2,1]
- Filtrar Pares: [1,2,3,4,5,6] → [2,4,6]
- Encontrar Duplicados: [1,2,3,2,4] → 2

**Resolución de Problemas - Nivel Avanzado** (hard)
- Problema de Optimización: Ordenar tareas por prioridad
- Algoritmo de Caché: Implementar LRU Cache

**Manejo de Datos y Estructuras** (medium)
- Búsqueda Binaria: Encontrar elemento en array ordenado
- Árbol Binario: Buscar en BST

## Base de Datos

### Tablas

#### skills_assessments
- `id` (PK)
- `title` VARCHAR(255)
- `description` TEXT
- `skill_type` VARCHAR(50)
- `difficulty` VARCHAR(20): easy, medium, hard
- `estimated_time_minutes` INT
- `total_points` INT (default: 100)
- `passing_score` INT (default: 60)
- `created_at` TIMESTAMP

#### skills_problems
- `id` (PK)
- `assessment_id` (FK)
- `problem_number` INT
- `title` VARCHAR(255)
- `description` TEXT
- `problem_type` VARCHAR(50)
- `language` VARCHAR(50)
- `starter_code` TEXT
- `expected_output` TEXT
- `test_cases` JSONB: [{input: "", expectedOutput: "32"}]
- `points` INT (default: 10)
- `difficulty` VARCHAR(20)

#### skills_submissions
- `id` (PK)
- `candidate_id` (FK)
- `assessment_id` (FK)
- `problem_id` (FK)
- `code_submitted` TEXT
- `output` TEXT
- `is_correct` BOOLEAN
- `points_earned` INT
- `feedback` TEXT
- `submitted_at` TIMESTAMP

#### skills_results
- `id` (PK)
- `candidate_id` (FK)
- `candidate_vacancy_id` (FK, nullable)
- `assessment_id` (FK)
- `total_points` INT
- `points_earned` INT
- `score` DECIMAL(5,2)
- `problems_solved` INT
- `total_problems` INT
- `passed` BOOLEAN
- `time_taken_seconds` INT
- `started_at` TIMESTAMP
- `completed_at` TIMESTAMP

## Auditoría

Todas las acciones de Skills Assessment se registran en audit_logs con:
- `action`: SKILL_SOLUTION_SUBMITTED, SKILL_ASSESSMENT_COMPLETED
- `entityType`: SKILL_SUBMISSION, SKILL_RESULT
- `entityId`: ID de la sumisión o resultado
- `changes`: Cambios de valores antiguos a nuevos
- `ip`: IP del cliente
- `userAgent`: User agent del navegador
- `status`: SUCCESS o ERROR

## Casos de Uso

### Candidato Toma una Evaluación
1. Accede a `/skills-assessments`
2. Selecciona una evaluación
3. Comienza a resolver problemas
4. Ingresa código y output para cada problema
5. Envía la solución para validación
6. Navega entre problemas
7. Completa la evaluación
8. Ve resultados y puntuación final

### Reclutador Revisa Resultados
1. Accede a `/skills/results/candidate/:candidateId`
2. Ve historial de evaluaciones del candidato
3. Accede a `/skills/report/candidate/:candidateId`
4. Obtiene reporte agregado por tipo de habilidad
5. Identifica fortalezas y debilidades técnicas

## Validación de Output

### Normalización
- Conversión a minúsculas
- Eliminación de espacios múltiples
- Comparación de salida normalizada

### Ejemplo
```
Expected: "32"
User Output: "   32   "
Normalized User: "32"
Result: CORRECT ✓
```

## Próximas Mejoras

- [ ] Sandbox de ejecución de código para JavaScript
- [ ] Integración con CI/CD para testing automático
- [ ] Soporte para múltiples lenguajes de programación
- [ ] Análisis de complejidad de algoritmos
- [ ] Comentarios y feedback detallado por problema
- [ ] Comparación de soluciones entre candidatos
- [ ] Sistema de dificultad adaptativa
