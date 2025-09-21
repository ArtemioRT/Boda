const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  host: 'dpg-d37c2a3e5dus73983tdg-a.virginia-postgres.render.com',
  port: 5432,
  database: 'boda_elva',
  user: 'boda_elva_user',
  password: '5ZWx9YFzLJr8gHemY4AYM1MlyXMtuyWH',
  ssl: {
    rejectUnauthorized: false
  }
});

// Función para inicializar la base de datos
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Crear tabla para almacenar las fotos
    await client.query(`
        CREATE TABLE IF NOT EXISTS wedding_photos (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255),
        mimetype VARCHAR(100),
        size INTEGER,
        filter_used VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        photo_data BYTEA
      )
    `);
    
    await client.query(`ALTER TABLE wedding_photos ADD COLUMN IF NOT EXISTS notes TEXT`);
    console.log('✅ Tabla wedding_photos creada exitosamente');
  } catch (error) {
    console.error('❌ Error al crear la tabla:', error);
  } finally {
    client.release();
  }
}

// Función para guardar una foto
async function savePhoto(photoData) {
  const client = await pool.connect();
  try {
    const query = `
      INSERT INTO wedding_photos (filename, original_name, mimetype, size, filter_used, notes, photo_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at
    `;
    
    const values = [
      photoData.filename,
      photoData.originalName,
      photoData.mimetype,
      photoData.size,
      photoData.filterUsed,
      photoData.notes,
      photoData.buffer
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error al guardar la foto:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Función para obtener todas las fotos
    async function getAllPhotos() {
      const client = await pool.connect();
      try {
        const query = `
      SELECT id, filename, original_name, mimetype, size, filter_used, notes, created_at
      FROM wedding_photos
      ORDER BY created_at DESC
    `;
    
        const result = await client.query(query);
        return result.rows;
      } catch (error) {
        console.error('❌ Error al obtener las fotos:', error);
        throw error;
      } finally {
        client.release();
      }
    }

// Función para obtener una foto por ID
async function getPhotoById(id) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT * FROM wedding_photos WHERE id = $1
    `;
    
    const result = await client.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error al obtener la foto:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initializeDatabase,
  savePhoto,
  getAllPhotos,
  getPhotoById
};
