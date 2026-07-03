# Talent IA - Guía de Instalación

## Requisitos Previos
- Node.js v18+ instalado
- PostgreSQL corriendo
- npm o yarn

## Backend Setup

```bash
cd backend
npm install
npm start
```

El servidor correrá en `http://localhost:3000`

### Variables de entorno (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_NAME=talent_ia
PORT=3000
JWT_SECRET=tu_llave_secreta
```

## Frontend Setup

```bash
cd frontend
npm install
npm start
```

La aplicación abrirá en `http://localhost:3000` (React)

### Credenciales de Prueba
**Admin:**
- Email: admin@talent-ia.com
- Password: Admin123!

**RR.HH:**
- Email: rrhh@talent-ia.com
- Password: RrHh123!

## Estructura del Proyecto

### Backend
```
backend/
├── src/
│   ├── config/          # Configuración de BD
│   ├── controllers/     # Lógica de negocio
│   ├── routes/          # Definición de APIs
│   └── app.js
├── server.js            # Servidor principal
└── .env
```

### Frontend
```
frontend/
├── src/
│   ├── components/      # Componentes reutilizables
│   ├── pages/           # Páginas principales
│   ├── api/             # Cliente API
│   ├── App.js           # Componente raíz
│   └── index.css        # Estilos globales
├── public/
└── package.json
```

## Flujo de Uso

1. **Login** con credenciales de RR.HH
2. **Dashboard** - Ver resumen del sistema
3. **Candidatos** - Registrar nuevos postulantes
4. **Evaluaciones** - Ver vacantes y asignar pruebas
5. **Candidato** - Accede con link único para hacer evaluación
6. **Resultados** - Automáticamente calcula recomendaciones

## APIs Disponibles

### Auth
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión

### Candidatos
- `POST /api/candidates` - Registrar candidato
- `GET /api/candidates` - Listar todos
- `GET /api/candidates/:id` - Detalle
- `POST /api/candidates/invite` - Invitar a vacante

### Vacantes
- `POST /api/vacancies` - Crear vacante
- `GET /api/vacancies` - Listar todas
- `POST /api/vacancies/:id/exams` - Asignar exámenes

### Evaluaciones
- `POST /api/evaluations/start` - Iniciar evaluación
- `POST /api/evaluations/answer` - Responder pregunta
- `POST /api/evaluations/:id/submit` - Finalizar
- `GET /api/evaluations/:id/results` - Ver resultados

### Preguntas & Exámenes
- `POST /api/questions` - Crear pregunta
- `POST /api/exams` - Crear examen
- `GET /api/exams/:id` - Detalle con preguntas

## Características Implementadas

✅ Autenticación JWT
✅ Gestión de candidatos
✅ Constructor de pruebas
✅ Motor de scoring automático
✅ Recomendaciones por operación
✅ Dashboard
✅ Interfaz responsive con Tailwind
✅ Página de evaluación interactiva para candidatos (EvaluationTest.jsx)
✅ Generación de reportes PDF (pdfkit service)
✅ Integración de upload de CV (multer middleware)
✅ Sistema de notificaciones por email (nodemailer)
✅ Panel de Admin para crear preguntas y exámenes
✅ Descarga de PDFs desde modal de resultados

## Nuevos Endpoints (Opción 1 - Completadas)

### PDF Generation
- `GET /api/evaluations/:candidateVacancyId/pdf` - Genera PDF de resultados
- `GET /pdfs/:filename` - Sirve archivos PDF

### File Upload
- `POST /api/candidates` (con multipart/form-data) - Soporta upload de CV
- `GET /uploads/:filename` - Sirve archivos subidos

### Admin Panel
- `GET /admin` - Interfaz web (protegida por rol)

## Próximos Pasos Opcionales

- [ ] Agregar preguntas a exámenes dinámicamente
- [ ] Envío real de emails (configurar SMTP)
- [ ] Edición de preguntas/exámenes existentes
- [ ] Previsualización de PDF antes de descargar
- [ ] Bulk upload de preguntas desde CSV
- [ ] Gestión dinámica de competencias
- [ ] Filtros avanzados en listados
- [ ] Modo oscuro
- [ ] Reportes analíticos
