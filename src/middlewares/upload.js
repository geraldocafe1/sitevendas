const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Memory storage to process files in memory with Sharp
const storage = multer.memoryStorage();

// Real MIME type validation
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato inválido. Apenas imagens JPEG, PNG e WebP são permitidas.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: fileFilter
});

// Middleware to resize and compress images into webp & jpg
const processImages = async (req, res, next) => {
  // If no files were uploaded, skip
  if (!req.file && (!req.files || req.files.length === 0)) {
    return next();
  }

  const uploadDir = path.join(__dirname, '../../public/uploads');

  // Ensure uploads folder exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  try {
    const filesToProcess = req.file ? [req.file] : (Array.isArray(req.files) ? req.files : []);
    const processed = [];

    for (const file of filesToProcess) {
      const filename = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      
      const webpPath = path.join(uploadDir, `${filename}.webp`);
      const jpgPath = path.join(uploadDir, `${filename}.jpg`);

      // Initialize sharp with buffer
      const imageProcessor = sharp(file.buffer);

      // Resize to max 800x800 maintaining aspect ratio
      const resized = imageProcessor.resize({
        width: 800,
        height: 800,
        fit: sharp.fit.inside,
        withoutEnlargement: true
      });

      // Save WebP version
      await resized.clone().webp({ quality: 80 }).toFile(webpPath);
      // Save JPEG version for fallback
      await resized.clone().jpeg({ quality: 85 }).toFile(jpgPath);

      processed.push({
        webp: `/uploads/${filename}.webp`,
        jpg: `/uploads/${filename}.jpg`
      });
    }

    // Assign back to request for controllers to use
    if (req.file) {
      req.processedFile = processed[0];
    } else {
      req.processedFiles = processed;
    }

    next();
  } catch (error) {
    console.error('Image processing failed:', error);
    return res.status(500).json({ error: 'Falha ao processar imagens no servidor.' });
  }
};

module.exports = {
  upload,
  processImages
};
