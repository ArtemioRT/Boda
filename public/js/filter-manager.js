// Filter Manager - Manejo específico de filtros en tiempo real MEJORADO
class FilterManager {
    constructor(cameraController) {
        this.camera = cameraController;
        this.activeFilter = 'none';
        this.filterCache = new Map();
        this.overlayElement = null;
        this.imageElement = null;
        this.availableFilters = [];
        
        console.log('🎭 FilterManager inicializando...');
        this.init();
    }

    async init() {
        this.setupFilterElements();
        await this.loadAvailableFilters();
        this.setupVisibilityObserver();
        console.log('✅ FilterManager inicializado con', this.availableFilters.length, 'filtros');
    }

    setupFilterElements() {
        // Asegurar que los elementos de filtro existan
        this.overlayElement = document.getElementById('filter-overlay');
        this.imageElement = document.getElementById('filter-image');

        if (!this.overlayElement || !this.imageElement) {
            console.error('❌ Elementos de filtro no encontrados en el DOM');
            return;
        }

        // Configuración inicial de estilos
        this.applyInitialStyles();
        
        console.log('🖼️ Elementos de filtro configurados correctamente');
    }

    applyInitialStyles() {
        const cameraWrapper = document.querySelector('.camera-wrapper');
        
        if (cameraWrapper) {
            cameraWrapper.style.position = 'relative';
            cameraWrapper.style.overflow = 'hidden';
        }

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

    // Cargar lista de filtros disponibles desde el servidor
    async loadAvailableFilters() {
        try {
            console.log('📡 Cargando lista de filtros del servidor...');
            const response = await fetch('/api/filters');
            
            if (response.ok) {
                this.availableFilters = await response.json();
                console.log('✅ Filtros obtenidos del servidor:', this.availableFilters);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.warn('⚠️ No se pudo obtener filtros del servidor:', error.message);
            this.availableFilters = this.getDefaultFilters();
            console.log('📋 Usando filtros por defecto:', this.availableFilters);
        }

        // Precargar todos los filtros disponibles
        await this.preloadAllFilters();
    }

    getDefaultFilters() {
        // Lista de filtros por defecto si el servidor no responde
        return ['none', 'frame1', 'frame2', 'hearts', 'elegant'];
    }

    async preloadAllFilters() {
        console.log('⏳ Precargando todos los filtros...');
        
        const loadPromises = this.availableFilters
            .filter(name => name !== 'none')
            .map(name => this.preloadFilter(name));
            
        const results = await Promise.allSettled(loadPromises);
        
        let successful = 0;
        let failed = 0;
        
        results.forEach((result, index) => {
            const filterName = this.availableFilters.filter(n => n !== 'none')[index];
            if (result.status === 'fulfilled') {
                successful++;
                console.log(`✅ Filtro ${filterName} precargado`);
            } else {
                failed++;
                console.warn(`❌ Error precargando ${filterName}:`, result.reason);
            }
        });
        
        console.log(`📊 Precarga completada: ${successful} exitosos, ${failed} fallidos`);
    }

    async preloadFilter(filterName) {
        if (this.filterCache.has(filterName)) {
            return this.filterCache.get(filterName);
        }

        // Lista exhaustiva de rutas posibles
        const possiblePaths = [
            `filters/${filterName}.png`,
            `./filters/${filterName}.png`,
            `/filters/${filterName}.png`,
            `public/filters/${filterName}.png`,
            `./public/filters/${filterName}.png`,
            `/public/filters/${filterName}.png`,
            `images/filters/${filterName}.png`,
            `./images/filters/${filterName}.png`,
            `/images/filters/${filterName}.png`,
            `assets/filters/${filterName}.png`,
            `./assets/filters/${filterName}.png`,
            `/assets/filters/${filterName}.png`,
            `css/filters/${filterName}.png`,
            `./css/filters/${filterName}.png`,
            `/css/filters/${filterName}.png`
        ];

        console.log(`🔍 Buscando filtro ${filterName} en ${possiblePaths.length} ubicaciones...`);

        for (let i = 0; i < possiblePaths.length; i++) {
            const path = possiblePaths[i];
            try {
                console.log(`📂 Probando: ${path}`);
                const imageData = await this.loadImage(path);
                this.filterCache.set(filterName, imageData);
                console.log(`✅ Filtro ${filterName} encontrado en: ${path}`);
                return imageData;
            } catch (error) {
                console.log(`❌ No encontrado en: ${path}`);
                continue;
            }
        }

        // Si no se encontró en ninguna ruta, generar filtro
        console.log(`🎨 Generando filtro visual para: ${filterName}`);
        const generatedFilter = this.generateFilter(filterName);
        this.filterCache.set(filterName, generatedFilter);
        return generatedFilter;
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            const timeout = setTimeout(() => {
                reject(new Error('Timeout loading image'));
            }, 5000); // 5 segundos timeout
            
            img.onload = () => {
                clearTimeout(timeout);
                console.log(`🖼️ Imagen cargada exitosamente: ${src}`);
                resolve(src);
            };
            
            img.onerror = (error) => {
                clearTimeout(timeout);
                reject(new Error(`Failed to load ${src}: ${error.message || 'Unknown error'}`));
            };
            
            img.src = src;
        });
    }

