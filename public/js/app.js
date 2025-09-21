  // App.js - Aplicación principal optimizada para móviles
class PhotoBoothApp {
    constructor() {
        this.cameraController = null;
        this.filterManager = null;
        this.galleryController = null;
        this.diagnostic = null;
        this.currentTab = 'camera';
        this.initializationAttempts = 0;
        this.maxInitializationAttempts = 3;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.isTouch = 'ontouchstart' in window;
        
        console.log('🎉 Iniciando PhotoBooth App...');
        console.log('📱 Es móvil:', this.isMobile);
        console.log('👆 Soporta touch:', this.isTouch);
        
        this.init();
    }

    async init() {
        this.initializationAttempts++;
        console.log(`🚀 Intento de inicialización #${this.initializationAttempts}`);
        
        // Esperar a que el DOM esté completamente cargado
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        try {
            // Verificar elementos esenciales del DOM
            await this.checkEssentialElements();
            
            // Configurar viewport para móviles
            this.setupMobileViewport();
            
            // Inicializar diagnóstico primero
            this.diagnostic = new FilterDiagnostic();
            
            // Inicializar componentes
            await this.initializeComponents();
            
            // Configurar eventos globales
            this.setupGlobalEvents();
            
            // Configurar navegación entre tabs
            this.setupTabNavigation();
            
            // Configurar botones de filtro mejorados
            this.setupEnhancedFilterButtons();
            
            // Configuración específica para móviles
            if (this.isMobile) {
                this.setupMobileSpecific();
            }
            
            console.log('✅ PhotoBooth App inicializado exitosamente');
            this.showInitializationSuccess();
            
        } catch (error) {
            console.error('❌ Error al inicializar la aplicación:', error);
            await this.handleInitializationError(error);
        }
    }

    async checkEssentialElements() {
        console.log('🔍 Verificando elementos esenciales del DOM...');
        
        const essentialElements = [
            'video',
            'canvas', 
            'take-photo',
            'photo-modal',
            'captured-photo'
        ];
        
        const missingElements = [];
        
        essentialElements.forEach(id => {
            const element = document.getElementById(id);
            if (!element) {
                missingElements.push(id);
            }
        });
        
        if (missingElements.length > 0) {
            throw new Error(`Elementos faltantes en el DOM: ${missingElements.join(', ')}`);
        }
        
        console.log('✅ Todos los elementos esenciales están presentes');
    }

