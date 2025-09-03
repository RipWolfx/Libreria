// Variables específicas para la página de libros
let librosFiltrados = [];
let filtroActual = {
    busqueda: '',
    categoria: '',
    precio: '',
    orden: 'titulo'
};

// Inicialización específica para la página de libros
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('libros.html')) {
        inicializarPaginaLibros();
    }
});

function inicializarPaginaLibros() {
    console.log('Inicializando página de libros...');
    
    // Esperar a que se carguen los datos
    let intentos = 0;
    const maxIntentos = 50; // 5 segundos máximo
    
    const checkData = setInterval(() => {
        intentos++;
        console.log(`Intento ${intentos}: libros disponibles:`, libros ? libros.length : 0);
        
        if (libros && libros.length > 0) {
            clearInterval(checkData);
            librosFiltrados = [...libros];
            mostrarLibrosPage();
            inicializarFiltros();
            console.log('Página de libros inicializada correctamente');
        } else if (intentos >= maxIntentos) {
            clearInterval(checkData);
            console.error('Timeout: No se pudieron cargar los libros');
            // Mostrar mensaje de error
            const container = document.getElementById('libros-container');
            if (container) {
                container.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Error al cargar libros</h3>
                        <p>No se pudieron cargar los libros. Por favor, recarga la página.</p>
                        <button onclick="window.location.reload()" class="btn-primary">Recargar Página</button>
                    </div>
                `;
            }
        }
    }, 100);
}

// Inicializar filtros
function inicializarFiltros() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const categoriaFilter = document.getElementById('categoria-filter');
    const precioFilter = document.getElementById('precio-filter');
    const ordenFilter = document.getElementById('orden-filter');
    const clearFiltersBtn = document.getElementById('clear-filters');
    
    // Búsqueda
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', realizarBusqueda);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                realizarBusqueda();
            }
        });
    }
    
    // Filtros
    if (categoriaFilter) {
        categoriaFilter.addEventListener('change', aplicarFiltros);
    }
    
    if (precioFilter) {
        precioFilter.addEventListener('change', aplicarFiltros);
    }
    
    if (ordenFilter) {
        ordenFilter.addEventListener('change', aplicarFiltros);
    }
    
    // Limpiar filtros
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', limpiarFiltros);
    }
}

// Realizar búsqueda
function realizarBusqueda() {
    const searchInput = document.getElementById('search-input');
    filtroActual.busqueda = searchInput.value.toLowerCase().trim();
    aplicarFiltros();
}

// Aplicar filtros
function aplicarFiltros() {
    const categoriaFilter = document.getElementById('categoria-filter');
    const precioFilter = document.getElementById('precio-filter');
    const ordenFilter = document.getElementById('orden-filter');
    
    // Actualizar filtros
    filtroActual.categoria = categoriaFilter?.value || '';
    filtroActual.precio = precioFilter?.value || '';
    filtroActual.orden = ordenFilter?.value || 'titulo';
    
    // Filtrar libros
    librosFiltrados = libros.filter(libro => {
        // Filtro de búsqueda
        const coincideBusqueda = !filtroActual.busqueda || 
            libro.titulo.toLowerCase().includes(filtroActual.busqueda) ||
            libro.autor.toLowerCase().includes(filtroActual.busqueda);
        
        // Filtro de categoría
        const coincideCategoria = !filtroActual.categoria || 
            libro.categoria === filtroActual.categoria;
        
        // Filtro de precio
        let coincidePrecio = true;
        if (filtroActual.precio) {
            const precio = libro.precio;
            switch (filtroActual.precio) {
                case '0-15':
                    coincidePrecio = precio >= 0 && precio <= 15;
                    break;
                case '15-25':
                    coincidePrecio = precio > 15 && precio <= 25;
                    break;
                case '25-35':
                    coincidePrecio = precio > 25 && precio <= 35;
                    break;
                case '35+':
                    coincidePrecio = precio > 35;
                    break;
            }
        }
        
        return coincideBusqueda && coincideCategoria && coincidePrecio;
    });
    
    // Ordenar libros
    librosFiltrados.sort((a, b) => {
        switch (filtroActual.orden) {
            case 'titulo':
                return a.titulo.localeCompare(b.titulo);
            case 'autor':
                return a.autor.localeCompare(b.autor);
            case 'precio-asc':
                return a.precio - b.precio;
            case 'precio-desc':
                return b.precio - a.precio;
            default:
                return 0;
        }
    });
    
    mostrarLibrosPage();
}

// Limpiar filtros
function limpiarFiltros() {
    document.getElementById('search-input').value = '';
    document.getElementById('categoria-filter').value = '';
    document.getElementById('precio-filter').value = '';
    document.getElementById('orden-filter').value = 'titulo';
    
    filtroActual = {
        busqueda: '',
        categoria: '',
        precio: '',
        orden: 'titulo'
    };
    
    librosFiltrados = [...libros];
    mostrarLibrosPage();
}

// Mostrar libros en la página de libros
function mostrarLibrosPage() {
    const container = document.getElementById('libros-container');
    const resultsCount = document.getElementById('results-count');
    
    console.log('Mostrando libros en página:', librosFiltrados);
    
    if (!container) {
        console.error('Container libros-container no encontrado');
        return;
    }
    
    // Actualizar contador de resultados
    if (resultsCount) {
        resultsCount.textContent = `${librosFiltrados.length} libros encontrados`;
    }
    
    if (!librosFiltrados || librosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No se encontraron libros</h3>
                <p>Intenta ajustar los filtros de búsqueda</p>
            </div>
        `;
        return;
    }
    
    // Crear las tarjetas de libros
    const librosHTML = librosFiltrados.map(libro => {
        // Validar que el libro tenga todas las propiedades necesarias
        const titulo = libro.titulo || 'Sin título';
        const autor = libro.autor || 'Autor desconocido';
        const categoria = libro.categoria || 'Sin categoría';
        const descripcion = libro.descripcion || 'Sin descripción disponible';
        const precio = libro.precio || 0;
        const stock = libro.stock || 0;
        const imagen = libro.imagen || 'https://via.placeholder.com/300x400?text=Sin+Imagen';
        
        return `
            <div class="libro-card">
                <div class="libro-imagen">
                    <img src="${imagen}" alt="${titulo}" onerror="this.src='https://via.placeholder.com/300x400?text=Sin+Imagen'">
                    ${stock === 0 ? '<div class="sin-stock">Sin Stock</div>' : ''}
                </div>
                <div class="libro-info">
                    <h3 class="libro-titulo">${titulo}</h3>
                    <p class="libro-autor">por ${autor}</p>
                    <span class="libro-categoria">${categoria}</span>
                    <p class="libro-descripcion">${descripcion}</p>
                    <div class="libro-precio">
                        <span class="precio">S/ ${precio.toFixed(2)}</span>
                        <span class="stock">Stock: ${stock}</span>
                    </div>
                    <button 
                        class="btn-agregar-carrito ${stock === 0 ? 'disabled' : ''}" 
                        onclick="window.agregarAlCarrito ? window.agregarAlCarrito(${libro.id}) : alert('Función de carrito no disponible')" 
                        ${stock === 0 ? 'disabled' : ''}
                    >
                        <i class="fas fa-shopping-cart"></i>
                        ${stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = librosHTML;
    console.log('Libros mostrados correctamente en página');
}