// Filter Manager - Manejo específico de filtros en tiempo real
class FilterManager {
    constructor(cameraController) {
        this.camera = cameraController;
        this.activeFilter = 'none';
        this.filterCache = new Map();
        this.overlayElement = null;
        this.imageElement = null;
        
        // init() will be called explicitly after instantiation
    }

    async init() {
        this.setupFilterElements();
        await this.loadFilters();
        this.setupVisibilityObserver();
    }

    setupFilterElements() {
        // Asegurar que los elementos de filtro existan
        this.overlayElement = document.getElementById('filter-overlay');
        this.imageElement = document.getElementById('filter-image');

        if (!this.overlayElement || !this.imageElement) {
            console.error('❌ Elementos de filtro no encontrados');
            return;
        }

        // Eliminar estilos inline para no bloquear CSS dinámico
        this.overlayElement.removeAttribute('style');
        this.imageElement.removeAttribute('style');

        // Configuración inicial de estilos
        this.applyInitialStyles();
        
        console.log('✅ FilterManager inicializado');
    }

    applyInitialStyles() {
        const cameraWrapper = document.querySelector('.camera-wrapper');
        
        if (cameraWrapper) {
            // Asegurar posicionamiento relativo del contenedor
            cameraWrapper.style.position = 'relative';
            cameraWrapper.style.overflow = 'hidden';
        }

        // Estilos del overlay
        if (this.overlayElement) {
            Object.assign(this.overlayElement.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: '5',
                display: 'none'
            });
        }