    generateFilter(filterName) {
        console.log(`🎨 Generando filtro visual personalizado para: ${filterName}`);
        
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');

        // Limpiar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        switch (filterName.toLowerCase()) {
            case 'frame1':
            case 'elegant':
                this.drawElegantFrame(ctx, canvas.width, canvas.height);
                break;
            case 'frame2':
            case 'hearts':
                this.drawHeartsFrame(ctx, canvas.width, canvas.height);
                break;
            case 'romantic':
                this.drawRomanticFrame(ctx, canvas.width, canvas.height);
                break;
            case 'classic':
                this.drawClassicFrame(ctx, canvas.width, canvas.height);
                break;
            case 'vintage':
                this.drawVintageFrame(ctx, canvas.width, canvas.height);
                break;
            default:
                this.drawDefaultFrame(ctx, canvas.width, canvas.height, filterName);
        }

        return canvas.toDataURL('image/png');
    }

    drawElegantFrame(ctx, width, height) {
        // Marco dorado elegante
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#d4af37');
        gradient.addColorStop(0.5, '#ffd700');
        gradient.addColorStop(1, '#b8860b');

        // Marco exterior grueso
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 25;
        ctx.strokeRect(12, 12, width - 24, height - 24);

        // Marco interior delgado
        ctx.strokeStyle = 'rgba(139, 75, 90, 0.9)';
        ctx.lineWidth = 6;
        ctx.strokeRect(30, 30, width - 60, height - 60);

        // Decoraciones en las esquinas
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 28px serif';
        ctx.fillText('♦', 45, 55);
        ctx.fillText('♦', width - 70, 55);
        ctx.fillText('♦', 45, height - 20);
        ctx.fillText('♦', width - 70, height - 20);

        // Texto en la parte superior
        ctx.font = 'italic 20px serif';
        ctx.fillStyle = '#8b4b5a';
        ctx.textAlign = 'center';
        ctx.fillText('Elva & Samuel', width / 2, 55);
    }

    drawHeartsFrame(ctx, width, height) {
        // Fondo semi-transparente
        ctx.fillStyle = 'rgba(248, 231, 206, 0.3)';
        ctx.fillRect(0, 0, width, height);

        // Corazones grandes en las esquinas
        ctx.font = 'bold 45px Arial';
        ctx.fillStyle = '#ff69b4';
        ctx.fillText('♥', 25, 55);
        ctx.fillText('♥', width - 70, 55);
        ctx.fillText('♥', 25, height - 15);
        ctx.fillText('♥', width - 70, height - 15);

        // Corazones pequeños decorativos
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = 'rgba(255, 105, 180, 0.7)';
        for (let i = 100; i < width - 100; i += 80) {
            ctx.fillText('♥', i, 35);
            ctx.fillText('♥', i, height - 10);
        }

        // Marco con línea punteada
        ctx.strokeStyle = '#c49b90';
        ctx.lineWidth = 4;
        ctx.setLineDash([15, 10]);
        ctx.strokeRect(20, 70, width - 40, height - 140);

        // Texto principal
        ctx.setLineDash([]);
        ctx.font = 'bold 28px cursive';
        ctx.fillStyle = '#8b4b5a';
        ctx.textAlign = 'center';
        ctx.fillText('Nuestro Amor', width / 2, 50);
    }

    drawRomanticFrame(ctx, width, height) {
        // Gradiente de fondo
        const bgGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
        bgGradient.addColorStop(0, 'rgba(247, 231, 206, 0.1)');
        bgGradient.addColorStop(1, 'rgba(196, 155, 144, 0.3)');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Marco ornamentado
        ctx.strokeStyle = '#c49b90';
        ctx.lineWidth = 8;
        ctx.strokeRect(15, 15, width - 30, height - 30);

        // Ornamentos florales (simulados)
        ctx.fillStyle = '#d4af37';
        ctx.font = '24px serif';
        ctx.fillText('❀', 30, 40);
        ctx.fillText('❀', width - 50, 40);
        ctx.fillText('❀', 30, height - 20);
        ctx.fillText('❀', width - 50, height - 20);

        // Texto romántico
        ctx.font = '26px cursive';
        ctx.fillStyle = '#722f37';
        ctx.textAlign = 'center';
        ctx.fillText('Para Siempre', width / 2, 45);
    }

    drawClassicFrame(ctx, width, height) {
        // Marco clásico simple
        ctx.strokeStyle = '#8b4b5a';
        ctx.lineWidth = 20;
        ctx.strokeRect(10, 10, width - 20, height - 20);

        // Marco interno
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.strokeRect(25, 25, width - 50, height - 50);

        // Esquinas decorativas
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(20, 20, 15, 15);
        ctx.fillRect(width - 35, 20, 15, 15);
        ctx.fillRect(20, height - 35, 15, 15);
        ctx.fillRect(width - 35, height - 35, 15, 15);
    }

    drawVintageFrame(ctx, width, height) {
        // Efecto vintage con sepia
        ctx.fillStyle = 'rgba(222, 184, 135, 0.2)';
        ctx.fillRect(0, 0, width, height);

        // Marco vintage
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 15;
        ctx.strokeRect(10, 10, width - 20, height - 20);

        // Ornamentos vintage
        ctx.fillStyle = '#654321';
        ctx.font = '20px serif';
        ctx.fillText('✧', 35, 45);
        ctx.fillText('✧', width - 55, 45);
        ctx.fillText('✧', 35, height - 25);
        ctx.fillText('✧', width - 55, height - 25);

        // Texto vintage
        ctx.font = '22px serif';
        ctx.fillStyle = '#654321';
        ctx.textAlign = 'center';
        ctx.fillText('Vintage Love', width / 2, 45);
    }

    drawDefaultFrame(ctx, width, height, filterName) {
        // Marco por defecto personalizable
        ctx.strokeStyle = '#c49b90';
        ctx.lineWidth = 12;
        ctx.strokeRect(10, 10, width - 20, height - 20);

        // Texto con el nombre del filtro
        ctx.font = '24px Arial';
        ctx.fillStyle = '#8b4b5a';
        ctx.textAlign = 'center';
        ctx.fillText(filterName.toUpperCase(), width / 2, 40);
    }

    async applyFilter(filterName) {
        console.log(`🎭 Aplicando filtro: ${filterName}`);
        
        this.activeFilter = filterName;

        if (filterName === 'none') {
            this.hideFilter();
            return;
        }

        // Obtener filtro del caché o cargar
        let filterData = this.filterCache.get(filterName);
        
        if (!filterData) {
            console.log(`⏳ Filtro ${filterName} no está en caché, cargando...`);
            try {
                filterData = await this.preloadFilter(filterName);
            } catch (error) {
                console.error(`❌ Error cargando filtro ${filterName}:`, error);
                // Usar filtro por defecto
                filterData = this.generateFilter(filterName);
                this.filterCache.set(filterName, filterData);
            }
        }

        this.showFilter(filterData);
    }

    showFilter(filterData) {
        if (!this.overlayElement || !this.imageElement) {
            console.error('❌ Elementos de filtro no disponibles');
            return;
        }

        console.log('👁️ Mostrando filtro...');

        // Asignar datos del filtro
        this.imageElement.src = filterData;

        // Mostrar elementos
        this.overlayElement.style.display = 'block';
        this.imageElement.style.display = 'block';

        // Agregar clase CSS para estilos adicionales
        const cameraWrapper = document.querySelector('.camera-wrapper');
        if (cameraWrapper) {
            cameraWrapper.classList.add('filter-active');
        }

        // Verificar que se muestre correctamente
        this.verifyFilterDisplay();

        console.log('✅ Filtro mostrado exitosamente');
    }

    hideFilter() {
        console.log('🙈 Ocultando filtro...');

        if (this.overlayElement) {
            this.overlayElement.style.display = 'none';
        }

        if (this.imageElement) {
            this.imageElement.style.display = 'none';
            this.imageElement.src = ''; // Limpiar src
        }

        // Remover clase CSS
        const cameraWrapper = document.querySelector('.camera-wrapper');
        if (cameraWrapper) {
            cameraWrapper.classList.remove('filter-active');
        }

        console.log('✅ Filtro ocultado');
    }

    verifyFilterDisplay() {
        setTimeout(() => {
            if (!this.overlayElement || !this.imageElement) return;

            const overlayDisplay = window.getComputedStyle(this.overlayElement).display;
            const imageDisplay = window.getComputedStyle(this.imageElement).display;
            
            console.log('🔍 Verificación de filtro:', {
                activeFilter: this.activeFilter,
                overlayDisplay,
                imageDisplay,
                imageSrc: this.imageElement.src ? '✅ Tiene fuente' : '❌ Sin fuente',
                inCache: this.filterCache.has(this.activeFilter) ? '✅ En caché' : '❌ No en caché'
            });

            // Si no se está mostrando correctamente, intentar de nuevo
            if (this.activeFilter !== 'none' && overlayDisplay === 'none') {
                console.warn('⚠️ Filtro no se está mostrando, reintentando...');
                this.repositionFilter();
            }
        }, 200);
    }

    setupVisibilityObserver() {
        if (this.camera && this.camera.video) {
            const resizeObserver = new ResizeObserver(() => {
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

        // Reaplicar estilos
        this.applyInitialStyles();
        
        // Re-mostrar si está activo
        if (this.activeFilter !== 'none') {
            this.overlayElement.style.display = 'block';
            this.imageElement.style.display = 'block';
        }

        console.log('✅ Filtro reposicionado');
    }

    // Obtener imagen del filtro para captura
    getFilterForCapture() {
        if (this.activeFilter === 'none') {
            return null;
        }

        // Si tenemos la imagen cargada, devolverla
        if (this.imageElement && this.imageElement.complete && this.imageElement.src) {
            return this.imageElement;
        }

        // Si no, crear una imagen temporal desde el caché
        const filterData = this.filterCache.get(this.activeFilter);
        if (filterData) {
            const img = new Image();
            img.src = filterData;
            return img;
        }

        return null;
    }

    // Getter para filtro actual
    get currentFilter() {
        return this.activeFilter;
    }

    // Limpiar caché
    clearCache() {
        this.filterCache.clear();
        console.log('🧹 Caché de filtros limpiado');
    }

    // Obtener información de depuración
    getDebugInfo() {
        return {
            activeFilter: this.activeFilter,
            availableFilters: this.availableFilters,
            cachedFilters: Array.from(this.filterCache.keys()),
            overlayVisible: this.overlayElement?.style.display !== 'none',
            imageLoaded: this.imageElement?.complete && this.imageElement?.src
        };
    }

    // Método para probar filtros manualmente
    async testFilter(filterName) {
        console.log(`🧪 Probando filtro: ${filterName}`);
        try {
            await this.applyFilter(filterName);
            console.log(`✅ Test exitoso para: ${filterName}`);
        } catch (error) {
            console.error(`❌ Test fallido para ${filterName}:`, error);
        }
    }

    // Método para regenerar todos los filtros
    async regenerateFilters() {
        console.log('🔄 Regenerando todos los filtros...');
        this.clearCache();
        await this.preloadAllFilters();
        console.log('✅ Filtros regenerados');
    }
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.FilterManager = FilterManager;
}