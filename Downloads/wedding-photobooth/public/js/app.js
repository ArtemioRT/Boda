// App.js - Aplicación principal mejorada
class PhotoBoothApp {
    constructor() {
        this.cameraController = null;
        this.filterManager = null;
        this.galleryController = null;
        this.currentTab = 'camera';
        
        this.init();
    }

    async init() {
        console.log('🎉 Iniciando PhotoBooth App...');
        
        // Esperar a que el DOM esté completamente cargado
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        try {
            // Inicializar componentes
            await this.initializeComponents();
            
            // Configurar eventos globales
            this.setupGlobalEvents();
            
            // Configurar navegación entre tabs
            this.setupTabNavigation();
            
            console.log('✅ PhotoBooth App inicializado exitosamente');
            
        } catch (error) {
            console.error('❌ Error al inicializar la aplicación:', error);
            this.showErrorMessage('Error al inicializar la aplicación');
        }
    }

    async initializeComponents() {
        // Inicializar controlador de cámara mejorado
        this.cameraController = new EnhancedCameraController();

        // Cargar y renderizar filtros dinámicos
        await this.loadFilters();
        
        // Inicializar manager de filtros
        this.filterManager = new FilterManager(this.cameraController);
        
        // Vincular filtros al controlador de cámara
        this.cameraController.setFilterManager(this.filterManager);

        // Configurar botones de filtro
        this.cameraController.setupFilterButtons();
        
        // Inicializar galería si existe
        if (typeof GalleryController !== 'undefined') {
            this.galleryController = new GalleryController();
            window.galleryController = this.galleryController;
        }
        
        // Hacer disponibles globalmente
        window.cameraController = this.cameraController;
        window.filterManager = this.filterManager;
    }

