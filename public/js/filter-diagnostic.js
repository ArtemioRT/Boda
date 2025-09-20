// Herramienta de diagnóstico para problemas de filtros
class FilterDiagnostic {
    constructor() {
        this.results = [];
        this.possiblePaths = [
            'filters/',
            './filters/',
            '/filters/',
            'public/filters/',
            './public/filters/',
            '/public/filters/',
            'images/filters/',
            './images/filters/',
            '/images/filters/',
            'assets/filters/',
            './assets/filters/',
            '/assets/filters/',
            'css/filters/',
            './css/filters/',
            '/css/filters/'
        ];
        this.filterNames = ['frame1', 'frame2', 'hearts', 'elegant', 'romantic', 'vintage'];
        this.extensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
    }

    async runFullDiagnostic() {
        console.log('🔬 Iniciando diagnóstico completo de filtros...');
        
        this.results = [];
        
        // 1. Verificar estructura DOM
        await this.checkDOMElements();
        
        // 2. Verificar rutas del servidor
        await this.checkServerPaths();
        
        // 3. Probar cargar filtros desde diferentes rutas
        await this.testFilterPaths();
        
        // 4. Verificar archivos físicos
        await this.checkPhysicalFiles();
        
        // 5. Generar reporte
        this.generateReport();
        
        return this.results;
    }

    checkDOMElements() {
        console.log('🔍 Verificando elementos DOM...');
        
        const elements = {
            video: document.getElementById('video'),
            canvas: document.getElementById('canvas'),
            filterOverlay: document.getElementById('filter-overlay'),
            filterImage: document.getElementById('filter-image'),
            cameraWrapper: document.querySelector('.camera-wrapper'),
            filterButtons: document.querySelectorAll('.filter-btn')
        };
        
        Object.entries(elements).forEach(([name, element]) => {
            const exists = !!element;
            this.results.push({
                test: `DOM Element: ${name}`,
                status: exists ? 'PASS' : 'FAIL',
                details: exists ? 'Elemento encontrado' : 'Elemento no encontrado',
                element: element
            });
            
            if (exists && element.style) {
                this.results.push({
                    test: `${name} styles`,
                    status: 'INFO',
                    details: `Position: ${element.style.position || 'default'}, Display: ${element.style.display || 'default'}`,
                    styles: window.getComputedStyle(element)
                });
            }
        });
    }

    async checkServerPaths() {
        console.log('🌐 Verificando rutas del servidor...');
        
        const serverEndpoints = [
            '/api/filters',
            '/api/photos',
            '/filters/',
            '/public/filters/'
        ];
        
        for (const endpoint of serverEndpoints) {
            try {
                const response = await fetch(endpoint);
                this.results.push({
                    test: `Server endpoint: ${endpoint}`,
                    status: response.ok ? 'PASS' : 'FAIL',
                    details: `HTTP ${response.status} ${response.statusText}`,
                    response: response
                });
            } catch (error) {
                this.results.push({
                    test: `Server endpoint: ${endpoint}`,
                    status: 'ERROR',
                    details: error.message,
                    error: error
                });
            }
        }
    }

    async testFilterPaths() {
        console.log('🗂️ Probando rutas de filtros...');
        
        for (const filterName of this.filterNames) {
            for (const basePath of this.possiblePaths) {
                for (const extension of this.extensions) {
                    const fullPath = `${basePath}${filterName}${extension}`;
                    
                    try {
                        const success = await this.testImagePath(fullPath);
                        this.results.push({
                            test: `Filter path test: ${fullPath}`,
                            status: success ? 'PASS' : 'FAIL',
                            details: success ? 'Imagen cargada exitosamente' : 'No se pudo cargar la imagen',
                            path: fullPath,
                            filter: filterName
                        });
                        
                        if (success) {
                            console.log(`✅ Filtro encontrado: ${fullPath}`);
                        }
                    } catch (error) {
                        this.results.push({
                            test: `Filter path test: ${fullPath}`,
                            status: 'ERROR',
                            details: error.message,
                            path: fullPath,
                            filter: filterName,
                            error: error
                        });
                    }
                }
            }
        }
    }

    testImagePath(path) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            const timeout = setTimeout(() => {
                resolve(false);
            }, 3000);
            
            img.onload = () => {
                clearTimeout(timeout);
                resolve(true);
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                resolve(false);
            };
            
