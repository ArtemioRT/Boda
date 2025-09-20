const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const sharp = require('sharp');
const { initializeDatabase, savePhoto, getAllPhotos, getPhotoById } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));
app.use('/filters', express.static(path.join(__dirname, 'filters')));

// Endpoint para listar filtros dinámicamente
app.get('/api/filters', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  fs.readdir(path.join(__dirname, 'filters'), (err, files) => {
    if (err) {
      console.error('Error al leer filtros:', err);
      return res.status(500).json({ error: 'No se pudo leer la carpeta de filtros' });
    }
    const pngs = files.filter(f => /\.(png|jpe?g|webp)$/i.test(f));
    const names = pngs.map(f => path.parse(f).name);
    res.json(names);
  });
});

// Configuración de multer para manejar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite
  }
});

// Inicializar base de datos al iniciar servidor
initializeDatabase().catch(console.error);

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint para subir fotos
    app.post('/api/upload-photo', upload.single('photo'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No se recibió ningún archivo' });
        }
  
        const { filterUsed, notes } = req.body;
    
    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const filename = `wedding_photo_${timestamp}.jpg`;

    // Procesar la imagen con Sharp para optimizar
    const processedBuffer = await sharp(req.file.buffer)
      .jpeg({ quality: 85 })
      .toBuffer();

        const photoData = {
          filename: filename,
          originalName: req.file.originalname || filename,
          mimetype: 'image/jpeg',
          size: processedBuffer.length,
          filterUsed: filterUsed || 'none',
          notes: notes || '',
          buffer: processedBuffer
        };

    const savedPhoto = await savePhoto(photoData);
    
    res.json({
      success: true,
      message: 'Foto guardada exitosamente',
      photoId: savedPhoto.id,
      filename: filename,
      createdAt: savedPhoto.created_at
    });

  } catch (error) {
    console.error('Error al subir foto:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// Endpoint para obtener todas las fotos (metadatos)
app.get('/api/photos', async (req, res) => {
  try {
    const photos = await getAllPhotos();
    res.json(photos);
  } catch (error) {
    console.error('Error al obtener fotos:', error);
    res.status(500).json({ error: 'Error al obtener fotos' });
  }
});

// Endpoint para obtener una foto específica
app.get('/api/photo/:id', async (req, res) => {
  try {
    const photo = await getPhotoById(req.params.id);
    
    if (!photo) {
      return res.status(404).json({ error: 'Foto no encontrada' });
    }

    res.set({
      'Content-Type': photo.mimetype,
      'Content-Length': photo.size,
      'Cache-Control': 'public, max-age=31536000'
    });
    
    res.send(photo.photo_data);
  } catch (error) {
    console.error('Error al obtener foto:', error);
    res.status(500).json({ error: 'Error al obtener la foto' });
  }
});

// Endpoint para subir foto desde base64
app.post('/api/upload-base64', async (req, res) => {
  try {
    const { imageData, filterUsed } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'No se recibió datos de imagen' });
    }

    // Convertir base64 a buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generar nombre único
    const timestamp = Date.now();
    const filename = `wedding_photo_${timestamp}.jpg`;

    // Procesar imagen
    const processedBuffer = await sharp(buffer)
      .jpeg({ quality: 85 })
      .toBuffer();

    const photoData = {
      filename: filename,
      originalName: filename,
      mimetype: 'image/jpeg',
      size: processedBuffer.length,
      filterUsed: filterUsed || 'none',
      buffer: processedBuffer
    };

    const savedPhoto = await savePhoto(photoData);
    
    res.json({
      success: true,
      message: 'Foto guardada exitosamente',
      photoId: savedPhoto.id,
      filename: filename,
      createdAt: savedPhoto.created_at
    });

  } catch (error) {
    console.error('Error al procesar imagen base64:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// Manejo de errores
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Archivo demasiado grande' });
    }
  }
  
  console.error('Error no manejado:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🎉 Servidor del photobooth de Elva & Samuel ejecutándose en puerto ${PORT}`);
  console.log(`📸 Visita: http://localhost:${PORT}`);
});