    setupGlobalEvents() {
        // Manejar errores globales
        window.addEventListener('error', (event) => {
            console.error('Error global:', event.error);
        });

        // Manejar promesas rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promesa rechazada:', event.reason);
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
                // Pausar funcionalidades cuando la página no es visible
                this.pauseApp();
            } else {
                // Reanudar cuando vuelve a ser visible
                this.resumeApp();
            }
        });
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
        } else if (targetTab === 'camera' && this.cameraController) {
            // Reactivar filtros si es necesario
            setTimeout(() => {
                if (this.filterManager && this.filterManager.currentFilter !== 'none') {
                    this.filterManager.repositionFilter();
                }
            }, 100);
        }
    }

    pauseApp() {
        console.log('⏸️ Pausando aplicación...');
        // Detener stream de video si está activo para ahorrar recursos
        if (this.cameraController && this.cameraController.stream) {
            // No detener completamente, solo pausar
            const videoTracks = this.cameraController.stream.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = false;
            });
        }
    }

    resumeApp() {
        console.log('▶️ Reanudando aplicación...');
        // Reactivar stream de video
        if (this.cameraController && this.cameraController.stream) {
            const videoTracks = this.cameraController.stream.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = true;
            });
            
            // Reposicionar filtros
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
        `;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 300);
        }, 5000);
    }

    // Método para obtener lista de filtros del servidor
    async fetchFilters() {
        try {
            const response = await fetch('/api/filters');
            if (!response.ok) throw new Error('Error al obtener filtros');
            return await response.json();
        } catch (err) {
            console.error('Error al obtener filtros:', err);
            return ['none'];
        }
    }

    // Método para cargar y renderizar botones de filtros dinámicamente
    async loadFilters() {
        const filters = await this.fetchFilters();
        const container = document.querySelector('.filter-buttons');
        if (!container) {
            console.error('Contenedor de filtros no encontrado');
            return;
        }
        // Botón para filtro natural
        container.innerHTML = '<button class="filter-btn active" data-filter="none"><i class="fas fa-camera"></i>Natural</button>';
        filters.forEach(name => {
            if (name === 'none') return;
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.setAttribute('data-filter', name);
            btn.innerHTML = `<i class="fas fa-frame"></i>${name.charAt(0).toUpperCase()+name.slice(1)}`;
            container.appendChild(btn);
        });
    }
}

// Enhanced Camera Controller que extiende el original
class EnhancedCameraController extends CameraController {
    constructor() {
        super();
        this.filterManager = null;
    }

    setFilterManager(filterManager) {
        this.filterManager = filterManager;
        console.log('🔗 FilterManager vinculado al CameraController');
    }

    // Override del método setupFilterButtons para usar FilterManager
    setupFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        console.log('🔘 Configurando botones de filtro mejorados:', filterButtons.length);
        
        filterButtons.forEach((button) => {
            button.addEventListener('click', async () => {
                const filter = button.getAttribute('data-filter');
                console.log('🖱️ Filtro seleccionado:', filter);
                
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
            });
        });
    }

    // Override del método capturePhoto para usar FilterManager
    async capturePhoto() {
        if (!this.stream) {
            alert('La cámara no está disponible');
            return;
        }

        try {
            // Configurar canvas
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

            // Dibujar el frame del video
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

            // Aplicar filtro usando FilterManager
            if (this.filterManager && this.filterManager.currentFilter !== 'none') {
                const filterImage = this.filterManager.getFilterForCapture();
                if (filterImage && filterImage.complete) {
                    console.log(`🖼️ Aplicando filtro en captura: ${this.filterManager.currentFilter}`);
                    this.ctx.drawImage(filterImage, 0, 0, this.canvas.width, this.canvas.height);
                }
            }

            // Finalizar captura
            this.capturedImageData = this.canvas.toDataURL('image/jpeg', 0.9);
            this.showPhotoPreview();
            
            console.log('✅ Foto capturada con filtros mejorados');

        } catch (error) {
            console.error('❌ Error al capturar foto:', error);
            alert('Error al capturar la foto. Inténtalo de nuevo.');
        }
    }

    // Método mejorado para mostrar/ocultar filtros
    showFilter() {
        if (this.filterManager) {
            // Usar FilterManager si está disponible
            return;
        }
        // Fallback al método original
        super.showFilter();
    }

    hideFilter() {
        if (this.filterManager) {
            // Usar FilterManager si está disponible
            return;
        }
        // Fallback al método original
        super.hideFilter();
    }
}

// Inicialización automática de la aplicación
let photoBoothApp;

// Función de inicialización
function initPhotoBoothApp() {
    try {
        photoBoothApp = new PhotoBoothApp();
        console.log('🎊 PhotoBooth App creado exitosamente');
    } catch (error) {
        console.error('💥 Error crítico al crear PhotoBooth App:', error);
        
        // Fallback - inicializar solo el controlador básico
        console.log('🔄 Intentando inicialización de respaldo...');
        try {
            window.cameraController = new CameraController();
            console.log('✅ Controlador básico inicializado como respaldo');
        } catch (fallbackError) {
            console.error('💀 Error crítico en inicialización de respaldo:', fallbackError);
        }
    }
}

// Múltiples puntos de inicialización para máxima compatibilidad
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhotoBoothApp);
} else {
    // DOM ya cargado
    initPhotoBoothApp();
}

// Backup por si el evento DOMContentLoaded ya pasó
window.addEventListener('load', () => {
    if (!photoBoothApp && !window.cameraController) {
        console.log('🔄 Inicialización de respaldo activada...');
        initPhotoBoothApp();
    }
});

// Debug y utilidades globales
window.debugPhotoBoothApp = function() {
    console.log('📊 Estado de PhotoBooth App:', {
        app: !!photoBoothApp,
        camera: !!window.cameraController,
        filters: !!window.filterManager,
        gallery: !!window.galleryController,
        currentTab: photoBoothApp?.currentTab,
        activeFilter: window.filterManager?.currentFilter || window.cameraController?.currentFilter
    });
};

// Comando para forzar reinicio de la aplicación
window.restartPhotoBoothApp = function() {
    console.log('🔄 Reiniciando PhotoBooth App...');
    
    // Limpiar instancias existentes
    if (window.cameraController && typeof window.cameraController.destroy === 'function') {
        window.cameraController.destroy();
    }
    
    if (window.filterManager && typeof window.filterManager.clearCache === 'function') {
        window.filterManager.clearCache();
    }
    
    // Reinicializar
    photoBoothApp = null;
    window.cameraController = null;
    window.filterManager = null;
    window.galleryController = null;
    
    setTimeout(initPhotoBoothApp, 500);
};

// Manejo mejorado de errores de filtros
window.handleFilterError = function(filterName, error) {
    console.error(`❌ Error en filtro ${filterName}:`, error);
    
    const notification = document.createElement('div');
    notification.className = 'filter-error-notification';
    notification.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>Error al cargar el filtro "${filterName}"</span>
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
};

// Función para crear filtros de demostración
window.createDemoFilters = function() {
    console.log('🎨 Creando filtros de demostración...');
    
    if (!window.filterManager) {
        console.warn('⚠️ FilterManager no disponible');
        return;
    }
    
    // Forzar generación de filtros demo
    const demoFilters = ['frame1', 'frame2'];
    demoFilters.forEach(filterName => {
        const filterData = window.filterManager.generateFilter(filterName);
        window.filterManager.filterCache.set(filterName, filterData);
        console.log(`✅ Filtro demo ${filterName} creado`);
    });
    
    alert('Filtros de demostración creados. Ahora puedes probar los filtros.');
};

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PhotoBoothApp, EnhancedCameraController };
}
