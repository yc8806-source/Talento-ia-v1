# 🚀 QUICK START - URLs de Prueba

## 🔐 Login (Admin / RRHH)

### Admin
```
URL: http://localhost:3001/login
Email: admin@test.com
Password: Admin123!
```

### RRHH
```
URL: http://localhost:3001/login
Email: rrhh@test.com
Password: Rrhh123!
```

---

## 👤 URLs de Candidatos (Postulantes)

### Combo 1: Ana García - Soft Skills + Servicio al Cliente
```
http://localhost:3001/skills-assessment?token=76f03cb2fc6042d3036440160934da3824eed02a3963fc5bb5ef50cd3b7fa563
```

### Combo 2: Carlos López - Soft Skills + Televentas
```
http://localhost:3001/skills-assessment?token=91f42fc6d21dfb9ced4a984073fc6510f83de0c80689f70c8734bd3ff9cc2ef6
```

### Combo 3: Diana Martínez - Soft Skills + E-care
```
http://localhost:3001/skills-assessment?token=8865aef21c119db7fa752be8c6c7afdb4540d4c2b2402fa697af5e9bcf6284f3
```

---

## 📊 Flujo de Prueba Recomendado

### Paso 1: Prueba como Admin
1. Login: admin@test.com / Admin123!
2. Ve a Dashboard
3. Observa opciones disponibles
4. Nota: puedes crear nuevas asignaciones

### Paso 2: Prueba como Candidato (Ana García)
1. Copia URL de Combo 1 arriba
2. Pega en navegador (en pestaña privada/incógnita)
3. Verás "Soft Skills (1 de 2)"
4. Completa evaluación 1 (30 preguntas)
5. Sistema avanza automáticamente
6. Completa evaluación 2 (33 preguntas)
7. Verás mensaje de completitud

### Paso 3: Prueba como RRHH
1. Login: rrhh@test.com / Rrhh123!
2. Ve a Dashboard
3. Revisa candidatos evaluados
4. Ve resultados de Ana García

### Paso 4: Prueba otros combos
- Combo 2: Carlos López (Televentas)
- Combo 3: Diana Martínez (E-care)

---

## ✨ Características Clave a Verificar

### Seguridad
- [ ] Candidato NO ve puntuaciones (solo "Evaluación Completada")
- [ ] Candidato NO puede ver otras evaluaciones
- [ ] Admin/RRHH acceso requiere login

### Funcionalidad COMBO
- [ ] Primera evaluación se completa
- [ ] Sistema avanza automáticamente
- [ ] Segunda evaluación se inicia
- [ ] Ambas se marcan como completadas

### Data Integrity
- [ ] Respuestas se guardan correctamente
- [ ] Timestamps se registran
- [ ] Índice de progreso avanza

---

## 🐛 Debugging Tips

### Si no funciona login:
```bash
# Verifica que el backend esté corriendo
curl http://localhost:3000/api/health
```

### Si no carga la evaluación:
- Verifica que el token esté correcto (sin espacios)
- Abre consola (F12) y revisa errores
- Busca "Error cargando evaluación"

### Si no se guardan respuestas:
- Verifica en Network tab que las requests se envíen
- Revisa status code de responses (200 = OK, 4xx = error)

---

## 📝 Después de Pruebas

Cuando termines de probar:

1. **Documenta hallazgos**
   - Qué funcionó bien
   - Qué necesita mejoras
   - Bugs encontrados

2. **Crea lista de mejoras**
   - Prioridad alta
   - Prioridad media
   - Prioridad baja

3. **Prepara producción**
   - Revisa .env variables
   - Backup de BD
   - Check de logs

---

**Versión:** 1.0 Beta
**Fecha:** 3 de Julio 2026
