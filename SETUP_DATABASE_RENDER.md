# Setup Base de Datos en Render

La base de datos en Render no tiene las tablas creadas. Necesitas ejecutar el script de inicialización.

## Opción 1: Usar Render Console (Recomendado)

1. Ve a [https://dashboard.render.com](https://dashboard.render.com)
2. Selecciona tu PostgreSQL database
3. Haz click en "Connect" 
4. Copia la connection string completa
5. Abre tu terminal y conecta con psql:
   ```bash
   psql "postgresql://username:password@host:port/database"
   ```

6. Copia y pega el contenido del archivo `backend/scripts/initComplete.sql` en psql
7. Presiona Enter para ejecutar

## Opción 2: Usar PgAdmin (Si tienes acceso)

1. Conecta a tu base de datos usando PgAdmin
2. Abre la consola SQL
3. Pega el contenido de `backend/scripts/initComplete.sql`
4. Ejecuta

## Opción 3: Usando el Render Dashboard SQL Editor

1. Ve al dashboard de Render
2. Selecciona tu PostgreSQL database
3. Busca "PostgreSQL Console" o "Data Studio"
4. Pega el script y ejecuta

## Contenido del Script

El archivo `initComplete.sql` contiene:
- ✅ Tabla `users` (usuarios)
- ✅ Tabla `candidates` (candidatos)
- ✅ Tabla `vacancies` (vacantes) con `assigned_to_user_id`
- ✅ Tabla `exams` (pruebas)
- ✅ Tabla `questions` (preguntas)
- ✅ Tabla `candidate_vacancies` con `assigned_by_user_id`
- ✅ Tabla `evaluations` con `assigned_by_user_id`
- ✅ Tabla `typing_results` (resultados de pruebas de tipeo)
- ✅ Tabla `spelling_grammar_results` (resultados de ortografía)
- ✅ Tabla `skills_assessment_results` (resultados de pruebas técnicas)
- ✅ Todos los índices para performance
- ✅ Usuario admin por defecto

## Verificación

Después de ejecutar el script, verifica que las tablas se crearon:

```sql
\dt
```

Deberías ver algo como:
```
               List of relations
 Schema |          Name           | Type  |  Owner
--------+-------------------------+-------+---------
 public | users                   | table | postgres
 public | candidates              | table | postgres
 public | vacancies               | table | postgres
 public | evaluations             | table | postgres
 ...
```

## Si Ya Tiene Datos

Si tu base de datos ya tiene datos y no quieres perderlos, copia solo las columnas faltantes del script `backend/src/migrations/009_add_analyst_isolation.sql`

## Después de Ejecutar

Una vez ejecutado el script:
1. El backend reconocerá automáticamente las tablas
2. Las migraciones se ejecutarán sin errores
3. Podrás crear vacantes, candidatos, etc.