            img.src = path;
        });
    }

    async checkPhysicalFiles() {
        console.log('📁 Verificando archivos físicos...');
        
        // Intentar hacer fetch directo a archivos comunes
        const commonPaths = [
            'filters/frame1.png',
            'filters/frame2.png',
            './filters/frame1.png',
            './filters/frame2.png',
            '/filters/frame1.png',
            '/filters/frame2.png'
        ];
        
        for (const path of commonPaths) {
            try {
                const response = await fetch(path, { method: 'HEAD' });
                this.results.push({
                    test: `Physical file check: ${path}`,
                    status: response.ok ? 'PASS' : 'FAIL',
                    details: `HTTP ${response.status} - ${response.ok ? 'Archivo existe' : 'Archivo no encontrado'}`,
                    path: path,
                    headers: Object.fromEntries(response.headers.entries())
                });
            } catch (error) {
                this.results.push({
                    test: `Physical file check: ${path}`,
                    status: 'ERROR',
                    details: error.message,
                    path: path,
                    error: error
                });
            }
        }
    }

    generateReport() {
        console.log('\n📋 REPORTE DE DIAGNÓSTICO DE FILTROS');
        console.log('=====================================');
        
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const errors = this.results.filter(r => r.status === 'ERROR').length;
        const info = this.results.filter(r => r.status === 'INFO').length;
        
        console.log(`✅ Pasaron: ${passed}`);
        console.log(`❌ Fallaron: ${failed}`);
        console.log(`🔴 Errores: ${errors}`);
        console.log(`ℹ️ Info: ${info}`);
        console.log('\n📊 DETALLES:');
        
        this.results.forEach((result, index) => {
            const icon = {
                'PASS': '✅',
                'FAIL': '❌',
                'ERROR': '🔴',
                'INFO': 'ℹ️'
            }[result.status] || '❓';
            
            console.log(`${icon} ${result.test}: ${result.details}`);
        });
        
        // Generar recomendaciones
        this.generateRecommendations();
    }

    generateRecommendations() {
        console.log('\n💡 RECOMENDACIONES:');
        console.log('==================');
        
        const workingPaths = this.results
            .filter(r => r.status === 'PASS' && r.test.includes('Filter path test'))
            .map(r => r.path);
            
        if (workingPaths.length > 0) {
            console.log('✅ Rutas que funcionan:');
            workingPaths.forEach(path => console.log(`   - ${path}`));
        } else {
            console.log('❌ No se encontraron rutas funcionales para filtros.');
            console.log('💡 Sugerencias:');
            console.log('   1. Verificar que la carpeta "filters" existe');
            console.log('   2. Verificar que los archivos PNG están en la carpeta');
            console.log('   3. Verificar permisos de lectura');
            console.log('   4. Verificar configuración del servidor web');
        }
        
        const domIssues = this.results
            .filter(r => r.status === 'FAIL' && r.test.includes('DOM Element'));
            
        if (domIssues.length > 0) {
            console.log('\n⚠️ Problemas de DOM encontrados:');
            domIssues.forEach(issue => console.log(`   - ${issue.test}`));
        }
        
        const serverIssues = this.results
            .filter(r => r.status !== 'PASS' && r.test.includes('Server endpoint'));
            
        if (serverIssues.length > 0) {
            console.log('\n🌐 Problemas de servidor encontrados:');
            serverIssues.forEach(issue => console.log(`   - ${issue.test}: ${issue.details}`));
        }
    }

    // Método para crear filtros de prueba
    async createTestFilters() {
        console.log('🎨 Creando filtros de prueba...');
        
        const testFilters = ['test1', 'test2'];
        const createdFilters = {};
        
        for (const filterName of testFilters) {
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            
            // Crear filtro de prueba simple
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 10;
            ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`FILTRO ${filterName.toUpperCase()}`, canvas.width / 2, canvas.height / 2);
            
            createdFilters[filterName] = canvas.toDataURL('image/png');
        }
        
        console.log('✅ Filtros de prueba creados:', Object.keys(createdFilters));
        return createdFilters;
    }

    // Método para probar el sistema completo
    async testCompleteSystem() {
        console.log('🔧 Probando sistema completo...');
        
        // 1. Crear filtros de prueba
        const testFilters = await this.createTestFilters();
        
        // 2. Intentar aplicar filtros al sistema
        if (window.filterManager) {
            for (const [name, data] of Object.entries(testFilters)) {
                window.filterManager.filterCache.set(name, data);
                await window.filterManager.applyFilter(name);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
                console.log(`✅ Filtro ${name} aplicado exitosamente`);
            }
        } else {
            console.log('⚠️ FilterManager no disponible');
        }
        
        // 3. Volver a filtro none
        if (window.filterManager) {
            await window.filterManager.applyFilter('none');
        }
        
        console.log('✅ Test del sistema completo finalizado');
    }
}

