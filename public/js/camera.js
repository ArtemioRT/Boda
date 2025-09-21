class CameraController {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas?.getContext('2d');
        this.filterOverlay = document.getElementById('filter-overlay');
        this.filterImage = document.getElementById('filter-image');
        this.noCamera = document.getElementById('no-camera');
        this.currentFilter = 'none';
        this.stream = null;
        this.capturedImageData = null;
        this.filterImageLoaded = false;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        console.log('🔍 Elementos encontrados:');
        console.log('Video:', !!this.video);
        console.log('Canvas:', !!this.canvas);
        console.log('Filter Overlay:', !!this.filterOverlay);
        console.log('Filter Image:', !!this.filterImage);
        console.log('Es móvil:', this.isMobile);
        
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando CameraController...');
        await this.setupCamera();
        this.setupEventListeners();
        this.setupFilterButtons();
        this.setupFilterOverlay();
        console.log('✅ CameraController inicializado');
    }

    async setupCamera() {
        console.log('📹 Configurando cámara...');
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('❌ getUserMedia no soportado');
            this.showNoCameraMessage('Tu navegador no soporta acceso a la cámara');
            return;
        }

        try {
            // Configuración específica para móviles
            const constraints = {
                video: {
                    width: this.isMobile ? { ideal: 720, max: 1280 } : { ideal: 640 },
                    height: this.isMobile ? { ideal: 1280, max: 720 } : { ideal: 480 },
                    facingMode: this.isMobile ? 'environment' : 'user', // Cámara trasera en móvil
                    frameRate: { ideal: 30, max: 30 }
                },
                audio: false
            };

            console.log('🎥 Solicitando acceso a cámara con configuración:', constraints);
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (!this.video) {
                throw new Error('Elemento video no encontrado');
            }
            
            this.video.srcObject = this.stream;
            this.video.setAttribute('playsinline', true); // Importante para iOS
            this.video.setAttribute('webkit-playsinline', true); // Safari iOS
            this.video.muted = true; // Evitar problemas de autoplay
            
            // Esperar a que el video esté listo
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout al cargar video'));
                }, 10000);
                
                this.video.onloadedmetadata = () => {
                    clearTimeout(timeout);
                    console.log('📹 Metadatos del video cargados');
                    resolve();
                };
                
                this.video.onerror = (error) => {
                    clearTimeout(timeout);
                    reject(error);
                };
                
                // Forzar reproducción
                this.video.play().catch(e => console.warn('⚠️ Error al reproducir:', e));
            });

            // Configurar canvas después de que el video esté listo
            if (this.canvas) {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                console.log(`📐 Canvas configurado: ${this.canvas.width}x${this.canvas.height}`);
            }
            
            // Eventos del video
            this.video.addEventListener('loadeddata', () => {
                console.log('📹 Video cargado, configurando overlay...');
                this.setupFilterOverlay();
                this.positionFilter();
            });
            
            this.video.addEventListener('playing', () => {
                console.log('▶️ Video reproduciendo...');
                this.positionFilter();
            });
            
            this.video.addEventListener('canplay', () => {
                console.log('✅ Video listo para reproducir');
            });
            
            // Reposicionar en cambios de orientación (móvil)
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.handleOrientationChange();
                }, 500);
            });
            
            window.addEventListener('resize', () => {
                setTimeout(() => this.positionFilter(), 100);
            });
            
            console.log('✅ Cámara inicializada correctamente');

        } catch (error) {
            console.error('❌ Error al acceder a la cámara:', error);
            this.handleCameraError(error);
        }
    }

    handleCameraError(error) {
        let message = 'No se pudo acceder a la cámara';
        
        if (error.name === 'NotAllowedError') {
            message = 'Permiso de cámara denegado. Por favor permite el acceso a la cámara.';
        } else if (error.name === 'NotFoundError') {
            message = 'No se encontró ninguna cámara en el dispositivo.';
        } else if (error.name === 'NotReadableError') {
            message = 'La cámara está siendo usada por otra aplicación.';
        } else if (error.name === 'OverconstrainedError') {
            message = 'La configuración de cámara no es compatible.';
        }
        
        this.showNoCameraMessage(message);
    }

    handleOrientationChange() {
        console.log('🔄 Cambio de orientación detectado');
        
        if (this.video && this.canvas) {
            // Reconfigurar canvas
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
        }
        
        // Reposicionar filtro
        this.positionFilter();
    }

    setupFilterOverlay() {
        if (!this.filterOverlay || !this.filterImage) {
            console.warn('⚠️ Elementos de filtro no encontrados');
            return;
        }
        
        console.log('🎭 Configurando overlay de filtros...');
        
        // Asegurar estructura HTML correcta
        const cameraWrapper = this.video?.parentElement;
        if (cameraWrapper) {
            cameraWrapper.style.position = 'relative';
            cameraWrapper.style.display = 'block';
            cameraWrapper.style.overflow = 'hidden';
            console.log('📦 Camera wrapper configurado');
        }
        
        // Configurar el overlay
        Object.assign(this.filterOverlay.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '10',
            display: 'none'
        });
        
        // Configurar la imagen del filtro
        Object.assign(this.filterImage.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'none',
            pointerEvents: 'none',
            opacity: '1',
            zIndex: '11'
        });
        
        console.log('✅ Overlay configurado');
    }

    showNoCameraMessage(message = 'Cámara no disponible') {
        console.log('📵 Mostrando mensaje de no cámara:', message);
        
        if (this.video) {
            this.video.style.display = 'none';
        }
        
        if (this.noCamera) {
            this.noCamera.style.display = 'flex';
            const messageEl = this.noCamera.querySelector('p');
            if (messageEl) {
                messageEl.textContent = message;
            }
        }
        
        const takePhotoBtn = document.getElementById('take-photo');
        if (takePhotoBtn) {
            takePhotoBtn.disabled = true;
            takePhotoBtn.innerHTML = '<i class="fas fa-camera-slash"></i> Cámara no disponible';
            takePhotoBtn.style.opacity = '0.5';
        }
    }

    setupEventListeners() {
        console.log('🎮 Configurando event listeners...');
        
        const takePhotoBtn = document.getElementById('take-photo');
        const savePhotoBtn = document.getElementById('save-photo');
        const retakePhotoBtn = document.getElementById('retake-photo');
        const closeModalBtn = document.getElementById('close-modal');

        if (takePhotoBtn) {
            takePhotoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.capturePhoto();
            });
            
            // Para móviles, también agregar touch
            takePhotoBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.capturePhoto();
            });
        }

        if (savePhotoBtn) {
            savePhotoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.savePhoto();
            });
        }

        if (retakePhotoBtn) {
            retakePhotoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.retakePhoto();
            });
        }

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeModal();
            });
        }

        const modal = document.getElementById('photo-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // Eventos de teclado (solo para escritorio)
        if (!this.isMobile) {
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
        
        console.log('✅ Event listeners configurados');
    }

    setupFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        console.log('🔘 Configurando botones de filtro:', filterButtons.length);
        
        filterButtons.forEach((button) => {
            // Click normal
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = button.getAttribute('data-filter');
                this.applyFilterFromButton(button, filter);
            });
            
            // Touch para móviles
            if (this.isMobile) {
                button.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    const filter = button.getAttribute('data-filter');
                    this.applyFilterFromButton(button, filter);
                });
            }
        });
    }

    applyFilterFromButton(button, filter) {
        console.log('🖱️ Filtro seleccionado:', filter);
        
        // Actualizar botones activos
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Aplicar filtro inmediatamente
        this.applyFilter(filter);
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
            `/filters/${filter}.png`,
            `public/filters/${filter}.png`,
            `./public/filters/${filter}.png`,
            `/public/filters/${filter}.png`,
            `images/filters/${filter}.png`,
            `./images/filters/${filter}.png`,
            `/images/filters/${filter}.png`,
            `assets/filters/${filter}.png`,
            `./assets/filters/${filter}.png`,
            `/assets/filters/${filter}.png`
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
        testImage.crossOrigin = 'anonymous';
        
        const timeout = setTimeout(() => {
            console.warn(`⏰ Timeout cargando: ${currentPath}`);
            this.tryLoadFilterFromPaths(paths, index + 1, filter);
        }, 3000);
        
        testImage.onload = () => {
            clearTimeout(timeout);
            console.log('✅ Filtro cargado desde:', currentPath);
            
            // Asignar la imagen cargada
            if (this.filterImage) {
                this.filterImage.src = currentPath;
                this.filterImageLoaded = true;
                
                // Mostrar inmediatamente
                this.showFilterInRealTime();
            }
        };
        
        testImage.onerror = () => {
            clearTimeout(timeout);
            console.warn(`❌ Falló carga desde: ${currentPath}`);
            this.tryLoadFilterFromPaths(paths, index + 1, filter);
        };
        
        testImage.src = currentPath;
    }

    createTemporaryFilter(filter) {
        console.log('🎭 Creando filtro temporal para:', filter);
        
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        
        // Diferentes estilos según el filtro
        if (filter === 'frame1' || filter === 'elegant') {
            // Marco dorado
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#d4af37');
            gradient.addColorStop(0.5, '#ffd700');
            gradient.addColorStop(1, '#b8860b');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 20;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
            
            ctx.strokeStyle = '#8b4b5a';
            ctx.lineWidth = 8;
            ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);
            
            ctx.font = 'italic 24px serif';
            ctx.fillStyle = '#8b4b5a';
            ctx.textAlign = 'center';
            ctx.fillText('Elva & Samuel', canvas.width / 2, 50);
            
        } else if (filter === 'frame2' || filter === 'hearts' || filter === 'romantic') {
            // Corazones
            ctx.font = '48px Arial';
            ctx.fillStyle = '#ff69b4';
            ctx.fillText('♥', 20, 60);
            ctx.fillText('♥', canvas.width - 60, 60);
            ctx.fillText('♥', 20, canvas.height - 20);
            ctx.fillText('♥', canvas.width - 60, canvas.height - 20);
            
            ctx.font = '28px cursive';
            ctx.fillStyle = '#c49b90';
            ctx.textAlign = 'center';
            ctx.fillText('Amor Eterno', canvas.width / 2, 40);
            
        } else {
            // Filtro genérico
            ctx.strokeStyle = '#c49b90';
            ctx.lineWidth = 12;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
            
            ctx.font = '24px Arial';
            ctx.fillStyle = '#8b4b5a';
            ctx.textAlign = 'center';
            ctx.fillText(filter.toUpperCase(), canvas.width / 2, 40);
        }
        
        // Convertir a data URL y usar como filtro
        if (this.filterImage) {
            this.filterImage.src = canvas.toDataURL('image/png');
            this.filterImageLoaded = true;
            this.showFilterInRealTime();
        }
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
        if (!this.filterOverlay || !this.filterImage || this.currentFilter === 'none') {
            return;
        }

        console.log('📐 Posicionando filtro...');
        
        const cameraWrapper = this.video?.parentElement;
        if (cameraWrapper) {
            const wrapperStyles = window.getComputedStyle(cameraWrapper);
            if (wrapperStyles.position === 'static') {
                cameraWrapper.style.position = 'relative';
                console.log('📦 Contenedor configurado como relative');
            }
        }
        
        // Forzar estilos del overlay
        Object.assign(this.filterOverlay.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '10',
            display: 'block'
        });
        
        // Forzar estilos de la imagen
        Object.assign(this.filterImage.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            pointerEvents: 'none',
            opacity: '1',
            zIndex: '11'
        });
        
        console.log('✅ Filtro reposicionado');
    }

    async capturePhoto() {
        console.log('📸 Iniciando captura de foto...');
        
        if (!this.stream) {
            alert('La cámara no está disponible');
            return;
        }

        if (!this.canvas || !this.ctx) {
            console.error('❌ Canvas no disponible');
            alert('Error: Canvas no disponible');
            return;
        }

        try {
            // Configurar canvas con las dimensiones del video
            this.canvas.width = this.video.videoWidth || 640;
            this.canvas.height = this.video.videoHeight || 480;
            
            console.log(`📐 Capturando en resolución: ${this.canvas.width}x${this.canvas.height}`);

            // Dibujar el frame del video
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

            // Aplicar filtro si está activo y cargado
            if (this.currentFilter !== 'none' && this.filterImageLoaded && this.filterImage?.src) {
                console.log(`🖼️ Aplicando filtro en captura: ${this.currentFilter}`);
                
                const filterImg = new Image();
                filterImg.crossOrigin = 'anonymous';
                
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        console.warn('⏰ Timeout aplicando filtro, continuando sin filtro');
                        resolve();
                    }, 2000);
                    
                    filterImg.onload = () => {
                        clearTimeout(timeout);
                        try {
                            this.ctx.drawImage(filterImg, 0, 0, this.canvas.width, this.canvas.height);
                            console.log('✅ Filtro aplicado en captura');
                        } catch (error) {
                            console.warn('⚠️ Error aplicando filtro en captura:', error);
                        }
                        resolve();
                    };
                    
                    filterImg.onerror = () => {
                        clearTimeout(timeout);
                        console.warn('⚠️ Error cargando filtro para captura');
                        resolve();
                    };
                    
                    filterImg.src = this.filterImage.src;
                });
            }

            // Obtener datos de la imagen
            this.capturedImageData = this.canvas.toDataURL('image/jpeg', 0.85);
            
            if (!this.capturedImageData || this.capturedImageData === 'data:,') {
                throw new Error('No se pudieron capturar los datos de la imagen');
            }
            
            // Mostrar vista previa
            this.showPhotoPreview();
            
            console.log('✅ Foto capturada exitosamente');

        } catch (error) {
            console.error('❌ Error al capturar foto:', error);
            alert('Error al capturar la foto. Inténtalo de nuevo.');
        }
    }

    showPhotoPreview() {
        console.log('🖼️ Mostrando vista previa...');
        
        const capturedPhoto = document.getElementById('captured-photo');
        const modal = document.getElementById('photo-modal');
        
        if (!capturedPhoto || !modal) {
            console.error('❌ Elementos de modal no encontrados');
            return;
        }
        
        capturedPhoto.src = this.capturedImageData;
        modal.style.display = 'flex';
        
        // Para móviles, evitar el zoom
        if (this.isMobile) {
            document.body.style.overflow = 'hidden';
            
            // Configurar el modal para móviles
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100vw';
            modal.style.height = '100vh';
            modal.style.zIndex = '9999';
        }
        
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        console.log('✅ Vista previa mostrada');
    }

    async savePhoto() {
        if (!this.capturedImageData) {
            alert('No hay foto para guardar');
            return;
        }

        console.log('💾 Guardando foto...');
        
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }

        try {
            // Convertir dataURL a Blob
            const response = await fetch(this.capturedImageData);
            const blob = await response.blob();
            
            const formData = new FormData();
            formData.append('photo', blob, `photo_${Date.now()}.jpg`);
            formData.append('filterUsed', this.currentFilter);
            
            const notesElement = document.getElementById('photo-notes');
            const notes = notesElement?.value || '';
            formData.append('notes', notes);

            // Enviar al servidor
            console.log('📤 Enviando foto al servidor...');
            const uploadResponse = await fetch('/api/upload-photo', {
                method: 'POST',
                body: formData
            });
            
            const data = await uploadResponse.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Error al guardar foto');
            }

            console.log('✅ Foto guardada exitosamente');
            this.showSuccessMessage();
            this.closeModal();

            // Recargar galería si existe
            if (window.galleryController && typeof window.galleryController.loadPhotos === 'function') {
                setTimeout(() => {
                    window.galleryController.loadPhotos();
                }, 500);
            }

        } catch (error) {
            console.error('❌ Error al guardar foto:', error);
            alert(`Error al guardar la foto: ${error.message}`);
        } finally {
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }
    }

    showSuccessMessage() {
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>¡Foto guardada exitosamente!</span>
        `;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: this.isMobile ? '60px' : '20px',
            right: '20px',
            left: this.isMobile ? '20px' : 'auto',
            background: '#28a745',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            zIndex: '4000',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            animation: this.isMobile ? 'fadeIn 0.3s ease-out' : 'slideInRight 0.3s ease-out'
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = this.isMobile ? 'fadeOut 0.3s ease-in forwards' : 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    retakePhoto() {
        console.log('🔄 Retomando foto...');
        this.closeModal();
        this.capturedImageData = null;
    }

    closeModal() {
        console.log('✖️ Cerrando modal...');
        
        const modal = document.getElementById('photo-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
        
        // Restaurar scroll en móviles
        if (this.isMobile) {
            document.body.style.overflow = '';
        }
        
        // Limpiar campo de notas
        const notesElement = document.getElementById('photo-notes');
        if (notesElement) {
            notesElement.value = '';
        }
    }

    isModalOpen() {
        const modal = document.getElementById('photo-modal');
        return modal?.style.display === 'flex';
    }

    destroy() {
        console.log('🗑️ Destruyendo CameraController...');
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
                console.log('⏹️ Track detenido:', track.kind);
            });
        }
        
        this.stream = null;
        this.capturedImageData = null;
        this.filterImageLoaded = false;
        
        console.log('✅ CameraController destruido');
    }

    // Método para obtener información de debug
    getDebugInfo() {
        return {
            hasStream: !!this.stream,
            hasVideo: !!this.video,
            hasCanvas: !!this.canvas,
            videoReady: this.video?.readyState === 4,
            videoPlaying: this.video && !this.video.paused && !this.video.ended,
            videoDimensions: this.video ? {
                width: this.video.videoWidth,
                height: this.video.videoHeight
            } : null,
            currentFilter: this.currentFilter,
            filterLoaded: this.filterImageLoaded,
            isMobile: this.isMobile,
            userAgent: navigator.userAgent
        };
    }
}

// Estilos CSS para las animaciones
if (!document.getElementById('camera-styles')) {
    const style = document.createElement('style');
    style.id = 'camera-styles';
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-20px); }
        }
        
        /* Estilos específicos para móviles */
        @media (max-width: 768px) {
            .camera-wrapper {
                width: 100% !important;
                max-width: none !important;
            }
            
            #video {
                width: 100% !important;
                height: auto !important;
                object-fit: cover !important;
            }
            
            .filter-btn {
                padding: 0.75rem !important;
                font-size: 0.9rem !important;
                min-height: 44px !important; /* Tamaño mínimo para touch */
            }
            
            #photo-modal {
                padding: 10px !important;
            }
            
            #photo-modal .modal-content {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                border-radius: 10px !important;
            }
            
            #captured-photo {
                max-width: 100% !important;
                max-height: 60vh !important;
                object-fit: contain !important;
            }
        }
        
        /* Orientación landscape en móviles */
        @media (max-width: 768px) and (orientation: landscape) {
            #video {
                height: 100vh !important;
                width: auto !important;
            }
        }
    `;
    document.head.appendChild(style);
}