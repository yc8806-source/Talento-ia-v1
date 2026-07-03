# 🎯 Talent IA - Platform de Reclutamiento

Una plataforma moderna, profesional e intuitiva para seleccionar talento especializado en Contact Centers.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Credenciales de Prueba](#credenciales-de-prueba)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Funcionalidades](#funcionalidades)
- [Arquitectura](#arquitectura)

---

## ✨ Características

✅ **Autenticación JWT** - Login seguro con tokens  
✅ **Gestión de Candidatos** - Registro y búsqueda de postulantes  
✅ **Constructor de Pruebas** - Crear evaluaciones personalizadas  
✅ **Motor de Scoring Automático** - Calcula afinidad por operación  
✅ **Evaluación Interactiva** - Interfaz moderna para candidatos  
✅ **Reportes de Resultados** - Visualización clara de competencias  
✅ **Recomendaciones Inteligentes** - Sugiere mejor operación para cada candidato  
✅ **Diseño Responsivo** - Compatible con mobile, tablet y desktop  

---

## 🔧 Requisitos

- **Node.js** v18+
- **PostgreSQL** 12+
- **npm** o **yarn**

---

## 📦 Instalación

### 1. Clonar o descargar el proyecto

```bash
cd "D:\Loboy\Proyectos\Talent IA"
```

### 2. Configurar Base de Datos

```bash
# PostgreSQL debe estar corriendo
# Ejecutar script de inicialización
cd backend
# El script ya se ejecutó durante la instalación
```

### 3. Instalar y ejecutar Backend

```bash
cd backend
npm install
npm start
```

El servidor correrá en `http://localhost:3000`

### 4. Instalar y ejecutar Frontend

En **otra terminal**:

```bash
cd frontend
npm install
npm start
```

La aplicación se abrirá en `http://localhost:3000` (React)

---

## 🔐 Credenciales de Prueba

### Admin
- **Email:** `admin@talent-ia.com`
- **Password:** `Admin123!`

### RR.HH.
- **Email:** `rrhh@talent-ia.com`
- **Password:** `RrHh123!`

---

## 📂 Estructura del Proyecto

```
Talent IA/
│
├── backend/
│   ├── src/
│   │   ├── config/database.js         # Conexión PostgreSQL
│   │   ├── controllers/               # Lógica de negocio
│   │   │   ├── authController.js
│   │   │   ├── candidateController.js
│   │   │   ├── vacancyController.js
│   │   │   ├── evaluationController.js
│   │   │   ├── questionController.js
│   │   │   └── examController.js
│   │   └── routes/                   # Definición de APIs
│   ├── server.js                      # Servidor principal
│   ├── .env                           # Variables de entorno
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/api.js                # Cliente Axios
│   │   ├── components/               # Componentes reutilizables
│   │   │   ├── Navbar.jsx
│   │   │   └── Layout.jsx
│   │   ├── pages/                    # Páginas principales
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Candidates.jsx
│   │   │   ├── Evaluations.jsx
│   │   │   └── EvaluationTest.jsx
│   │   ├── App.js                    # Router principal
│   │   └── index.css                 # Estilos globales
│   ├── public/
│   │   └── index.html
│   ├── .env                          # Variables de entorno
│   └── package.json
│
└── SETUP.md                          # Guía de configuración
```

---

## 🎯 Funcionalidades por Rol

### Admin
- ✅ Crear usuarios (Admin/RR.HH)
- ✅ Gestionar competencias
- ✅ Crear banco de preguntas
- ✅ Crear pruebas
- ✅ Configurar matriz de pesos
- ✅ Ver reportes globales

### RR.HH
- ✅ Crear vacantes
- ✅ Asignar pruebas a vacantes
- ✅ Registrar candidatos
- ✅ Invitar candidatos a evaluación
- ✅ Ver resultados de candidatos
- ✅ Descargar reportes PDF
- ✅ Cambiar estado de candidatos

### Postulante (Candidato)
- ✅ Registrarse
- ✅ Completar información
- ✅ Subir CV
- ✅ Responder evaluación
- ✅ Guardar progreso
- ✅ Finalizar evaluación

---

## 🔄 Flujo de Uso Típico

```
1. ADMIN crea:
   ├── Competencias
   ├── Banco de Preguntas
   ├── Pruebas
   └── Configura Matriz de Pesos

2. RR.HH. crea:
   ├── Vacante
   └── Asigna Pruebas a Vacante

3. RR.HH. registra:
   ├── Candidato
   └── Invita a Vacante

4. Candidato:
   ├── Accede con link único
   ├── Responde evaluación
   └── Sistema calcula automáticamente:
       ├── Puntajes por competencia
       ├── Afinidad por operación
       └── Recomendación principal

5. RR.HH. revisa:
   ├── Resultados de candidato
   ├── Recomendaciones
   └── Toma decisión de contratación
```

---

## 🏗️ Arquitectura

### Backend
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación
- **bcryptjs** - Encriptación de contraseñas
- **CORS** - Control de acceso cross-origin

### Frontend
- **React** - UI library
- **React Router** - Navegación
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Estilos
- **JavaScript ES6+** - Lenguaje

---

## 🔌 APIs Principales

### Autenticación
```
POST /api/auth/register      - Registrar usuario
POST /api/auth/login         - Iniciar sesión
```

### Candidatos
```
POST /api/candidates         - Registrar candidato
GET  /api/candidates         - Listar candidatos
GET  /api/candidates/:id     - Obtener candidato
POST /api/candidates/invite  - Invitar a vacante
```

### Vacantes
```
POST /api/vacancies          - Crear vacante
GET  /api/vacancies          - Listar vacantes
GET  /api/vacancies/:id      - Obtener vacante
POST /api/vacancies/:id/exams - Asignar exámenes
```

### Evaluaciones
```
POST /api/evaluations/start          - Iniciar evaluación
POST /api/evaluations/answer         - Responder pregunta
POST /api/evaluations/:id/submit     - Finalizar evaluación
GET  /api/evaluations/:id/results    - Obtener resultados
```

### Preguntas & Exámenes
```
POST /api/questions          - Crear pregunta
GET  /api/questions          - Listar preguntas
POST /api/exams              - Crear examen
GET  /api/exams/:id          - Obtener examen con preguntas
```

---

## 📊 Motor de Scoring

El diferenciador de Talent IA es su **motor de scoring inteligente**:

```
1. Candidato responde evaluación
   ↓
2. Sistema suma puntajes por competencia
   ↓
3. Aplica matriz de pesos por operación:
   - Televentas
   - Cobranzas
   - Inbound
   - eCare
   ↓
4. Calcula score ponderado para cada operación
   ↓
5. Ordena y recomienda mejor operación
   ↓
6. Genera reporte con resultados
```

**Ejemplo:**
```
Candidato: Juan Pérez
Comunicación: 85 pts
Persuasión: 72 pts
Empatía: 90 pts

Resultado:
- Televentas: 82 (RECOMENDADO)
- Cobranzas: 71
- Inbound: 64
- eCare: 52
```

---

## 🚀 Próximas Mejoras

- [ ] Generación automática de PDF
- [ ] Upload de CV y documentos
- [ ] Sistema de notificaciones por email
- [ ] Integración con calendario
- [ ] Dashboard analytics avanzado
- [ ] Modo oscuro
- [ ] Soporte multiidioma
- [ ] Integración con LinkedIn
- [ ] Análisis de video (futura versión)
- [ ] IA para análisis de competencias (futura versión)

---

## 📞 Soporte

Para reportar bugs o sugerencias, contacta al equipo de desarrollo.

---

## 📄 Licencia

Todos los derechos reservados © 2026 Talent IA

---

**¡Gracias por usar Talent IA!** 🚀