    setupMobileViewport() {
        if (!this.isMobile) return;
        
        console.log('📱 Configurando viewport para móviles...');
        
        // Asegurar viewport meta tag
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        
        // Prevenir zoom en inputs
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (!input.style.fontSize) {
                input.style.fontSize = '16px'; // Previene zoom en iOS
            }
        });
        
        // Configurar body para móviles
        document.body.style.touchAction = 'manipulation'; // Mejora la respuesta táctil
        document.body.style.webkitUserSelect = 'none'; // Previene selección accidental
        document.body.style.userSelect = 'none';
        
        console.log('✅ Viewport móvil configurado');
    }

    async handleInitializationError(error) {
        if (this.initializationAttempts < this.maxInitializationAttempts) {
            console.log(`🔄 Reintentando inicialización (intento ${this.initializationAttempts + 1}/${this.maxInitializationAttempts})...`);
            setTimeout(() => this.init(), 2000);
        } else {
            console.error('💥 Error crítico: No se pudo inicializar después de múltiples intentos');
            this.showErrorMessage('Error al inicializar la aplicación. Recarga la página.');
            
            // Intentar inicialización básica de respaldo
            await this.fallbackInitialization();
        }
    }

    async fallbackInitialization() {
        console.log('🆘 Inicializando modo de respaldo...');
        
        try {
            // Solo inicializar controlador de cámara básico
            this.cameraController = new CameraController();
            window.cameraController = this.cameraController;
            
            // Crear filtros de demostración
            await this.createFallbackFilters();
            
            console.log('✅ Modo de respaldo inicializado');
            
        } catch (fallbackError) {
            console.error('💀 Error crítico en modo de respaldo:', fallbackError);
            this.showCriticalError(fallbackError);
        }
    }

    async initializeComponents() {
        console.log('🔧 Inicializando componentes...');

        // Inicializar controlador de cámara
        this.cameraController = new CameraController();
        window.cameraController = this.cameraController;

        // Esperar a que la cámara esté lista con timeout más largo para móviles
        const cameraTimeout = this.isMobile ? 10000 : 5000;
        await this.waitForCameraReady(cameraTimeout);
        
        // Inicializar manager de filtros si está disponible
        if (typeof FilterManager !== 'undefined') {
            this.filterManager = new FilterManager(this.cameraController);
            await this.filterManager.init();
            this.updateFilterButtons(this.filterManager.availableFilters);
            
            // Vincular filtros al controlador de cámara
            if (this.cameraController.setFilterManager) {
                this.cameraController.setFilterManager(this.filterManager);
            }
            
            window.filterManager = this.filterManager;
        } else {
            console.warn('⚠️ FilterManager no disponible, usando filtros básicos');
            await this.createFallbackFilters();
        }
        
        // Inicializar galería si existe
        if (typeof GalleryController !== 'undefined') {
            try {
                this.galleryController = new GalleryController();
                window.galleryController = this.galleryController;
                console.log('✅ GalleryController inicializado');
            } catch (error) {
                console.warn('⚠️ Error inicializando GalleryController:', error);
            }
        } else {
            console.warn('⚠️ GalleryController no disponible');
        }
        
        // Hacer disponible el diagnóstico globalmente
        window.diagnostic = this.diagnostic;
        
        console.log('✅ Componentes inicializados');
    }

    async waitForCameraReady(timeout = 5000) {
        const checkInterval = 200;
        let waited = 0;
        
        return new Promise((resolve) => {
            const checkCamera = () => {
                if (this.cameraController.stream && this.cameraController.video && this.cameraController.video.videoWidth > 0) {
                    console.log('📹 Cámara lista');
                    resolve();
                } else if (waited >= timeout) {
                    console.warn(`⏰ Timeout esperando cámara después de ${timeout}ms, continuando...`);
                    resolve(); // No rechazar, continuar sin cámara
                } else {
                    waited += checkInterval;
                    setTimeout(checkCamera, checkInterval);
                }
            };
            
            checkCamera();
        });
    }

    setupGlobalEvents() {
        console.log('🌐 Configurando eventos globales...');

        // Manejar errores globales
        window.addEventListener('error', (event) => {
            console.error('Error global:', event.error);
            this.handleGlobalError(event.error);
        });

        // Manejar promesas rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promesa rechazada:', event.reason);
            this.handleGlobalError(event.reason);
        });

        // Orientación de dispositivo (móviles)
        if (this.isMobile) {
            window.addEventListener('orientationchange', () => {
                console.log('🔄 Cambio de orientación detectado');
                setTimeout(() => {
                    this.handleOrientationChange();
                }, 500);
            });
            
            // También escuchar resize en móviles
            window.addEventListener('resize', () => {
                setTimeout(() => {
                    this.handleOrientationChange();
                }, 300);
            });
        } else {
            window.addEventListener('resize', () => {
                setTimeout(() => {
                    if (this.filterManager) {
                        this.filterManager.repositionFilter();
                    }
                }, 100);
            });
        }

        // Visibilidad de la página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseApp();
            } else {
                this.resumeApp();
            }
        });

        // Prevenir zoom en móviles al hacer doble tap
        if (this.isMobile) {
            let lastTouchEnd = 0;
            document.addEventListener('touchend', (event) => {
                const now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) {
                    event.preventDefault();
                }
                lastTouchEnd = now;
            });
        }

        console.log('✅ Eventos globales configurados');
    }

    handleOrientationChange() {
        console.log('🔄 Manejando cambio de orientación/tamaño...');
        
        if (this.filterManager && this.filterManager.repositionFilter) {
            this.filterManager.repositionFilter();
        }
        
        if (this.cameraController && this.cameraController.handleOrientationChange) {
            this.cameraController.handleOrientationChange();
        }
        
        // Reconfigurar viewport si es necesario
        if (this.isMobile) {
            setTimeout(() => {
                this.setupMobileViewport();
            }, 100);
        }
    }

    handleGlobalError(error) {
        // Si hay muchos errores de filtros, intentar recrearlos
        if (error && error.message && error.message.includes('filter')) {
            console.log('🔄 Error de filtro detectado, intentando reparación...');
            this.repairFilters();
        }
        
        // Si hay errores de cámara, intentar reinicializar
        if (error && error.message && (error.message.includes('camera') || error.message.includes('getUserMedia'))) {
            console.log('🔄 Error de cámara detectado, intentando reinicialización...');
            setTimeout(() => {
                if (this.cameraController && this.cameraController.init) {
                    this.cameraController.init();
                }
            }, 2000);
        }
    }

    async repairFilters() {
        try {
            console.log('🔧 Reparando sistema de filtros...');
            
            if (this.filterManager && this.filterManager.regenerateFilters) {
                await this.filterManager.regenerateFilters();
            } else {
                await this.createFallbackFilters();
            }
            
            this.setupEnhancedFilterButtons();
            console.log('✅ Sistema de filtros reparado');
        } catch (error) {
            console.error('❌ No se pudieron reparar los filtros:', error);
        }
    }

    async createFallbackFilters() {
        console.log('🎨 Creando filtros de respaldo...');
        
        const fallbackFilters = ['elegant', 'romantic', 'vintage', 'classic'];
        
        // Actualizar botones
        this.updateFilterButtons(fallbackFilters);
        
        console.log('✅ Filtros de respaldo creados:', fallbackFilters);
    }

    updateFilterButtons(filterNames) {
        const container = document.querySelector('.filter-buttons');
        if (!container) {
            console.warn('⚠️ Contenedor de botones de filtro no encontrado');
            return;
        }
        
        console.log('🔘 Actualizando botones de filtro:', filterNames);
        
        // Mantener botón "none"
        const existingNone = container.querySelector('[data-filter="none"]');
        container.innerHTML = '';
        
        if (existingNone) {
            container.appendChild(existingNone);
        } else {
            const noneBtn = this.createFilterButton('none', 'Natural', 'fas fa-camera');
            container.appendChild(noneBtn);
        }
        
        // Agregar nuevos botones
        filterNames.forEach(name => {
            if (name !== 'none') {
                const btn = this.createFilterButton(name, name.charAt(0).toUpperCase() + name.slice(1), 'fas fa-frame');
                container.appendChild(btn);
            }
        });
        
        // Reaplicar event listeners
        this.setupEnhancedFilterButtons();
    }

    createFilterButton(filter, text, iconClass) {
        const btn = document.createElement('button');
        btn.className = filter === 'none' ? 'filter-btn active' : 'filter-btn';
        btn.setAttribute('data-filter', filter);
        btn.innerHTML = `<i class="${iconClass}"></i>${text}`;
        
        // Configuración específica para móviles
        if (this.isMobile) {
            btn.style.minHeight = '44px'; // Tamaño mínimo para touch
            btn.style.padding = '0.75rem';
            btn.style.fontSize = '0.9rem';
        }
        
        return btn;
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        console.log('📑 Configurando navegación de tabs:', tabButtons.length);

        tabButtons.forEach(button => {
            const setupTabEvent = (eventType) => {
                button.addEventListener(eventType, (e) => {
                    e.preventDefault();
                    const targetTab = button.getAttribute('data-tab');
                    this.switchTab(targetTab, tabButtons, tabContents);
                    document.dispatchEvent(new CustomEvent('tabChanged', { detail: { tab: targetTab } }));
                });
            };
            
            setupTabEvent('click');
            
            // Agregar soporte touch para móviles
            if (this.isTouch) {
                setupTabEvent('touchend');
            }
        });
    }

    switchTab(targetTab, tabButtons, tabContents) {
        console.log('🔄 Cambiando a tab:', targetTab);
        
        // Actualizar botones
        tabButtons.forEach(btn => btn.classList.remove('active'));
        const activeButton = document.querySelector(`[data-tab="${targetTab}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        // Actualizar contenido
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        const targetContent = document.getElementById(`${targetTab}-section`);
        if (targetContent) {
            targetContent.classList.add('active');
        }

        this.currentTab = targetTab;

        // Acciones específicas por tab
        if (targetTab === 'gallery' && this.galleryController) {
            console.log('📸 Cargando galería...');
            setTimeout(() => {
                if (typeof this.galleryController.loadPhotos === 'function') {
                    this.galleryController.loadPhotos();
                }
            }, 100);
        } else if (targetTab === 'camera') {
            console.log('📹 Activando cámara...');
            setTimeout(() => {
                if (this.filterManager && this.filterManager.currentFilter !== 'none') {
                    this.filterManager.repositionFilter();
                }
                
                // Reanudar cámara si estaba pausada
                if (this.cameraController && this.cameraController.stream) {
                    const videoTracks = this.cameraController.stream.getVideoTracks();
                    videoTracks.forEach(track => {
                        track.enabled = true;
                    });
                }
            }, 100);
        }
    }

    setupEnhancedFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        console.log('🔘 Configurando botones de filtro mejorados:', filterButtons.length);
        
        filterButtons.forEach((button) => {
            // Remover listeners existentes clonando el elemento
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
        });
        
        // Reagregar listeners a los botones nuevos
        document.querySelectorAll('.filter-btn').forEach((button) => {
            const setupFilterEvent = (eventType) => {
                button.addEventListener(eventType, async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const filter = button.getAttribute('data-filter');
                    console.log(`🖱️ Filtro seleccionado (${eventType}):`, filter);
                    
                    try {
                        // Feedback visual inmediato
                        button.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            button.style.transform = '';
                        }, 150);
                        
                        // Actualizar botones activos
                        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                        button.classList.add('active');
                        
                        // Aplicar filtro
                        if (this.filterManager && this.filterManager.applyFilter) {
                            await this.filterManager.applyFilter(filter);
                        } else if (this.cameraController && this.cameraController.applyFilter) {
                            this.cameraController.applyFilter(filter);
                        }
                        
                        console.log(`✅ Filtro ${filter} aplicado`);
                        
                    } catch (error) {
                        console.error(`❌ Error aplicando filtro ${filter}:`, error);
                        this.showErrorMessage(`Error al aplicar filtro: ${filter}`);
                        
                        // Volver al filtro "none" en caso de error
                        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                        const noneButton = document.querySelector('[data-filter="none"]');
                        if (noneButton) {
                            noneButton.classList.add('active');
                        }
                    }
                });
            };
            
            setupFilterEvent('click');
            
            // Agregar soporte touch para móviles
            if (this.isTouch) {
                setupFilterEvent('touchend');
            }
        });
    }

    setupMobileSpecific() {
        console.log('📱 Configurando funcionalidades específicas para móviles...');
        
        // Prevenir scroll cuando se esté usando la cámara
        const cameraSection = document.getElementById('camera-section');
        if (cameraSection) {
            cameraSection.addEventListener('touchmove', (e) => {
                // Permitir scroll solo en elementos específicos
                if (!e.target.closest('.scrollable')) {
                    e.preventDefault();
                }
            }, { passive: false });
        }
        
        // Mejorar la respuesta de los botones
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('touchstart', function() {
                this.style.backgroundColor = this.style.backgroundColor || '#e0e0e0';
            }, { passive: true });
            
            button.addEventListener('touchend', function() {
                setTimeout(() => {
                    this.style.backgroundColor = '';
                }, 150);
            }, { passive: true });
        });
        
        // Configurar botón de tomar foto para móviles
        const takePhotoBtn = document.getElementById('take-photo');
        if (takePhotoBtn) {
            takePhotoBtn.style.minHeight = '60px';
            takePhotoBtn.style.fontSize = '1.1rem';
            takePhotoBtn.style.fontWeight = 'bold';
        }
        
        console.log('✅ Configuraciones móviles aplicadas');
    }

    pauseApp() {
        console.log('⏸️ Pausando aplicación...');
        
        if (this.cameraController && this.cameraController.stream) {
            const videoTracks = this.cameraController.stream.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = false;
            });
        }
    }

    resumeApp() {
        console.log('▶️ Reanudando aplicación...');
        
        if (this.cameraController && this.cameraController.stream) {
            const videoTracks = this.cameraController.stream.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = true;
            });
            
            if (this.filterManager && this.filterManager.repositionFilter) {
                setTimeout(() => {
                    this.filterManager.repositionFilter();
                }, 300);
            }
        }
    }

    showInitializationSuccess() {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>¡PhotoBooth listo!</span>
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
            animation: 'fadeIn 0.3s ease-out'
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer;">×</button>
        `;
        
        Object.assign(errorDiv.style, {
            position: 'fixed',
            top: this.isMobile ? '60px' : '20px',
            right: '20px',
            left: this.isMobile ? '20px' : 'auto',
            background: '#dc3545',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            zIndex: '4000',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            animation: 'slideIn 0.3s ease-out',
            maxWidth: this.isMobile ? 'none' : '400px'
        });

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.style.animation = 'slideOut 0.3s ease-in forwards';
                setTimeout(() => {
                    if (errorDiv.parentNode) {
                        errorDiv.parentNode.removeChild(errorDiv);
                    }
                }, 300);
            }
        }, 8000);
    }

    showCriticalError(error) {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="background: #f8f9fa; border-radius: 15px; padding: 2rem; text-align: center; color: #495057; max-width: 500px; margin: 2rem auto;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ffc107; margin-bottom: 1rem;"></i>
                <h2 style="margin-bottom: 1rem; font-size: ${this.isMobile ? '1.5rem' : '2rem'};">Error Crítico</h2>
                <p style="margin-bottom: 1.5rem; font-size: ${this.isMobile ? '0.9rem' : '1rem'};">No se pudo inicializar la aplicación correctamente.</p>
                <div style="text-align: left; margin-bottom: 1.5rem; font-size: 0.9rem;">
                    <p><strong>Posibles causas:</strong></p>
                    <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                        <li>Problemas de acceso a la cámara</li>
                        <li>Navegador no compatible</li>
                        <li>Conexión inestable</li>
                        ${this.isMobile ? '<li>Permisos de cámara denegados</li>' : ''}
                    </ul>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button onclick="window.location.reload()" style="background: #007bff; color: white; border: none; padding: 1rem 2rem; border-radius: 25px; cursor: pointer; font-size: 1rem; min-width: 120px;">
                        <i class="fas fa-redo"></i> Recargar
                    </button>
                    ${!this.isMobile ? `
                        <button onclick="window.debugPhotoBoothApp && window.debugPhotoBoothApp()" style="background: #6c757d; color: white; border: none; padding: 1rem 2rem; border-radius: 25px; cursor: pointer; font-size: 1rem; min-width: 120px;">
                            <i class="fas fa-bug"></i> Debug
                        </button>
                    ` : ''}
                </div>
                <p style="color: #999; font-size: 0.8rem; margin-top: 1.5rem;">
                    Error: ${error?.message || 'Error desconocido'}
                </p>
            </div>
        `;
        
        // Insertar en el contenido principal
        const mainContent = document.querySelector('.main-content') || document.body;
        if (mainContent) {
            mainContent.innerHTML = errorDiv.innerHTML;
        }
    }

    // Método para verificar estado de la aplicación
    getAppStatus() {
        return {
            initialized: !!this.cameraController,
            camera: {
                available: !!this.cameraController?.stream,
                videoReady: this.cameraController?.video?.videoWidth > 0
            },
            filters: {
                managerReady: !!this.filterManager,
                cached: this.filterManager?.filterCache?.size || 0,
                current: this.filterManager?.currentFilter || 'none'
            },
            gallery: {
                available: !!this.galleryController
            },
            diagnostic: {
                available: !!this.diagnostic,
                lastRun: this.diagnostic?.results?.length || 0
            },
            currentTab: this.currentTab,
            errors: this.initializationAttempts > 1
        };
    }
}

// Enhanced Camera Controller mejorado
class EnhancedCameraController extends CameraController {
    constructor() {
        super();
        this.filterManager = null;
        this.retryAttempts = 0;
        this.maxRetryAttempts = 3;
    }

    setFilterManager(filterManager) {
        this.filterManager = filterManager;
        console.log('🔗 FilterManager vinculado al CameraController');
    }

    // Override del método de inicialización con reintentos
    async init() {
        try {
            await super.init();
        } catch (error) {
            console.error('❌ Error en inicialización de cámara:', error);
            
            if (this.retryAttempts < this.maxRetryAttempts) {
                this.retryAttempts++;
                console.log(`🔄 Reintentando inicialización de cámara (${this.retryAttempts}/${this.maxRetryAttempts})...`);
                setTimeout(() => this.init(), 2000);
            } else {
                console.error('💥 No se pudo inicializar la cámara después de múltiples intentos');
                this.showNoCameraMessage();
            }
        }
    }

    // Override mejorado del método capturePhoto
    async capturePhoto() {
        if (!this.stream) {
            alert('La cámara no está disponible');
            return;
        }

        try {
            console.log('📸 Iniciando captura de foto...');
            
            // Configurar canvas
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

            // Dibujar el frame del video
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

            // Aplicar filtro usando FilterManager si está disponible
            if (this.filterManager && this.filterManager.currentFilter !== 'none') {
                const filterImage = this.filterManager.getFilterForCapture();
                if (filterImage && filterImage.complete) {
                    console.log(`🖼️ Aplicando filtro en captura: ${this.filterManager.currentFilter}`);
                    this.ctx.drawImage(filterImage, 0, 0, this.canvas.width, this.canvas.height);
                } else if (filterImage) {
                    // Si la imagen no está completa, esperar un poco y reintentar
                    console.log('⏳ Esperando que el filtro se cargue completamente...');
                    await new Promise(resolve => setTimeout(resolve, 200));
                    if (filterImage.complete) {
                        this.ctx.drawImage(filterImage, 0, 0, this.canvas.width, this.canvas.height);
                    }
                }
            }

            // Finalizar captura
            this.capturedImageData = this.canvas.toDataURL('image/jpeg', 0.9);
            this.showPhotoPreview();
            
            console.log('✅ Foto capturada exitosamente');

        } catch (error) {
            console.error('❌ Error al capturar foto:', error);
            alert('Error al capturar la foto. Inténtalo de nuevo.');
        }
    }

    // Override del método setupFilterButtons para mejor manejo de errores
    setupFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        console.log('🔘 Configurando botones de filtro:', filterButtons.length);
        
        filterButtons.forEach((button) => {
            button.addEventListener('click', async () => {
                const filter = button.getAttribute('data-filter');
                console.log('🖱️ Filtro seleccionado:', filter);
                
                try {
                    // Actualizar botones activos
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    
                    // Aplicar filtro usando FilterManager si está disponible
                    if (this.filterManager) {
                        await this.filterManager.applyFilter(filter);
                        this.currentFilter = filter;
                    } else {
                        // Fallback al método original
                        this.applyFilter(filter);
                    }
                    
                } catch (error) {
                    console.error(`❌ Error aplicando filtro ${filter}:`, error);
                    
                    // Volver a filtro "none" en caso de error
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    const noneButton = document.querySelector('[data-filter="none"]');
                    if (noneButton) {
                        noneButton.classList.add('active');
                    }
                    
                    // Mostrar notificación de error
                    this.showFilterError(filter, error);
                }
            });
        });
    }

    showFilterError(filterName, error) {
        console.error(`❌ Error en filtro ${filterName}:`, error);
        
        const notification = document.createElement('div');
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>Error al aplicar filtro "${filterName}"</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: #ffc107;
            color: #333;
            padding: 0.8rem 1.5rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            z-index: 3500;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        `;
        
        notification.querySelector('button').style.cssText = `
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            margin-left: auto;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 4000);
    }
}

// Inicialización automática de la aplicación
let photoBoothApp;

// Función de inicialización principal
function initPhotoBoothApp() {
    try {
        photoBoothApp = new PhotoBoothApp();
        console.log('🎊 PhotoBooth App creado exitosamente');
    } catch (error) {
        console.error('💥 Error crítico al crear PhotoBooth App:', error);
        
        // Mostrar error en la interfaz
        showInitializationError(error);
    }
}

function showInitializationError(error) {
    const errorContainer = document.querySelector('.main-content') || document.body;
    
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
            min-height: 50vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        ">
            <div style="
                background: white;
                border-radius: 20px;
                padding: 3rem;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 500px;
            ">
                <i class="fas fa-heart-crack" style="font-size: 4rem; color: #e91e63; margin-bottom: 2rem;"></i>
                <h2 style="color: #8b4b5a; margin-bottom: 1rem; font-family: 'Great Vibes', cursive; font-size: 2.5rem;">¡Ups!</h2>
                <p style="color: #666; margin-bottom: 2rem; line-height: 1.6;">
                    Algo salió mal al inicializar el photobooth. No te preocupes, podemos solucionarlo.
                </p>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button onclick="window.location.reload()" style="
                        background: linear-gradient(135deg, #e8b4a0 0%, #d4af37 100%);
                        color: white;
                        border: none;
                        padding: 1rem 2rem;
                        border-radius: 25px;
                        cursor: pointer;
                        font-size: 1rem;
                        font-weight: 600;
                    ">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                    <button onclick="runFilterDiagnostic()" style="
                        background: linear-gradient(135deg, #9caf88 0%, #8b4b5a 100%);
                        color: white;
                        border: none;
                        padding: 1rem 2rem;
                        border-radius: 25px;
                        cursor: pointer;
                        font-size: 1rem;
                        font-weight: 600;
                    ">
                        <i class="fas fa-stethoscope"></i> Diagnóstico
                    </button>
                </div>
                <p style="color: #999; font-size: 0.9rem; margin-top: 2rem;">
                    Error: ${error.message || 'Error desconocido'}
                </p>
            </div>
        </div>
    `;
    
    errorContainer.innerHTML = errorDiv.innerHTML;
}

