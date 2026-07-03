# Sistema COMBO de Evaluaciones - Talent IA

## Evaluaciones Disponibles

### 1. **Competencias Blandas** (Exam ID: 7)
- **Tipo**: Likert Scale (1-5)
- **Duración**: 15 minutos
- **Score Mínimo**: 60%
- **Preguntas**: 30
- **Competencias** (10):
  1. Comunicación
  2. Liderazgo
  3. Trabajo en Equipo
  4. Resolución de Problemas
  5. Adaptabilidad
  6. Empatía
  7. Gestión del Tiempo
  8. Proactividad
  9. Integridad
  10. Creatividad

### 2. **Televentas** (Exam ID: 9)
- **Tipo**: Likert Scale (1-5)
- **Duración**: 20 minutos
- **Score Mínimo**: 65%
- **Preguntas**: 30
- **Competencias** (10):
  1. Manejo de Objeciones
  2. Persuasión y Negociación
  3. Escucha Activa
  4. Comunicación Clara
  5. Empatía y Rapport
  6. Cierre de Ventas
  7. Gestión del Rechazo
  8. Orientación a Resultados
  9. Control Emocional
  10. Seguimiento y Follow-up

### 3. **Cobranzas Telefónicas** (Exam ID: 10)
- **Tipo**: Likert Scale (1-5)
- **Duración**: 22 minutos
- **Score Mínimo**: 70%
- **Preguntas**: 30
- **Competencias** (10):
  1. Persuasión Ética
  2. Manejo de Objeciones de Pago
  3. Empatía Estratégica
  4. Negociación de Planes de Pago
  5. Inteligencia Emocional
  6. Comunicación Clara y Directa
  7. Persistencia sin Agresión
  8. Documentación y Seguimiento
  9. Orientación a Resultados
  10. Gestión del Estrés y Resiliencia

### 4. **Servicio al Cliente** (Exam ID: 11)
- **Tipo**: Likert Scale (1-5)
- **Duración**: 18 minutos
- **Score Mínimo**: 65%
- **Preguntas**: 30
- **Competencias** (10):
  1. Empatía y Comprensión
  2. Paciencia en Atención al Cliente
  3. Comunicación Clara
  4. Resolución Eficiente de Problemas
  5. Manejo de Quejas
  6. Profesionalismo
  7. Escucha Activa
  8. Conocimiento de Producto
  9. Gestión de Carga de Trabajo
  10. Actitud Positiva

### 5. **E-care (Atención Digital)** (Exam ID: 12)
- **Tipo**: Likert Scale (1-5)
- **Duración**: 20 minutos
- **Score Mínimo**: 68%
- **Preguntas**: 30
- **Competencias** (10):
  1. Escritura Clara y Profesional
  2. Empatía Digital
  3. Velocidad de Respuesta
  4. Multitarea Digital
  5. Manejo de Cliente Enojado (Texto)
  6. Conocimiento Técnico Digital
  7. Documentación y Registro
  8. Organización y Priorización
  9. Resolución Rápida
  10. Adaptabilidad a Canales

---

## Sistema COMBO - Ejemplos de Combinaciones

Puedes asignar múltiples evaluaciones a un candidato en una sola sesión con un único token. El sistema avanza secuencialmente.

### Ejemplos Recomendados:

#### 🎯 Posición: Asesor de Televentas Junior
```
Evaluaciones asignadas: [7, 9]
- Primero: Competencias Blandas (15 min)
- Luego: Televentas (20 min)
- Total: 35 minutos
```

#### 🎯 Posición: Asesor de Cobranzas
```
Evaluaciones asignadas: [7, 10]
- Primero: Competencias Blandas (15 min)
- Luego: Cobranzas (22 min)
- Total: 37 minutos
```

#### 🎯 Posición: Especialista de Servicio al Cliente
```
Evaluaciones asignadas: [7, 11]
- Primero: Competencias Blandas (15 min)
- Luego: Servicio al Cliente (18 min)
- Total: 33 minutos
```

#### 🎯 Posición: Agente de E-care (Chat/Email/Redes)
```
Evaluaciones asignadas: [7, 12]
- Primero: Competencias Blandas (15 min)
- Luego: E-care (20 min)
- Total: 35 minutos
```

#### 🎯 Posición: Supervisor/Gerente de Ventas
```
Evaluaciones asignadas: [7, 9, 10]
- Primero: Competencias Blandas (15 min)
- Luego: Televentas (20 min)
- Finalmente: Cobranzas (22 min)
- Total: 57 minutos
```

#### 🎯 Posición: Líder de Centro de Contacto
```
Evaluaciones asignadas: [7, 11, 12]
- Primero: Competencias Blandas (15 min)
- Luego: Servicio al Cliente (18 min)
- Finalmente: E-care (20 min)
- Total: 53 minutos
```

---

## Características de Seguridad

✅ **Token-based Access**: Cada candidato recibe un token único e irrepetible
✅ **Sequential Access**: Las evaluaciones se presentan en orden, sin opción de seleccionar
✅ **Results Hidden**: Los candidatos NO ven sus puntuaciones hasta que el team RRHH lo autorice
✅ **Admin Only**: Solo Admin/RRHH pueden ver resultados detallados y asignar evaluaciones
✅ **Unique Tokens**: Basados en `crypto.randomBytes(32).toString('hex')` (256-bit)

---

## Workflow Completo

### 1. Admin Asigna Evaluaciones
```
Admin accede a AdminAssignEvaluations
→ Selecciona candidato (ej: Juan García)
→ Selecciona evaluaciones (ej: [7, 9])
→ Sistema genera token único (ej: a7f3b9c2...)
→ Admin comparte URL con candidato: /skills-assessment?token=a7f3b9c2...
```

### 2. Candidato Realiza Evaluaciones
```
Candidato recibe link con token
→ Accede a primera evaluación (Competencias Blandas)
→ Responde 30 preguntas Likert
→ Presiona "Completar Evaluación"
→ Sistema avanza a siguiente: Televentas
→ Responde otra serie de 30 preguntas
→ Presiona "Completar Evaluación"
→ Sistema muestra: "✓ Evaluaciones Completadas"
→ Mensaje: "El equipo de RRHH revisará tus respuestas"
```

### 3. Admin Revisa Resultados
```
Admin accede a AdminEvaluationResults
→ Busca candidato (Juan García)
→ Ve scores por competencia
→ Expande detalles de respuestas individuales
→ Genera reporte para tomar decisiones de contratación
```

---

## Próximas Mejoras Posibles

- [ ] Evaluaciones de Opción Múltiple adicionales
- [ ] Preguntas situacionales con análisis de comportamiento
- [ ] Reportes automáticos por competencia
- [ ] Alertas para resultados críticos (score muy bajo)
- [ ] Evaluaciones por rol automáticas basadas en metadata de vacante
- [ ] Benchmarking: comparar candidato vs promedios históricos