        // Estilos de la imagen
        if (this.imageElement) {
            Object.assign(this.imageElement.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'none',
                pointerEvents: 'none',
                opacity: '1',
                zIndex: '6'
            });
        }
    }

    preloadDefaultFilters() {
        const defaultFilters = [
            { name: 'frame1', paths: ['/filters/frame1.png', 'filters/frame1.png', './filters/frame1.png'] },
            { name: 'frame2', paths: ['/filters/frame2.png', 'filters/frame2.png', './filters/frame2.png'] }
        ];

        defaultFilters.forEach(filter => {
            this.preloadFilter(filter.name, filter.paths);
        });
    }

    async preloadFilter(filterName, possiblePaths) {
        if (this.filterCache.has(filterName)) {
            return this.filterCache.get(filterName);
        }

        for (const path of possiblePaths) {
            try {
                const imageData = await this.loadImage(path);
                this.filterCache.set(filterName, imageData);
                console.log(`✅ Filtro ${filterName} precargado desde ${path}`);
                return imageData;
            } catch (error) {
                console.warn(`⚠️ No se pudo cargar ${filterName} desde ${path}`);
                continue;
            }
        }

        // Si no se encontró, crear filtro generado
        const generatedFilter = this.generateFilter(filterName);
        this.filterCache.set(filterName, generatedFilter);
        return generatedFilter;
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                resolve(src);
            };
            
            img.onerror = () => {
                reject(new Error(`Failed to load ${src}`));
            };
            
            img.src = src;
        });
    }

    generateFilter(filterName) {
        console.log(`🎨 Generando filtro visual para: ${filterName}`);
        
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');

        // Fondo transparente
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        switch (filterName) {
            case 'frame1':
                this.drawFrame1(ctx, canvas.width, canvas.height);
                break;
            case 'frame2':
                this.drawFrame2(ctx, canvas.width, canvas.height);
                break;
            default:
                this.drawDefaultFrame(ctx, canvas.width, canvas.height);
        }

        return canvas.toDataURL('image/png');
    }

    drawFrame1(ctx, width, height) {
        // Marco dorado elegante
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#d4af37');
        gradient.addColorStop(0.5, '#ffd700');
        gradient.addColorStop(1, '#b8860b');

        // Marco exterior
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 20;
        ctx.strokeRect(10, 10, width - 20, height - 20);

        // Marco interior
        ctx.strokeStyle = 'rgba(139, 75, 90, 0.8)';
        ctx.lineWidth = 8;
        ctx.strokeRect(25, 25, width - 50, height - 50);

        // Decoraciones en las esquinas
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 24px serif';
        ctx.fillText('♦', 35, 45);
        ctx.fillText('♦', width - 55, 45);
        ctx.fillText('♦', 35, height - 20);
        ctx.fillText('♦', width - 55, height - 20);
    }

    drawFrame2(ctx, width, height) {
        // Marco con corazones romántico
        ctx.fillStyle = 'rgba(196, 155, 144, 0.9)';
        
        // Corazones en las esquinas
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = '#ff69b4';
        ctx.fillText('♥', 20, 50);
        ctx.fillText('♥', width - 60, 50);
        ctx.fillText('♥', 20, height - 10);
        ctx.fillText('♥', width - 60, height - 10);

        // Texto decorativo en la parte superior
        ctx.font = '28px Dancing Script, cursive';
        ctx.fillStyle = '#8b4b5a';
        ctx.textAlign = 'center';
        ctx.fillText('Elva & Samuel', width / 2, 35);

        // Bordes decorativos
        ctx.strokeStyle = 'rgba(196, 155, 144, 0.6)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(15, 60, width - 30, height - 120);
    }

    drawDefaultFrame(ctx, width, height) {
        // Marco simple
        ctx.strokeStyle = 'rgba(196, 155, 144, 0.8)';
        ctx.lineWidth = 15;
        ctx.strokeRect(10, 10, width - 20, height - 20);
    }

    async applyFilter(filterName) {
        console.log(`🎭 Aplicando filtro: ${filterName}`);
        
        this.activeFilter = filterName;

        if (filterName === 'none') {
            this.hideFilter();
            return;
        }

        // Obtener o cargar el filtro
        let filterData = this.filterCache.get(filterName);
        
        if (!filterData) {
            const possiblePaths = [
                `/filters/${filterName}.png`,
                `filters/${filterName}.png`,
                `./filters/${filterName}.png`,
                `images/filters/${filterName}.png`,
                `assets/filters/${filterName}.png`
            ];
            
            filterData = await this.preloadFilter(filterName, possiblePaths);
        }

        // Aplicar el filtro
        this.showFilter(filterData);
    }

    showFilter(filterData) {
        if (!this.overlayElement || !this.imageElement) {
            console.error('❌ Elementos de filtro no disponibles');
            return;
        }

        console.log('👁️ Mostrando filtro en tiempo real...');

        // Asignar la imagen del filtro
        this.imageElement.src = filterData;

        // Mostrar el overlay y la imagen
        this.overlayElement.style.display = 'block';
        this.imageElement.style.display = 'block';

        // Agregar clase al contenedor para CSS
        const cameraWrapper = document.querySelector('.camera-wrapper');
        if (cameraWrapper) {
            cameraWrapper.classList.add('filter-active');
        }

        // Verificar que se esté mostrando
        this.verifyFilterVisibility();

        console.log('✅ Filtro mostrado exitosamente');
    }

    hideFilter() {
        console.log('👁️‍🗨️ Ocultando filtro...');

        if (this.overlayElement) {
            this.overlayElement.style.display = 'none';
        }

        if (this.imageElement) {
            this.imageElement.style.display = 'none';
        }

        // Remover clase del contenedor
        const cameraWrapper = document.querySelector('.camera-wrapper');
        if (cameraWrapper) {
            cameraWrapper.classList.remove('filter-active');
        }

        console.log('✅ Filtro ocultado');
    }

    // Obtener lista de filtros desde servidor
    async fetchFilterList() {
        try {
            const res = await fetch('/api/filters');
            if (!res.ok) throw new Error('Error al obtener lista de filtros');
            return await res.json();
        } catch (err) {
            console.error('Error al obtener lista de filtros:', err);
            return [];
        }
    }

    // Cargar y precargar filtros dinámicamente
    async loadFilters() {
        const filters = await this.fetchFilterList();
        filters.forEach(name => {
            if (name === 'none') return;
            this.preloadFilter(name, [`/filters/${name}.png`]);
        });
    }

    verifyFilterVisibility() {
        setTimeout(() => {
            const overlayComputed = window.getComputedStyle(this.overlayElement);
            const imageComputed = window.getComputedStyle(this.imageElement);
            
            console.log('🔍 Verificación de visibilidad:', {
                overlayDisplay: overlayComputed.display,
                overlayZIndex: overlayComputed.zIndex,
                imageDisplay: imageComputed.display,
                imageOpacity: imageComputed.opacity,
                activeFilter: this.activeFilter,
                imageSrc: this.imageElement.src ? 'Cargada' : 'Sin fuente'
            });

            // Debug visual - agregar borde temporal para verificar posición
            if (this.overlayElement.style.display === 'block') {
                this.overlayElement.style.border = '2px solid red';
                setTimeout(() => {
                    this.overlayElement.style.border = 'none';
                }, 1000);
            }
        }, 100);
    }

    setupVisibilityObserver() {
        // Observar cambios en el video para reposicionar filtros
        if (this.camera && this.camera.video) {
            const resizeObserver = new ResizeObserver(entries => {
                if (this.activeFilter !== 'none') {
                    this.repositionFilter();
                }
            });
            
            resizeObserver.observe(this.camera.video);
        }
    }

    repositionFilter() {
        if (!this.overlayElement || !this.imageElement || this.activeFilter === 'none') {
            return;
        }

        console.log('📐 Reposicionando filtro...');

        // Forzar estilos
        this.applyInitialStyles();
        
        // Re-mostrar si está activo
        if (this.activeFilter !== 'none') {
            this.overlayElement.style.display = 'block';
            this.imageElement.style.display = 'block';
        }
    }

    // Método para obtener la imagen del filtro para captura
    getFilterForCapture() {
        if (this.activeFilter === 'none' || !this.imageElement || !this.imageElement.complete) {
            return null;
        }
        return this.imageElement;
    }

    // Método para limpiar caché
    clearCache() {
        this.filterCache.clear();
        console.log('🧹 Caché de filtros limpiado');
    }

    // Getter para el filtro activo
    get currentFilter() {
        return this.activeFilter;
    }
}

// Integración con el CameraController existente
if (typeof window !== 'undefined') {
    window.FilterManager = FilterManager;
}
