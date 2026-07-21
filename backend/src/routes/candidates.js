const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');
const { verifyToken } = require('../middleware/authMiddleware');

// RUTAS ESPECÍFICAS PRIMERO (más específicas antes de genéricas)

// PUBLIC ROUTES - Sin autenticación requerida
// Registrar nuevo candidato con CV opcional
router.post('/', upload.single('cv'), handleUploadError, candidateController.registerCandidate);

// Obtener tokens de un candidato (para recuperar URLs) - público para recuperación
router.get('/:candidateId/tokens', candidateController.getCandidateTokens);

// PROTECTED ROUTES - Requieren autenticación
router.use(verifyToken);

// Importar candidatos desde CSV
router.post('/import-csv', upload.single('file'), handleUploadError, candidateController.importCSV);

// Invitar candidato a vacante
router.post('/invite', candidateController.inviteToVacancy);

// Marcar candidato como apto/rechazado
router.post('/mark-status', candidateController.markCandidateStatus);

// Asignar vacante a candidato
router.post('/assign-vacancy', candidateController.assignVacancy);

// Obtener candidatos de una vacante
router.get('/vacancy/:vacancyId', candidateController.getCandidatesByVacancy);

// Obtener todos los candidatos
router.get('/', candidateController.getCandidates);

// Obtener historial de auditoría de un candidato (protegido)
router.get('/:id/audit-history', verifyToken, candidateController.getCandidateAuditHistory);

// Obtener un candidato por ID
router.get('/:id', candidateController.getCandidateById);

// Actualizar perfil de candidato (con opción de subir CV) - REQUIERE AUTENTICACIÓN
router.put('/:id', verifyToken, upload.single('cv'), handleUploadError, candidateController.updateCandidateProfile);

module.exports = router;
