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

// Obtener un candidato por ID (público)
router.get('/:id', candidateController.getCandidateById);

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

// Obtener todos los candidatos (protegido - solo analistas ven sus candidatos)
router.get('/', candidateController.getCandidates);

// Obtener candidatos de una vacante (protegido)
router.get('/vacancy/:vacancyId', candidateController.getCandidatesByVacancy);

// Obtener historial de auditoría de un candidato (protegido)
router.get('/:id/audit-history', candidateController.getCandidateAuditHistory);

// Actualizar perfil de candidato (con opción de subir CV) - REQUIERE AUTENTICACIÓN
router.put('/:id', upload.single('cv'), handleUploadError, candidateController.updateCandidateProfile);

module.exports = router;
