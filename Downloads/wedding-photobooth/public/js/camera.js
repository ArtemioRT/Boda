class CameraController {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.filterOverlay = document.getElementById('filter-overlay');
        this.filterImage = document.getElementById('filter-image');
        this.noCamera = document.getElementById('no-camera');
        this.currentFilter = 'none';
        this.stream = null;
        this.capturedImageData = null;
        this.filterImageLoaded = false;
        
        console.log('🔍 Elementos encontrados:');
        console.log('Video:', this.video);
        console.log('Canvas:', this.canvas);
        console.log('Filter Overlay:', this.filterOverlay);
        console.log('Filter Image:', this.filterImage);
        
        this.init();
    }

    async init() {
        await this.setupCamera();
        this.setupEventListeners();
        this.setupFilterButtons();
        this.setupFilterOverlay();
    }

    async setupCamera() {
        try {
            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            await new Promise((resolve) => {
                this.video.onloadedmetadata = resolve;
            });

            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            
            // Configurar overlay cuando el video esté listo
            this.video.addEventListener('loadeddata', () => {
                console.log('📹 Video cargado, configurando overlay...');
                this.setupFilterOverlay();
                this.positionFilter();
            });
            
            this.video.addEventListener('playing', () => {
                console.log('▶️ Video reproduciendo...');
                this.positionFilter();
            });
            
            // Reposicionar en cambios de tamaño
            window.addEventListener('resize', () => {
                setTimeout(() => this.positionFilter(), 100);
            });
            
            console.log('✅ Cámara inicializada correctamente');

        } catch (error) {
            console.error('❌ Error al acceder a la cámara:', error);
            this.showNoCameraMessage();
        }
    }

    setupFilterOverlay() {
        console.log('🎭 Configurando overlay de filtros...');
        
        // Asegurar estructura HTML correcta
        const cameraWrapper = this.video.parentElement;
        if (cameraWrapper) {
            cameraWrapper.style.position = 'relative';
            cameraWrapper.style.display = 'inline-block';
            console.log('📦 Camera wrapper configurado');
        }
        
        // Configurar el overlay
        if (this.filterOverlay) {
            this.filterOverlay.style.cssText = `
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                pointer-events: none !important;
                z-index: 10 !important;
                display: none !important;
            `;
        }
        
        // Configurar la imagen del filtro
        if (this.filterImage) {
            this.filterImage.style.cssText = `
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                display: none !important;
                pointer-events: none !important;
                opacity: 1 !important;
                z-index: 11 !important;
            `;
        }
        
        console.log('✅ Overlay configurado');
    }

    showNoCameraMessage() {
        this.video.style.display = 'none';
        this.noCamera.style.display = 'flex';
        
        const takePhotoBtn = document.getElementById('take-photo');
        takePhotoBtn.disabled = true;
        takePhotoBtn.innerHTML = '<i class="fas fa-camera-slash"></i> Cámara no disponible';
    }

    setupEventListeners() {
        const takePhotoBtn = document.getElementById('take-photo');
        const savePhotoBtn = document.getElementById('save-photo');
        const retakePhotoBtn = document.getElementById('retake-photo');
        const closeModalBtn = document.getElementById('close-modal');

        takePhotoBtn.addEventListener('click', () => this.capturePhoto());
        savePhotoBtn.addEventListener('click', () => this.savePhoto());
        retakePhotoBtn.addEventListener('click', () => this.retakePhoto());
        closeModalBtn.addEventListener('click', () => this.closeModal());

        const modal = document.getElementById('photo-modal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isModalOpen()) {
                e.preventDefault();
                this.capturePhoto();
            }
            if (e.code === 'Escape' && this.isModalOpen()) {
                this.closeModal();
            }
        });
    }

    setupFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        console.log('🔘 Configurando botones de filtro:', filterButtons.length);
        
        filterButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter');
                console.log('🖱️ Filtro seleccionado:', filter);
                
                // Actualizar botones activos
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Aplicar filtro inmediatamente
                this.applyFilter(filter);
            });
        });
    }

    applyFilter(filter) {
        console.log('🎨 Aplicando filtro:', filter);
        this.currentFilter = filter;
        
        if (filter === 'none') {
            this.hideFilter();
        } else {
            this.loadAndShowFilter(filter);
        }
    }

    loadAndShowFilter(filter) {
        console.log('🔄 Cargando filtro:', filter);
        
        // Lista de posibles ubicaciones del filtro
        const possiblePaths = [
            `filters/${filter}.png`,
            `./filters/${filter}.png`,
            `images/filters/${filter}.png`,
            `assets/filters/${filter}.png`,
            `css/filters/${filter}.png`
        ];
        
        this.tryLoadFilterFromPaths(possiblePaths, 0, filter);
    }

    tryLoadFilterFromPaths(paths, index, filter) {
        if (index >= paths.length) {
            console.error('❌ No se encontró el filtro:', filter);
            this.createTemporaryFilter(filter);
            return;
        }

        const currentPath = paths[index];
        console.log(`🔄 Probando ruta: ${currentPath}`);
        
        const testImage = new Image();
        
        testImage.onload = () => {
            console.log('✅ Filtro cargado desde:', currentPath);
            
            // Asignar la imagen cargada
            this.filterImage.src = currentPath;
            this.filterImageLoaded = true;
            
            // Mostrar inmediatamente
            this.showFilterInRealTime();
        };
        
        testImage.onerror = () => {
            console.warn(`❌ Falló carga desde: ${currentPath}`);
            this.tryLoadFilterFromPaths(paths, index + 1, filter);
        };
        
        testImage.src = currentPath;
    }

    createTemporaryFilter(filter) {
        console.log('🎭 Creando filtro temporal para:', filter);
        
        // Crear un filtro visual temporal si no se encuentra la imagen
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        
        // Diferentes estilos según el filtro
        if (filter === 'frame1') {
            // Marco dorado
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 20;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
            
            // Marco interior
            ctx.strokeStyle = '#8b4b5a';
            ctx.lineWidth = 8;
            ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);
        } else if (filter === 'frame2') {
            // Corazones en las esquinas
            ctx.font = '48px Arial';
            ctx.fillStyle = '#ff69b4';
            ctx.fillText('♥', 20, 60);
            ctx.fillText('♥', canvas.width - 60, 60);
            ctx.fillText('♥', 20, canvas.height - 20);
            ctx.fillText('♥', canvas.width - 60, canvas.height - 20);
            
            // Texto decorativo
            ctx.font = '24px Dancing Script';
            ctx.fillStyle = '#c49b90';
            ctx.textAlign = 'center';
            ctx.fillText('Elva & Samuel', canvas.width / 2, 40);
        }
        
        // Convertir a data URL y usar como filtro
        this.filterImage.src = canvas.toDataURL();
        this.filterImageLoaded = true;
        this.showFilterInRealTime();
    }

    showFilterInRealTime() {
        console.log('👁️ Mostrando filtro en tiempo real...');
        
        if (!this.filterOverlay || !this.filterImage) {
            console.error('❌ Elementos de filtro no encontrados');
            return;
        }
        
        // Mostrar el overlay y la imagen
        this.filterOverlay.style.display = 'block';
        this.filterImage.style.display = 'block';
        
        // Posicionar correctamente
        this.positionFilter();
        
        console.log('✅ Filtro visible en tiempo real');
        
        // Debug: verificar estilos aplicados
        setTimeout(() => {
            const overlayStyles = window.getComputedStyle(this.filterOverlay);
            const imageStyles = window.getComputedStyle(this.filterImage);
            
            console.log('🔍 Debug overlay:', {
                display: overlayStyles.display,
                position: overlayStyles.position,
                zIndex: overlayStyles.zIndex,
                width: overlayStyles.width,
                height: overlayStyles.height
            });
            
            console.log('🔍 Debug image:', {
                display: imageStyles.display,
                position: imageStyles.position,
                src: this.filterImage.src,
                loaded: this.filterImageLoaded
            });
        }, 100);
    }

    hideFilter() {
        console.log('👁️‍🗨️ Ocultando filtro...');
        
        if (this.filterOverlay) {
            this.filterOverlay.style.display = 'none';
        }
        
        if (this.filterImage) {
            this.filterImage.style.display = 'none';
        }
        
        this.filterImageLoaded = false;
        console.log('✅ Filtro ocultado');
    }

    positionFilter() {
        if (!this.filterOverlay || !this.filterImage) {
            return;
        }

        if (this.currentFilter === 'none') {
            return;
        }

        console.log('📐 Posicionando filtro...');
        
        // Asegurar que el contenedor padre sea relative
        const cameraWrapper = this.video.parentElement;
        if (cameraWrapper) {
            const wrapperStyles = window.getComputedStyle(cameraWrapper);
            if (wrapperStyles.position === 'static') {
                cameraWrapper.style.position = 'relative';
                console.log('📦 Contenedor configurado como relative');
            }
        }
        
        // Forzar estilos del overlay
        this.filterOverlay.style.cssText = `
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            pointer-events: none !important;
            z-index: 10 !important;
            display: ${this.currentFilter === 'none' ? 'none' : 'block'} !important;
        `;
        
        // Forzar estilos de la imagen
        this.filterImage.style.cssText = `
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            display: ${this.currentFilter === 'none' ? 'none' : 'block'} !important;
            pointer-events: none !important;
            opacity: 1 !important;
            z-index: 11 !important;
        `;
        
        console.log('✅ Filtro reposicionado');
    }

    capturePhoto() {
        if (!this.stream) {
            alert('La cámara no está disponible');
            return;
        }

        try {
            // Configurar canvas con las dimensiones del video
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

            // Dibujar el frame del video
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

            // Aplicar filtro si está activo y cargado
            if (this.currentFilter !== 'none' && this.filterImageLoaded && this.filterImage.src) {
                console.log(`🖼️ Aplicando filtro en captura: ${this.currentFilter}`);
                
                // Crear imagen temporal para dibujar el filtro
                const filterImg = new Image();
                filterImg.onload = () => {
                    this.ctx.drawImage(filterImg, 0, 0, this.canvas.width, this.canvas.height);
                    this.finalizeCapturePhoto();
                };
                filterImg.src = this.filterImage.src;
            } else {
                this.finalizeCapturePhoto();
            }

        } catch (error) {
            console.error('❌ Error al capturar foto:', error);
            alert('Error al capturar la foto. Inténtalo de nuevo.');
        }
    }

    finalizeCapturePhoto() {
        // Obtener datos de la imagen
        this.capturedImageData = this.canvas.toDataURL('image/jpeg', 0.9);
        
        // Mostrar vista previa
        this.showPhotoPreview();
        
        console.log('✅ Foto capturada con filtro aplicado');
    }

    showPhotoPreview() {
        const capturedPhoto = document.getElementById('captured-photo');
        const modal = document.getElementById('photo-modal');
        
        capturedPhoto.src = this.capturedImageData;
        modal.style.display = 'flex';
        
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    async savePhoto() {
        if (!this.capturedImageData) {
            alert('No hay foto para guardar');
            return;
        }

        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.style.display = 'flex';

        try {
            // Convertir dataURL a Blob
            const blob = await (await fetch(this.capturedImageData)).blob();
            const formData = new FormData();
            formData.append('photo', blob, 'capture.jpg');
            formData.append('filterUsed', this.currentFilter);
            const notes = document.getElementById('photo-notes').value || '';
            formData.append('notes', notes);

            // Enviar multipart/form-data
            const response = await fetch('/api/upload-photo', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'Error al guardar foto');

            console.log('✅ Foto guardada exitosamente');
            this.showSuccessMessage();
            this.closeModal();

            if (window.galleryController && typeof window.galleryController.loadPhotos === 'function') {
                window.galleryController.loadPhotos();
            }

        } catch (error) {
            console.error('❌ Error al guardar foto:', error);
            alert('Error al guardar la foto. Inténtalo de nuevo.');
        } finally {
            loadingOverlay.style.display = 'none';
        }
    }

    showSuccessMessage() {
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>¡Foto guardada exitosamente!</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            z-index: 3000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    retakePhoto() {
        this.closeModal();
        this.capturedImageData = null;
    }

    closeModal() {
        const modal = document.getElementById('photo-modal');
        modal.style.display = 'none';
        modal.classList.remove('show');
    }

    isModalOpen() {
        const modal = document.getElementById('photo-modal');
        return modal.style.display === 'flex';
    }

    destroy() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }
}

// Estilos CSS para las animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
