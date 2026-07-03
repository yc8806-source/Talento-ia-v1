# 🧪 GUÍA DE PRUEBA - Talent IA v1.0

## 📋 Tabla de Contenidos
1. [Credenciales de Prueba](#credenciales)
2. [Vista Admin](#vista-admin)
3. [Vista RRHH](#vista-rrhh)
4. [Vista Postulante](#vista-postulante)
5. [Flujos Completos](#flujos-completos)

---

## <a name="credenciales">🔑 Credenciales de Prueba</a>

### Admin
```
Email: admin@test.com
Password: Admin123!
```

### RRHH
```
Email: rrhh@test.com
Password: Rrhh123!
```

### Postulante (Sin login)
- Acceso solo con TOKEN
- URL: `/skills-assessment?token=TOKEN_AQUI`

---

## <a name="vista-admin">👨‍💼 VISTA ADMIN</a>

### Acceso
1. Ve a http://localhost:3001/login
2. Ingresa: `admin@test.com` / `Admin123!`
3. Deberías ver el Dashboard con opciones Admin

### Funcionalidades a Probar

#### 1. Crear Nueva Asignación
- [ ] Ir a sección de asignaciones
- [ ] Seleccionar candidato
- [ ] Seleccionar evaluaciones (ej: Soft Skills + Servicio al Cliente)
- [ ] Generar token
- [ ] Copiar URL para candidato

#### 2. Ver Resultados
- [ ] Ir a `/admin/resultados`
- [ ] Buscar candidato
- [ ] Revisar evaluaciones completadas
- [ ] Ver puntuaciones por competencia

#### 3. Gestionar Usuarios
- [ ] Crear nuevo usuario RRHH
- [ ] Asignar permisos
- [ ] Ver historial de actividad

---

## <a name="vista-rrhh">👥 VISTA RRHH</a>

### Acceso
1. Ve a http://localhost:3001/login
2. Ingresa: `rrhh@test.com` / `Rrhh123!`
3. Deberías ver Dashboard con opciones RRHH

### Funcionalidades a Probar

#### 1. Dashboard RRHH
- [ ] Ver candidatos asignados
- [ ] Ver evaluaciones en progreso
- [ ] Ver evaluaciones completadas

#### 2. Revisar Resultados
- [ ] Acceder a resultados de candidatos
- [ ] Interpretar puntuaciones
- [ ] Comparar competencias

#### 3. Generar Reportes
- [ ] Reporte por competencia
- [ ] Reporte por candidato
- [ ] Exportar datos

---

## <a name="vista-postulante">👤 VISTA POSTULANTE</a>

### Flujo Completo de Evaluación

#### Paso 1: Obtener Token
1. Como ADMIN, crea una asignación
2. Copia el TOKEN generado

#### Paso 2: Acceder como Candidato
1. Ve a: `http://localhost:3001/skills-assessment?token=TOKEN`
2. Verás las evaluaciones asignadas

#### Paso 3: Realizar Evaluaciones
- [ ] Ver lista de evaluaciones asignadas
- [ ] Iniciar primera evaluación
- [ ] Responder preguntas Likert 1-5
- [ ] Navegar con botones Anterior/Siguiente
- [ ] Completar evaluación
- [ ] Sistema avanza automáticamente a siguiente

#### Paso 4: Verificar Seguridad
- [ ] NO ve puntuaciones (solo "Evaluación Completada")
- [ ] NO ve otras evaluaciones
- [ ] NO puede ir atrás en evaluaciones completadas

---

## <a name="flujos-completos">🎯 FLUJOS COMPLETOS A PROBAR</a>

### Flujo A: Admin Completo
```
1. Login como ADMIN (admin@test.com)
2. Crear asignación: [Soft Skills + Servicio al Cliente]
3. Copiar token
4. (Simular como candidato - ver Flujo B)
5. Volver a Admin
6. Ver resultados en /admin/resultados
7. Revisar puntuaciones por competencia
```

### Flujo B: Candidato Completo
```
1. Recibir URL con token: /skills-assessment?token=ABC123
2. Acceder a URL
3. Ver: "Evaluación 1 de 2"
4. Hacer click en "Comenzar Evaluación"
5. Responder 30 preguntas de Soft Skills
6. Completar evaluación
7. Ver mensaje: "✓ Evaluación Completada"
8. Sistema avanza a evaluación 2
9. Responder 33 preguntas de Servicio al Cliente
10. Completar segunda evaluación
11. Todas las evaluaciones completadas ✅
```

### Flujo C: RRHH Revisa Resultados
```
1. Login como RRHH (rrhh@test.com)
2. Ir a Dashboard
3. Ver candidatos completados
4. Revisar detalle de resultados
5. Ver puntuaciones por competencia
6. Generar reporte
7. Exportar datos (si aplica)
```

---

## 📊 COMBINACIONES DE EVALUACIONES PARA PROBAR

### Combo 1: Básico
```
[Soft Skills] = 30 preguntas, 15 minutos
Total: 15 minutos
```

### Combo 2: Asesor de Ventas
```
[Soft Skills] = 30 preguntas, 15 minutos
[Televentas] = 30 preguntas, 20 minutos
Total: 35 minutos
```

### Combo 3: Asesor de Cobranzas
```
[Soft Skills] = 30 preguntas, 15 minutos
[Cobranzas] = 30 preguntas, 22 minutos
Total: 37 minutos
```

### Combo 4: Especialista de Servicio
```
[Soft Skills] = 30 preguntas, 15 minutos
[Servicio al Cliente] = 33 preguntas, 18 minutos
Total: 33 minutos
```

### Combo 5: Agente E-care
```
[Soft Skills] = 30 preguntas, 15 minutos
[E-care] = 30 preguntas, 20 minutos
Total: 35 minutos
```

### Combo 6: Líder de Centro
```
[Soft Skills] = 30 preguntas, 15 minutos
[Servicio al Cliente] = 33 preguntas, 18 minutos
[E-care] = 30 preguntas, 20 minutos
Total: 53 minutos
```

---

## ✅ CHECKLIST DE PRUEBA

### Seguridad
- [ ] Candidato NO ve resultados (solo "Evaluación Completada")
- [ ] Candidato NO puede saltar evaluaciones
- [ ] Token es único e irrepetible
- [ ] Admin acceso protegido por JWT
- [ ] RRHH solo ve datos autorizados

### Funcionalidad
- [ ] COMBO system funciona (múltiples evaluaciones)
- [ ] Progress bar avanza correctamente
- [ ] Timer cuenta correctamente
- [ ] Navegación Anterior/Siguiente funciona
- [ ] Botón "Completar Evaluación" guarda respuestas
- [ ] Sistema avanza a siguiente evaluación automáticamente

### Base de Datos
- [ ] Asignación se crea correctamente
- [ ] Token se genera único
- [ ] Respuestas se guardan
- [ ] Estado de completitud se registra
- [ ] Índice de evaluación avanza

### UX/UI
- [ ] Interfaz responsiva
- [ ] Mensajes claros
- [ ] Transiciones suaves
- [ ] Colores y estilos consistentes
- [ ] Iconos informativos

---

## 🚀 PASOS PARA PONER EN PRODUCCIÓN

1. **Verificar**
   - [ ] Todos los tests pasan
   - [ ] No hay console errors
   - [ ] BD está bacupeada
   - [ ] Variables de entorno configuradas

2. **Deploy**
   - [ ] Build frontend
   - [ ] Deploy backend
   - [ ] Deploy frontend
   - [ ] Verificar URLs en producción

3. **Post-Deploy**
   - [ ] Probar flujo completo en prod
   - [ ] Verificar autenticación
   - [ ] Probar con datos reales
   - [ ] Monitorear logs

---

## 📝 NOTAS

- Los tokens expiran en 24 horas (pueden cambiar en .env)
- Las evaluaciones tienen duración máxima (pueden cancelarse por timeout)
- Los resultados se guardan automáticamente
- No hay límite de intentos por token (diseño actual)

---

**Última actualización:** 3 de Julio 2026
**Versión:** 1.0 Beta
