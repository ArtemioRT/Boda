# 📸 Photobooth de Boda - Elva & Samuel

Un sitio web de photobooth interactivo para capturar momentos especiales en la boda de Elva & Samuel. Las fotos se toman con la cámara web, se aplican filtros transparentes y se almacenan automáticamente en PostgreSQL.

## ✨ Características

- 📷 **Captura de fotos** con cámara web
- 🖼️ **Filtros transparentes** aplicables en tiempo real
- 💾 **Almacenamiento automático** en PostgreSQL
- 🖥️ **Galería integrada** para ver todas las fotos
- 📱 **Diseño responsive** optimizado para móviles
- 💕 **Temática de boda** con colores y tipografías elegantes
- ⚡ **Interfaz intuitiva** con navegación por pestañas

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js + Express.js
- **Base de datos**: PostgreSQL
- **Procesamiento de imágenes**: Sharp
- **APIs**: MediaDevices (Cámara), Canvas API

## 🚀 Instalación

### Prerrequisitos

- Node.js (versión 16 o superior)
- npm o yarn
- Acceso a PostgreSQL (ya configurado con las credenciales proporcionadas)

### Pasos de instalación

1. **Clonar o descomprimir el proyecto**
   ```bash
   cd wedding-photobooth
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Verificar configuración de base de datos**
   El archivo `database.js` ya está configurado con las credenciales de PostgreSQL:
   - Host: `dpg-d37c2a3e5dus73983tdg-a.virginia-postgres.render.com`
   - Database: `boda_elva`
   - Usuario: `boda_elva_user`

4. **Agregar filtros (opcional)**
   Coloca archivos PNG transparentes en la carpeta `filters/` con los nombres:
   - `frame1.png`
   - `frame2.png`

5. **Iniciar el servidor**
   ```bash
   npm start
   ```
   
   Para desarrollo con recarga automática:
   ```bash
   npm run dev
   ```

6. **Acceder al sitio**
   Abrir en el navegador: `http://localhost:3000`

## 📁 Estructura del Proyecto

```
wedding-photobooth/
├── public/                 # Archivos estáticos
│   ├── css/
│   │   └── styles.css     # Estilos principales
│   ├── js/
│   │   ├── app.js         # JavaScript principal
│   │   ├── camera.js      # Controlador de cámara
│   │   └── gallery.js     # Controlador de galería
│   └── index.html         # Página principal
├── filters/               # Filtros PNG transparentes
│   ├── frame1.png
│   └── frame2.png
├── uploads/               # Archivos temporales (no usado actualmente)
├── server.js             # Servidor Express
├── database.js           # Configuración y funciones de DB
├── package.json          # Dependencias y scripts
└── README.md            # Este archivo
```

## 🎯 Uso

### Para los invitados:

1. **Acceder al sitio** desde cualquier dispositivo con cámara
2. **Permitir acceso** a la cámara cuando se solicite
3. **Seleccionar filtro** (opcional)
4. **Tomar foto** haciendo clic en el botón o presionando Espacio
5. **Decidir** si guardar o tomar otra foto
6. **Ver galería** para explorar todas las fotos tomadas

### Controles de teclado:
- `Espacio`: Tomar foto
- `Escape`: Cerrar modal

## 🗄️ Base de Datos

La aplicación crea automáticamente la tabla `wedding_photos` con la siguiente estructura:

```sql
CREATE TABLE wedding_photos (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  mimetype VARCHAR(100),
  size INTEGER,
  filter_used VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  photo_data BYTEA
);
```

### Conectarse directamente a la base de datos:
```bash
PGPASSWORD=5ZWx9YFzLJr8gHemY4AYM1MlyXMtuyWH psql -h dpg-d37c2a3e5dus73983tdg-a.virginia-postgres.render.com -U boda_elva_user boda_elva
```

## 🎨 Personalización

### Colores de la temática:
- **Primario**: `#c49b90` (Rosa empolvado)
- **Secundario**: `#f4e8e1` (Beige claro)
- **Acento**: `#8b4b5a` (Granate)
- **Dorado**: `#d4af37` (Oro)

### Agregar nuevos filtros:
1. Crear archivo PNG transparente
2. Guardarlo en la carpeta `filters/` con un nombre descriptivo
3. Agregar botón en el HTML con `data-filter="nombre-archivo"`
4. Actualizar la función `getFilterDisplayName()` en `gallery.js`

### Modificar textos:
- Editar `public/index.html` para cambiar nombres o mensajes
- Modificar `public/js/app.js` para actualizar notificaciones

## 📱 Compatibilidad

- ✅ Chrome/Chromium 60+
- ✅ Firefox 55+
- ✅ Safari 11+ (iOS/macOS)
- ✅ Edge 79+
- ✅ Dispositivos móviles Android/iOS

## 🔧 API Endpoints

- `GET /` - Página principal
- `POST /api/upload-base64` - Subir foto en base64
- `POST /api/upload-photo` - Subir foto como archivo
- `GET /api/photos` - Obtener lista de fotos
- `GET /api/photo/:id` - Obtener foto específica

## 🐛 Solución de Problemas

### La cámara no funciona:
- Verificar permisos del navegador
- Usar HTTPS en producción
- Comprobar que el dispositivo tenga cámara

### Error de conexión a base de datos:
- Verificar conectividad a internet
- Comprobar credenciales en `database.js`
- Revisar logs del servidor

### Filtros no aparecen:
- Verificar que los archivos PNG estén en `filters/`
- Comprobar nombres de archivos
- Revisar consola del navegador

## 🚀 Despliegue en Producción

### Variables de entorno recomendadas:
```env
NODE_ENV=production
PORT=3000
```

### Consideraciones de seguridad:
- Usar HTTPS obligatorio para acceso a cámara
- Configurar CORS apropiadamente
- Implementar límites de tasa de requests
- Validar y sanitizar uploads

## 💝 Para los Novios

¡Esperamos que disfruten de su día especial y que este photobooth capture momentos únicos e inolvidables de su boda! 

💕 Con cariño para Elva & Samuel 💕

---

**Desarrollado con amor para una pareja especial** ❤️

## 📄 Licencia

Este proyecto fue creado específicamente para la boda de Elva & Samuel.

---

### 🆘 Soporte

Si tienes problemas durante el evento:
1. Verificar conexión a internet
2. Recargar la página (F5)
3. Probar con otro navegador/dispositivo
4. Revisar permisos de cámara

¡Que disfruten la celebración! 🎉
