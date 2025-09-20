class GalleryController {
    constructor() {
        this.galleryGrid = document.getElementById('gallery-grid');
        this.loadingGallery = document.getElementById('loading-gallery');
        this.emptyGallery = document.getElementById('empty-gallery');
        this.refreshButton = document.getElementById('refresh-gallery');
        this.photos = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        // Cargar fotos al inicializar solo si la galería está visible
        const gallerySection = document.getElementById('gallery-section');
        if (gallerySection.classList.contains('active')) {
            this.loadPhotos();
        }
    }

    setupEventListeners() {
        this.refreshButton.addEventListener('click', () => this.loadPhotos());
        
        // Cargar fotos cuando se cambie a la pestaña de galería
        document.addEventListener('tabChanged', (e) => {
            if (e.detail.tab === 'gallery') {
                this.loadPhotos();
            }
        });
    }

    async loadPhotos() {
        this.showLoading();

        try {
            const response = await fetch('/api/photos');
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            this.photos = await response.json();
            this.renderPhotos();
            
            console.log(`✅ ${this.photos.length} fotos cargadas`);

        } catch (error) {
            console.error('❌ Error al cargar fotos:', error);
            this.showError('Error al cargar las fotos. Inténtalo de nuevo.');
        }
    }

    showLoading() {
        this.loadingGallery.style.display = 'block';
        this.galleryGrid.style.display = 'none';
        this.emptyGallery.style.display = 'none';
        
        // Animación de rotación del spinner
        const spinner = this.loadingGallery.querySelector('i');
        if (spinner) {
            spinner.style.animation = 'spin 1s linear infinite';
        }
    }

    renderPhotos() {
        this.loadingGallery.style.display = 'none';

        if (this.photos.length === 0) {
            this.galleryGrid.style.display = 'none';
            this.emptyGallery.style.display = 'block';
            return;
        }

        this.emptyGallery.style.display = 'none';
        this.galleryGrid.style.display = 'grid';
        
        // Limpiar galería actual
        this.galleryGrid.innerHTML = '';

        // Crear elementos para cada foto
        this.photos.forEach((photo, index) => {
            const photoElement = this.createPhotoElement(photo, index);
            this.galleryGrid.appendChild(photoElement);
        });

        // Añadir animación de entrada escalonada
        this.animatePhotoEntrance();
    }

    createPhotoElement(photo, index) {
        const photoDiv = document.createElement('div');
        photoDiv.className = 'gallery-item';
        photoDiv.style.animationDelay = `${index * 0.1}s`;
        
        // Formatear fecha
        const date = new Date(photo.created_at);
        const formattedDate = date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Obtener nombre del filtro más amigable
        const filterName = this.getFilterDisplayName(photo.filter_used);

        photoDiv.innerHTML = `
            <img src="/api/photo/${photo.id}" 
                 alt="Foto de boda ${photo.id}"
                 loading="lazy"
                 onerror="this.src='/images/placeholder.jpg'">
            <div class="gallery-item-info">
                <div class="gallery-item-date">${formattedDate}</div>
                <div class="gallery-item-notes">${photo.notes || ''}</div>
            </div>
        `;

        // Añadir evento click para vista ampliada
        photoDiv.addEventListener('click', () => this.showPhotoModal(photo));

        return photoDiv;
    }

    getFilterDisplayName(filterUsed) {
        const filterNames = {
            'none': 'Sin filtro',
            'frame1': 'Marco elegante',
            'frame2': 'Marco romántico'
        };
        
        return filterNames[filterUsed] || 'Filtro personalizado';
    }

    animatePhotoEntrance() {
        const items = this.galleryGrid.querySelectorAll('.gallery-item');
        
        items.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px) scale(0.9)';
            item.style.transition = 'all 0.4s ease-out';
            
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0) scale(1)';
            }, index * 100);
        });
    }

    showPhotoModal(photo) {
        // Crear modal para vista ampliada
        const modal = document.createElement('div');
        modal.className = 'gallery-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 2000;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        const date = new Date(photo.created_at);
        const formattedDate = date.toLocaleString('es-ES', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        modal.innerHTML = `
            <div class="gallery-modal-content" style="
                background: white;
                border-radius: 15px;
                padding: 2rem;
                max-width: 90vw;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;
                overflow: hidden;
            ">
                <button class="gallery-modal-close" style="
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: rgba(0,0,0,0.5);
                    color: white;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 1.2rem;
                    z-index: 1;
                ">×</button>
                
                <img src="/api/photo/${photo.id}" 
                     alt="Foto ampliada" 
                     style="
                        max-width: 100%;
                        max-height: 70vh;
                        border-radius: 10px;
                        object-fit: contain;
                        margin-bottom: 1rem;
                     ">
                
                <div style="text-align: center; color: var(--wedding-accent);">
                    <h3 style="margin-bottom: 0.5rem; font-family: var(--font-display);">
                        Recuerdo de Elva & Samuel
                    </h3>
                    <p style="margin-bottom: 0.5rem; color: var(--wedding-gray);">
                        ${formattedDate}
                    </p>
                    <p style="
                        background: var(--wedding-secondary);
                        color: var(--wedding-accent);
                        padding: 0.3rem 1rem;
                        border-radius: 15px;
                        font-size: 0.9rem;
                        margin-top: 0.5rem;
                    ">
                        Nota: ${photo.notes || '—'}
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Mostrar modal con animación
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        // Eventos para cerrar modal
        const closeButton = modal.querySelector('.gallery-modal-close');
        closeButton.addEventListener('click', () => this.closePhotoModal(modal));
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closePhotoModal(modal);
            }
        });

        // Cerrar con escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closePhotoModal(modal);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    closePhotoModal(modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    showError(message) {
        this.loadingGallery.style.display = 'none';
        this.galleryGrid.style.display = 'none';
        
        // Crear elemento de error temporal
        const errorElement = document.createElement('div');
        errorElement.className = 'gallery-error';
        errorElement.style.cssText = `
            text-align: center;
            padding: 3rem 2rem;
            color: #dc3545;
        `;
        
        errorElement.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h3>Error al cargar fotos</h3>
            <p>${message}</p>
            <button class="btn btn-outline" onclick="window.galleryController.loadPhotos()" style="margin-top: 1rem;">
                <i class="fas fa-redo"></i> Intentar de nuevo
            </button>
        `;

        // Reemplazar contenido de la galería con el error
        this.galleryGrid.parentNode.insertBefore(errorElement, this.galleryGrid);
        
        // Remover error después de 10 segundos
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.parentNode.removeChild(errorElement);
                this.emptyGallery.style.display = 'block';
            }
        }, 10000);
    }

    // Método para filtrar fotos por filtro usado
    filterByFilter(filterType) {
        const filteredPhotos = filterType === 'all' 
            ? this.photos 
            : this.photos.filter(photo => photo.filter_used === filterType);
        
        this.renderFilteredPhotos(filteredPhotos);
    }

    renderFilteredPhotos(photos) {
        this.galleryGrid.innerHTML = '';
        
        if (photos.length === 0) {
            this.galleryGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--wedding-gray);">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>No se encontraron fotos con este filtro</p>
                </div>
            `;
            return;
        }

        photos.forEach((photo, index) => {
            const photoElement = this.createPhotoElement(photo, index);
            this.galleryGrid.appendChild(photoElement);
        });

        this.animatePhotoEntrance();
    }

    // Método para descargar una foto
    async downloadPhoto(photoId, filename) {
        try {
            const response = await fetch(`/api/photo/${photoId}`);
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `wedding_photo_${photoId}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            console.log(`✅ Foto ${photoId} descargada`);
        } catch (error) {
            console.error('❌ Error al descargar foto:', error);
            alert('Error al descargar la foto');
        }
    }

    // Método para obtener estadísticas de la galería
    getStats() {
        const totalPhotos = this.photos.length;
        const filterStats = this.photos.reduce((stats, photo) => {
            const filter = photo.filter_used || 'none';
            stats[filter] = (stats[filter] || 0) + 1;
            return stats;
        }, {});

        return {
            total: totalPhotos,
            filters: filterStats,
            lastPhoto: totalPhotos > 0 ? this.photos[0] : null
        };
    }
}

// Agregar estilos para animación de spinning
const galleryStyle = document.createElement('style');
galleryStyle.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(galleryStyle);
