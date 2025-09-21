// App.js - Aplicación principal con diagnóstico integrado de filtros
class PhotoBoothApp {
    constructor() {
        this.cameraController = null;
        this.filterManager = null;
        this.galleryController = null;
        this.diagnostic = null;
        this.currentTab = 'camera';
        this.initializationAttempts = 0;
        this.maxInitializationAttempts = 3;
        
        this.init();
    }

    async init() {
        console.log('🎉 Iniciando PhotoBooth App...');
        this.initializationAttempts++;
        
        // Esperar a que el DOM esté completamente cargado
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        try {
            // Inicializar diagnóstico primero
            this.diagnostic = new FilterDiagnostic();
            
            // Ejecutar diagnóstico básico
            console.log('🔬 Ejecutando diagnóstico inicial...');
            await this.diagnostic.runFullDiagnostic();
            
            // Inicializar componentes
            await this.initializeComponents();
            
            // Configurar eventos globales
            this.setupGlobalEvents();
            
            // Configurar navegación entre tabs
            this.setupTabNavigation();
            
            // Configurar botones de filtro mejorados
            this.setupEnhancedFilterButtons();
            
            console.log('✅ PhotoBooth App inicializado exitosamente');
            
        } catch (error) {
            console.error('❌ Error al inicializar la aplicación:', error);
            await this.handleInitializationError(error);
        }
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
            
            // Crear filtros de demostración
            await this.createFallbackFilters();
            
            console.log('✅ Modo de respaldo inicializado');
            
        } catch (fallbackError) {
            console.error('💀 Error crítico en modo de respaldo:', fallbackError);
            this.showCriticalError();
        }
    }

    async initializeComponents() {
        console.log('🔧 Inicializando componentes...');

        // Inicializar controlador de cámara mejorado
        this.cameraController = new EnhancedCameraController();

        // Esperar a que la cámara esté lista
        await this.waitForCameraReady();
        
        // Inicializar manager de filtros
        this.filterManager = new FilterManager(this.cameraController);
        await this.filterManager.init();
        this.updateFilterButtons(this.filterManager.availableFilters);
        
        // Vincular filtros al controlador de cámara
        this.cameraController.setFilterManager(this.filterManager);
        
        // Inicializar galería si existe
        if (typeof GalleryController !== 'undefined') {
            this.galleryController = new GalleryController();
            window.galleryController = this.galleryController;
        }
        
        // Hacer disponibles globalmente
        window.cameraController = this.cameraController;
        window.filterManager = this.filterManager;
        window.diagnostic = this.diagnostic;
        
        console.log('✅ Componentes inicializados');
    }

    async waitForCameraReady() {
        const maxWait = 5000; // 5 segundos
        const checkInterval = 100; // Revisar cada 100ms
        let waited = 0;
        
        return new Promise((resolve, reject) => {
            const checkCamera = () => {
                if (this.cameraController.stream && this.cameraController.video.videoWidth > 0) {
                    console.log('📹 Cámara lista');
                    resolve();
                } else if (waited >= maxWait) {
                    console.warn('⏰ Timeout esperando cámara, continuando...');
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

        // Orientación de dispositivo
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (this.filterManager) {
                    this.filterManager.repositionFilter();
                }
            }, 500);
        });

        // Visibilidad de la página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseApp();
            } else {
                this.resumeApp();
            }
        });

        console.log('✅ Eventos globales configurados');
    }

    handleGlobalError(error) {
        // Si hay muchos errores de filtros, intentar recrearlos
        if (error.message && error.message.includes('filter')) {
            console.log('🔄 Error de filtro detectado, intentando reparación...');
            this.repairFilters();
        }
    }

    async repairFilters() {
        try {
            console.log('🔧 Reparando sistema de filtros...');
            
            if (this.filterManager) {
                await this.filterManager.regenerateFilters();
            } else {
                await this.createFallbackFilters();
            }
            
            console.log('✅ Sistema de filtros reparado');
        } catch (error) {
            console.error('❌ No se pudieron reparar los filtros:', error);
        }
    }

    async createFallbackFilters() {
        console.log('🎨 Creando filtros de respaldo...');
        
        const fallbackFilters = {
            'elegant': this.generateElegantFilter(),
            'romantic': this.generateRomanticFilter(),
            'vintage': this.generateVintageFilter()
        };
        
        // Si existe FilterManager, usar su caché
        if (this.filterManager) {
            Object.entries(fallbackFilters).forEach(([name, data]) => {
                this.filterManager.filterCache.set(name, data);
            });
        }
        
        // Actualizar botones
        this.updateFilterButtons(Object.keys(fallbackFilters));
        
        console.log('✅ Filtros de respaldo creados:', Object.keys(fallbackFilters));
    }

    generateElegantFilter() {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        
        // Marco dorado elegante
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#d4af37');
        gradient.addColorStop(0.5, '#ffd700');
        gradient.addColorStop(1, '#b8860b');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 20;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        
        ctx.strokeStyle = 'rgba(139, 75, 90, 0.8)';
        ctx.lineWidth = 6;
        ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);
        
        // Texto
        ctx.font = 'italic 24px serif';
        ctx.fillStyle = '#8b4b5a';
        ctx.textAlign = 'center';
        ctx.fillText('Elva & Samuel', canvas.width / 2, 50);
        
        return canvas.toDataURL('image/png');
    }

    generateRomanticFilter() {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        
        // Corazones en las esquinas
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = '#ff69b4';
        ctx.fillText('♥', 20, 50);
        ctx.fillText('♥', canvas.width - 60, 50);
        ctx.fillText('♥', 20, canvas.height - 10);
        ctx.fillText('♥', canvas.width - 60, canvas.height - 10);
        
        // Marco decorativo
        ctx.strokeStyle = '#c49b90';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(15, 60, canvas.width - 30, canvas.height - 120);
        
        // Texto
        ctx.setLineDash([]);
        ctx.font = 'bold 28px cursive';
        ctx.fillStyle = '#8b4b5a';
        ctx.textAlign = 'center';
        ctx.fillText('Amor Eterno', canvas.width / 2, 40);
        
        return canvas.toDataURL('image/png');
    }

    generateVintageFilter() {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        
        // Efecto sepia
        ctx.fillStyle = 'rgba(222, 184, 135, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Marco vintage
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 12;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        
        // Ornamentos
        ctx.fillStyle = '#654321';
        ctx.font = '20px serif';
        ctx.fillText('✧', 30, 40);
        ctx.fillText('✧', canvas.width - 50, 40);
        ctx.fillText('✧', 30, canvas.height - 20);
        ctx.fillText('✧', canvas.width - 50, canvas.height - 20);
        
        return canvas.toDataURL('image/png');
    }

    updateFilterButtons(filterNames) {
        const container = document.querySelector('.filter-buttons');
        if (!container) return;
        
        // Mantener botón "none"
        const existingNone = container.querySelector('[data-filter="none"]');
        container.innerHTML = '';
        
        if (existingNone) {
            container.appendChild(existingNone);
        } else {
            const noneBtn = document.createElement('button');
            noneBtn.className = 'filter-btn active';
            noneBtn.setAttribute('data-filter', 'none');
            noneBtn.innerHTML = '<i class="fas fa-camera"></i>Natural';
            container.appendChild(noneBtn);
        }
        
        // Agregar nuevos botones
        filterNames.forEach(name => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.setAttribute('data-filter', name);
            btn.innerHTML = `<i class="fas fa-frame"></i>${name.charAt(0).toUpperCase() + name.slice(1)}`;
            container.appendChild(btn);
        });
        
        // Reaplicar event listeners
        this.setupEnhancedFilterButtons();
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                this.switchTab(targetTab, tabButtons, tabContents);
                document.dispatchEvent(new CustomEvent('tabChanged', { detail: { tab: targetTab } }));
            });
        });
    }

    switchTab(targetTab, tabButtons, tabContents) {
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
            this.galleryController.loadPhotos();
        } else if (targetTab === 'camera' && this.filterManager) {
            setTimeout(() => {
                if (this.filterManager.currentFilter !== 'none') {
                    this.filterManager.repositionFilter();
                }
            }, 100);
        }
    }

    setupEnhancedFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        console.log('🔘 Configurando botones de filtro mejorados:', filterButtons.length);
        
        filterButtons.forEach((button) => {
            // Remover listeners existentes
            button.replaceWith(button.cloneNode(true));
        });
        
        // Reagregar listeners a los botones nuevos
        document.querySelectorAll('.filter-btn').forEach((button) => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const filter = button.getAttribute('data-filter');
                console.log('🖱️ Filtro seleccionado:', filter);
                
                try {
                    // Actualizar botones activos
                    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    
                    // Aplicar filtro
                    if (this.filterManager) {
                        await this.filterManager.applyFilter(filter);
                    } else if (this.cameraController) {
                        this.cameraController.applyFilter(filter);
                    }
                    
                    console.log(`✅ Filtro ${filter} aplicado`);
                    
                } catch (error) {
                    console.error(`❌ Error aplicando filtro ${filter}:`, error);
                    this.showErrorMessage(`Error al aplicar filtro: ${filter}`);
                    
                    // Volver al filtro "none" en caso de error
                    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                    document.querySelector('[data-filter="none"]')?.classList.add('active');
                }
            });
        });
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
            
            if (this.filterManager) {
                setTimeout(() => {
                    this.filterManager.repositionFilter();
                }, 300);
            }
        }
    }

    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer;">×</button>
        `;
        
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            z-index: 4000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
        `;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.style.animation = 'slideOutRight 0.3s ease-in forwards';
                setTimeout(() => {
                    if (errorDiv.parentNode) {
                        errorDiv.parentNode.removeChild(errorDiv);
                    }
                }, 300);
            }
        }, 10000);
    }

    showCriticalError() {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="background: #f8f9fa; border-radius: 15px; padding: 3rem; text-align: center; color: #495057; max-width: 500px; margin: 2rem auto;">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ffc107; margin-bottom: 2rem;"></i>
                <h2 style="margin-bottom: 1rem;">Error Crítico</h2>
                <p style="margin-bottom: 2rem;">No se pudo inicializar la aplicación correctamente. Esto puede deberse a:</p>
                <ul style="text-align: left; margin-bottom: 2rem;">
                    <li>Problemas de acceso a la cámara</li>
                    <li>Filtros no disponibles</li>
                    <li>Problemas de conectividad</li>
                </ul>
                <button onclick="window.location.reload()" style="background: #007bff; color: white; border: none; padding: 1rem 2rem; border-radius: 25px; cursor: pointer; font-size: 1.1rem;">
                    <i class="fas fa-redo"></i> Recargar Página
                </button>
            </div>
        `;
        
        // Insertar en el contenido principal
        const mainContent = document.querySelector('.main-content');
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
