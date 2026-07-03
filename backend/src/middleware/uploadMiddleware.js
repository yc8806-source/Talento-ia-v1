const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar almacenamiento
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  // Aceptar solo PDFs y documentos
  const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const allowedExts = ['.pdf', '.doc', '.docx'];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se aceptan archivos PDF o Word'), false);
  }
};

// Crear instancia de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB máximo
  },
});

// Middleware para manejar errores de upload
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'El archivo es demasiado grande. Máximo 10 MB.',
      });
    }
    return res.status(400).json({
      error: 'Error al cargar el archivo: ' + err.message,
    });
  } else if (err) {
    return res.status(400).json({
      error: err.message,
    });
  }
  next();
};

module.exports = {
  upload,
  handleUploadError,
};