// Múltiples puntos de inicialización para máxima compatibilidad
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhotoBoothApp);
} else {
    // DOM ya cargado
    setTimeout(initPhotoBoothApp, 100);
}

// Backup por si el evento DOMContentLoaded ya pasó
window.addEventListener('load', () => {
    if (!photoBoothApp && !window.cameraController) {
        console.log('🔄 Inicialización de respaldo activada...');
        setTimeout(initPhotoBoothApp, 500);
    }
});

// Funciones de utilidad globales
window.getPhotoBoothStatus = function() {
    if (photoBoothApp) {
        return photoBoothApp.getAppStatus();
    }
    return { error: 'PhotoBooth App no inicializado' };
};

window.repairPhotoBoothApp = async function() {
    console.log('🔧 Reparando PhotoBooth App...');
    
    if (photoBoothApp) {
        await photoBoothApp.repairFilters();
        photoBoothApp.setupEnhancedFilterButtons();
    } else {
        console.log('🔄 Reinicializando PhotoBooth App...');
        initPhotoBoothApp();
    }
};

window.createTestFilters = async function() {
    console.log('🎨 Creando filtros de prueba...');
    
    if (photoBoothApp) {
        await photoBoothApp.createFallbackFilters();
        return true;
    }
    
    console.warn('⚠️ PhotoBooth App no está disponible');
    return false;
};

window.debugPhotoBoothApp = function() {
    const status = window.getPhotoBoothStatus();
    console.log('📊 Estado de PhotoBooth App:', status);
    
    if (window.filterManager) {
        console.log('🎭 Debug FilterManager:', window.filterManager.getDebugInfo());
    }
    
    return status;
};

// Auto-ejecutar diagnóstico si hay problemas
setTimeout(() => {
    if (!photoBoothApp || !window.cameraController) {
        console.warn('⚠️ Posibles problemas de inicialización detectados');
        
        if (typeof window.runFilterDiagnostic === 'function') {
            window.runFilterDiagnostic().then(results => {
                const errors = results.filter(r => r.status === 'ERROR' || r.status === 'FAIL');
                if (errors.length > 0) {
                    console.warn(`⚠️ Se encontraron ${errors.length} problemas durante el diagnóstico`);
                }
            });
        }
    }
}, 3000);

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        PhotoBoothApp, 
        EnhancedCameraController,
        initPhotoBoothApp 
    };
}
