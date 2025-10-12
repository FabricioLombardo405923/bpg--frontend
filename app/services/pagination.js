/**
 * Componente de Paginación Reutilizable
 * 
 * Uso:
 * const pagination = new Pagination({
 *     containerId: 'paginationContainer',
 *     currentPage: 0,
 *     totalPages: 10,
 *     onPageChange: (newPage) => {
 *         // Tu lógica aquí
 *     }
 * });
 * 
 * // Para actualizar
 * pagination.update({ currentPage: 2, totalPages: 15 });
 */

class Pagination {
    constructor(options) {
        this.options = {
            containerId: options.containerId || 'paginationContainer',
            currentPage: options.currentPage || 0,
            totalPages: options.totalPages || 1,
            maxButtons: options.maxButtons || 5,
            onPageChange: options.onPageChange || (() => {}),
            showFirstLast: options.showFirstLast !== false,
            labels: {
                first: '<i class="fas fa-angle-double-left"></i>',
                prev: '<i class="fas fa-angle-left"></i>',
                next: '<i class="fas fa-angle-right"></i>',
                last: '<i class="fas fa-angle-double-right"></i>',
                ...options.labels
            }
        };
        
        this.container = document.getElementById(this.options.containerId);
        if (!this.container) {
            console.error(`Pagination: No se encontró el contenedor con id "${this.options.containerId}"`);
            return;
        }
        
        this.render();
    }
    
    render() {
        if (!this.container) return;
        
        // Limpiar contenedor
        this.container.innerHTML = '';
        
        // Ocultar si no hay páginas
        if (this.options.totalPages <= 1) {
            this.container.style.display = 'none';
            return;
        }
        
        this.container.style.display = 'flex';
        this.container.className = 'pagination-container';
        
        // Botón primera página
        if (this.options.showFirstLast) {
            this.container.appendChild(this.createButton(
                'first',
                this.options.labels.first,
                () => this.goToPage(0),
                this.options.currentPage === 0,
                'Primera página'
            ));
        }
        
        // Botón página anterior
        this.container.appendChild(this.createButton(
            'prev',
            this.options.labels.prev,
            () => this.goToPage(this.options.currentPage - 1),
            this.options.currentPage === 0,
            'Página anterior'
        ));
        
        // Números de página
        const numbersContainer = document.createElement('div');
        numbersContainer.className = 'pagination-numbers';
        
        const pageNumbers = this.calculatePageNumbers();
        pageNumbers.forEach((pageNum, index) => {
            if (pageNum === '...') {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.textContent = '...';
                numbersContainer.appendChild(ellipsis);
            } else {
                numbersContainer.appendChild(this.createPageNumber(pageNum));
            }
        });
        
        this.container.appendChild(numbersContainer);
        
        // Botón página siguiente
        this.container.appendChild(this.createButton(
            'next',
            this.options.labels.next,
            () => this.goToPage(this.options.currentPage + 1),
            this.options.currentPage >= this.options.totalPages - 1,
            'Página siguiente'
        ));
        
        // Botón última página
        if (this.options.showFirstLast) {
            this.container.appendChild(this.createButton(
                'last',
                this.options.labels.last,
                () => this.goToPage(this.options.totalPages - 1),
                this.options.currentPage >= this.options.totalPages - 1,
                'Última página'
            ));
        }
    }
    
    createButton(id, html, onClick, disabled = false, title = '') {
        const button = document.createElement('button');
        button.className = 'pagination-btn';
        button.innerHTML = html;
        button.disabled = disabled;
        if (title) button.title = title;
        if (!disabled) {
            button.addEventListener('click', onClick);
        }
        return button;
    }
    
    createPageNumber(pageNum) {
        const button = document.createElement('button');
        button.className = 'pagination-number';
        button.textContent = pageNum + 1; // +1 para mostrar desde 1 en lugar de 0
        
        if (pageNum === this.options.currentPage) {
            button.classList.add('active');
        }
        
        button.addEventListener('click', () => this.goToPage(pageNum));
        
        return button;
    }
    
    calculatePageNumbers() {
        const { currentPage, totalPages, maxButtons } = this.options;
        const pages = [];
        
        if (totalPages <= maxButtons) {
            // Mostrar todas las páginas
            for (let i = 0; i < totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Lógica con elipsis
            const halfMax = Math.floor(maxButtons / 2);
            let startPage = Math.max(0, currentPage - halfMax);
            let endPage = Math.min(totalPages - 1, currentPage + halfMax);
            
            // Ajustar si estamos al principio o final
            if (currentPage <= halfMax) {
                endPage = maxButtons - 1;
            } else if (currentPage >= totalPages - halfMax - 1) {
                startPage = totalPages - maxButtons;
            }
            
            // Siempre mostrar primera página
            if (startPage > 0) {
                pages.push(0);
                if (startPage > 1) {
                    pages.push('...');
                }
            }
            
            // Páginas del medio
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
            
            // Siempre mostrar última página
            if (endPage < totalPages - 1) {
                if (endPage < totalPages - 2) {
                    pages.push('...');
                }
                pages.push(totalPages - 1);
            }
        }
        
        return pages;
    }
    
    goToPage(pageNum) {
        if (pageNum < 0 || pageNum >= this.options.totalPages || pageNum === this.options.currentPage) {
            return;
        }
        
        this.options.currentPage = pageNum;
        this.render();
        this.options.onPageChange(pageNum);
    }
    
    update(newOptions) {
        this.options = {
            ...this.options,
            ...newOptions
        };
        this.render();
    }
    
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Exportar para uso global
window.Pagination = Pagination;