// Función helper para ejecutar diagnóstico rápido
window.runFilterDiagnostic = async function() {
    const diagnostic = new FilterDiagnostic();
    await diagnostic.runFullDiagnostic();
    return diagnostic.results;
};

// Función para crear y probar filtros de demostración
window.createDemoFilters = async function() {
    const diagnostic = new FilterDiagnostic();
    const testFilters = await diagnostic.createTestFilters();
    
    if (window.filterManager) {
        for (const [name, data] of Object.entries(testFilters)) {
            window.filterManager.filterCache.set(name, data);
        }
        console.log('✅ Filtros demo agregados al FilterManager');
        
        // Regenerar botones de filtro
        if (typeof regenerateFilterButtons === 'function') {
            regenerateFilterButtons();
        }
    } else {
        console.log('⚠️ FilterManager no disponible');
    }
    
    return testFilters;
};

// Función para probar un filtro específico
window.testSpecificFilter = async function(filterName) {
    if (!window.filterManager) {
        console.log('❌ FilterManager no disponible');
        return;
    }
    
    console.log(`🧪 Probando filtro específico: ${filterName}`);
    
    try {
        await window.filterManager.applyFilter(filterName);
        console.log(`✅ Filtro ${filterName} aplicado exitosamente`);
        
        // Mostrar información del filtro
        setTimeout(() => {
            const debugInfo = window.filterManager.getDebugInfo();
            console.log('📊 Estado actual:', debugInfo);
        }, 500);
        
    } catch (error) {
        console.error(`❌ Error aplicando filtro ${filterName}:`, error);
    }
};

// Función para regenerar botones de filtro dinámicamente
window.regenerateFilterButtons = function() {
    const container = document.querySelector('.filter-buttons');
    if (!container) {
        console.log('❌ Contenedor de botones no encontrado');
        return;
    }
    
    // Limpiar botones existentes
    container.innerHTML = '';
    
    // Botón "none" siempre presente
    const noneBtn = document.createElement('button');
    noneBtn.className = 'filter-btn active';
    noneBtn.setAttribute('data-filter', 'none');
    noneBtn.innerHTML = '<i class="fas fa-camera"></i>Natural';
    container.appendChild(noneBtn);
    
    // Agregar botones para filtros en caché
    if (window.filterManager && window.filterManager.filterCache) {
        window.filterManager.filterCache.forEach((data, name) => {
            if (name === 'none') return;
            
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.setAttribute('data-filter', name);
            btn.innerHTML = `<i class="fas fa-frame"></i>${name.charAt(0).toUpperCase() + name.slice(1)}`;
            container.appendChild(btn);
        });
    }
    
    // Reagregar event listeners
    if (window.cameraController && typeof window.cameraController.setupFilterButtons === 'function') {
        window.cameraController.setupFilterButtons();
    }
    
    console.log('✅ Botones de filtro regenerados');
};

// Función de ayuda para mostrar información del sistema
window.showFilterSystemInfo = function() {
    console.log('\n🔍 INFORMACIÓN DEL SISTEMA DE FILTROS');
    console.log('=====================================');
    
    console.log('📱 Componentes disponibles:');
    console.log('- CameraController:', !!window.cameraController);
    console.log('- FilterManager:', !!window.filterManager);
    console.log('- GalleryController:', !!window.galleryController);
    
    if (window.filterManager) {
        const debugInfo = window.filterManager.getDebugInfo();
        console.log('\n📊 Estado del FilterManager:');
        Object.entries(debugInfo).forEach(([key, value]) => {
            console.log(`- ${key}:`, value);
        });
    }
    
    console.log('\n🛠️ Comandos disponibles:');
    console.log('- runFilterDiagnostic() - Ejecutar diagnóstico completo');
    console.log('- createDemoFilters() - Crear filtros de demostración');
    console.log('- testSpecificFilter(name) - Probar un filtro específico');
    console.log('- regenerateFilterButtons() - Regenerar botones de filtro');
    console.log('- showFilterSystemInfo() - Mostrar esta información');
};

// Auto-ejecutar diagnóstico básico al cargar
if (typeof window !== 'undefined') {
    window.FilterDiagnostic = FilterDiagnostic;
    
    // Ejecutar diagnóstico básico después de que se cargue todo
    setTimeout(async () => {
        if (document.readyState === 'complete') {
            console.log('🔬 Ejecutando diagnóstico automático...');
            try {
                await window.runFilterDiagnostic();
            } catch (error) {
                console.error('❌ Error en diagnóstico automático:', error);
            }
        }
    }, 2000);
}