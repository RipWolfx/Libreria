// Variables globales
let libros = [];
let usuarios = [];
let carrito = [];
let usuarioActual = null;

// Debug mode
const DEBUG = true;

function debugLog(message, data = null) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`, data || '');
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    debugLog('DOM cargado, inicializando aplicación...');
    
    // Inicializar modal de cantidad
    inicializarModalCantidad();
    
    // Mostrar indicador de carga si estamos en la página de libros
    const container = document.getElementById('libros-container');
    if (container) {
        container.innerHTML = `
            <div class="loading-message" style="text-align: center; padding: 3rem;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #FFD700; margin-bottom: 1rem;"></i>
                <h3>Cargando libros...</h3>
                <p>Por favor espera mientras cargamos el catálogo</p>
            </div>
        `;
    }
    
    cargarDatos();
    inicializarEventos();
    verificarSesion();
    actualizarContadorCarrito();
});

// Cargar datos usando el nuevo sistema de almacenamiento
async function cargarDatos() {
    debugLog('Iniciando carga de datos...');
    
    try {
        // Esperar a que el sistema de almacenamiento esté listo
        const waitForStorage = () => {
            return new Promise((resolve) => {
                const checkStorage = () => {
                    if (window.jsonStorage) {
                        resolve();
                    } else {
                        setTimeout(checkStorage, 50);
                    }
                };
                checkStorage();
            });
        };

        await waitForStorage();
        
        // Cargar datos desde el storage centralizado
        libros = window.jsonStorage.getLibros();
        usuarios = window.jsonStorage.getUsuarios();
        
        debugLog('Datos cargados desde storage', { libros: libros.length, usuarios: usuarios.length });
        
        // Cargar carrito desde localStorage
        const carritoGuardado = localStorage.getItem('carrito');
        if (carritoGuardado) {
            carrito = JSON.parse(carritoGuardado);
        }
        
        // Mostrar libros si estamos en la página de libros
        if (document.getElementById('libros-container')) {
            setTimeout(() => {
                mostrarLibros(libros);
            }, 100);
        }
        
        debugLog('Carga de datos completada exitosamente');
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        // Mostrar mensaje de error al usuario
        if (document.getElementById('libros-container')) {
            document.getElementById('libros-container').innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error al cargar datos</h3>
                    <p>No se pudieron cargar los libros. Error: ${error.message}</p>
                    <button onclick="window.location.reload()" class="btn-primary">Recargar Página</button>
                </div>
            `;
        }
    }
}

// Función auxiliar para cargar desde JSON
async function cargarDesdeJSON() {
    const rutaBase = window.location.pathname.includes('/pages/') ? '../' : './';
    
    debugLog('Cargando desde JSON con ruta base:', rutaBase);
    
    // Cargar libros
    const responseLibros = await fetch(`${rutaBase}data/libros.json`);
    if (!responseLibros.ok) {
        throw new Error(`Error cargando libros: ${responseLibros.status}`);
    }
    libros = await responseLibros.json();
    debugLog('Libros cargados desde JSON:', libros.length);
    
    // Cargar usuarios
    const responseUsuarios = await fetch(`${rutaBase}data/usuarios.json`);
    if (!responseUsuarios.ok) {
        throw new Error(`Error cargando usuarios: ${responseUsuarios.status}`);
    }
    usuarios = await responseUsuarios.json();
    debugLog('Usuarios cargados desde JSON:', usuarios.length);
}

// Inicializar eventos
function inicializarEventos() {
    // Eventos del carrito
    const carritoBtn = document.getElementById('carrito-btn');
    if (carritoBtn) {
        carritoBtn.addEventListener('click', abrirCarrito);
    }
    
    // Eventos de modales
    const modales = document.querySelectorAll('.modal');
    modales.forEach(modal => {
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => cerrarModal(modal));
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cerrarModal(modal);
            }
        });
    });
    
    // Eventos de búsqueda y filtros
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const categoriaFilter = document.getElementById('categoria-filter');
    const precioFilter = document.getElementById('precio-filter');
    const clearFiltersBtn = document.getElementById('clear-filters');
    
    if (searchInput) {
        searchInput.addEventListener('input', filtrarLibros);
    }
    if (searchBtn) {
        searchBtn.addEventListener('click', filtrarLibros);
    }
    if (categoriaFilter) {
        categoriaFilter.addEventListener('change', filtrarLibros);
    }
    if (precioFilter) {
        precioFilter.addEventListener('change', filtrarLibros);
    }
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', limpiarFiltros);
    }
    
    // Eventos de autenticación
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => cambiarTab(btn.dataset.tab));
    });
    
    // Esperar a que los datos se carguen antes de configurar los forms
    setTimeout(() => {
        const loginForm = document.querySelector('#login-form form');
        const registerForm = document.querySelector('#register-form form');
        
        if (loginForm) {
            loginForm.addEventListener('submit', manejarLogin);
        }
        if (registerForm) {
            registerForm.addEventListener('submit', manejarRegistro);
        }
    }, 500);
    
    // Eventos del carrito
    const vaciarCarritoBtn = document.getElementById('vaciar-carrito');
    const procesarPagoBtn = document.getElementById('procesar-pago');
    
    if (vaciarCarritoBtn) {
        vaciarCarritoBtn.addEventListener('click', vaciarCarrito);
    }
    if (procesarPagoBtn) {
        procesarPagoBtn.addEventListener('click', procesarPago);
    }
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', cerrarSesion);
    }
}

// Mostrar libros
function mostrarLibros(librosAMostrar) {
    const container = document.getElementById('libros-container');
    const resultsCount = document.getElementById('results-count');
    
    console.log('Mostrando libros:', librosAMostrar);
    
    if (!container) {
        console.log('Container libros-container no encontrado');
        return;
    }
    
    if (!librosAMostrar || librosAMostrar.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No se encontraron libros</h3>
                <p>Intenta ajustar tus filtros de búsqueda</p>
            </div>
        `;
        if (resultsCount) {
            resultsCount.textContent = '0 libros encontrados';
        }
        return;
    }
    
    container.innerHTML = librosAMostrar.map(libro => `
        <div class="libro-card">
            <div class="libro-imagen">
                <img src="${libro.imagen}" alt="${libro.titulo}" onerror="this.src='https://via.placeholder.com/300x400?text=Sin+Imagen'">
                ${libro.stock === 0 ? '<div class="sin-stock">Sin Stock</div>' : ''}
            </div>
            <div class="libro-info">
                <h3 class="libro-titulo">${libro.titulo}</h3>
                <p class="libro-autor">por ${libro.autor}</p>
                <span class="libro-categoria">${libro.categoria}</span>
                <p class="libro-descripcion">${libro.descripcion}</p>
                <div class="libro-precio">
                    <span class="precio">S/ ${libro.precio.toFixed(2)}</span>
                    <span class="stock">Stock: ${libro.stock}</span>
                </div>
                <button class="btn-agregar-carrito ${libro.stock === 0 ? 'disabled' : ''}" 
                        onclick="agregarAlCarrito(${libro.id})" 
                        ${libro.stock === 0 ? 'disabled' : ''}>
                    <i class="fas fa-shopping-cart"></i>
                    ${libro.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                </button>
            </div>
        </div>
    `).join('');
    
    if (resultsCount) {
        resultsCount.textContent = `${librosAMostrar.length} libros encontrados`;
    }
    
    console.log('Libros mostrados correctamente');
}

// Filtrar libros
function filtrarLibros() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const categoriaSeleccionada = document.getElementById('categoria-filter')?.value || '';
    const precioSeleccionado = document.getElementById('precio-filter')?.value || '';
    
    let librosFiltrados = libros.filter(libro => {
        const coincideBusqueda = libro.titulo.toLowerCase().includes(searchTerm) ||
                                libro.autor.toLowerCase().includes(searchTerm);
        
        const coincideCategoria = !categoriaSeleccionada || libro.categoria === categoriaSeleccionada;
        
        let coincidePrecio = true;
        if (precioSeleccionado) {
            const precio = libro.precio;
            switch (precioSeleccionado) {
                case '0-15':
                    coincidePrecio = precio >= 0 && precio <= 15;
                    break;
                case '15-20':
                    coincidePrecio = precio > 15 && precio <= 20;
                    break;
                case '20-25':
                    coincidePrecio = precio > 20 && precio <= 25;
                    break;
                case '25+':
                    coincidePrecio = precio > 25;
                    break;
            }
        }
        
        return coincideBusqueda && coincideCategoria && coincidePrecio;
    });
    
    mostrarLibros(librosFiltrados);
}

// Limpiar filtros
function limpiarFiltros() {
    const searchInput = document.getElementById('search-input');
    const categoriaFilter = document.getElementById('categoria-filter');
    const precioFilter = document.getElementById('precio-filter');
    
    if (searchInput) searchInput.value = '';
    if (categoriaFilter) categoriaFilter.value = '';
    if (precioFilter) precioFilter.value = '';
    
    mostrarLibros(libros);
}

// Funciones del carrito
// Variable global para el libro seleccionado en el modal de cantidad
let libroSeleccionadoCantidad = null;

window.agregarAlCarrito = function agregarAlCarrito(libroId) {
    const libro = libros.find(l => l.id === libroId);
    if (!libro || libro.stock === 0) {
        mostrarMensaje('Libro no disponible', 'error');
        return;
    }
    
    // Abrir modal de cantidad
    abrirModalCantidad(libro);
};

function abrirModalCantidad(libro) {
    libroSeleccionadoCantidad = libro;
    
    // Llenar información del libro en el modal
    document.getElementById('cantidad-libro-imagen').src = libro.imagen;
    document.getElementById('cantidad-libro-imagen').alt = libro.titulo;
    document.getElementById('cantidad-libro-titulo').textContent = libro.titulo;
    document.getElementById('cantidad-libro-autor').textContent = `por ${libro.autor}`;
    document.getElementById('cantidad-libro-precio').textContent = `S/ ${libro.precio.toFixed(2)}`;
    document.getElementById('cantidad-libro-stock').textContent = `Stock disponible: ${libro.stock}`;
    
    // Configurar input de cantidad
    const cantidadInput = document.getElementById('cantidad-input');
    cantidadInput.max = libro.stock;
    cantidadInput.value = 1;
    
    // Calcular total inicial
    actualizarTotalPreview();
    
    // Mostrar modal
    document.getElementById('cantidad-modal').style.display = 'block';
}

function actualizarTotalPreview() {
    if (!libroSeleccionadoCantidad) return;
    
    const cantidad = parseInt(document.getElementById('cantidad-input').value) || 1;
    const total = libroSeleccionadoCantidad.precio * cantidad;
    document.getElementById('total-preview').textContent = `S/ ${total.toFixed(2)}`;
}

function agregarAlCarritoConCantidad(libroId, cantidad) {
    const libro = libros.find(l => l.id === libroId);
    if (!libro || libro.stock === 0) return;
    
    if (cantidad > libro.stock) {
        mostrarMensaje('No hay suficiente stock disponible', 'error');
        return;
    }
    
    const itemExistente = carrito.find(item => item.id === libroId);
    
    if (itemExistente) {
        const nuevaCantidad = itemExistente.cantidad + cantidad;
        if (nuevaCantidad <= libro.stock) {
            itemExistente.cantidad = nuevaCantidad;
        } else {
            mostrarMensaje('No hay suficiente stock disponible', 'error');
            return;
        }
    } else {
        carrito.push({
            id: libro.id,
            titulo: libro.titulo,
            autor: libro.autor,
            precio: libro.precio,
            imagen: libro.imagen,
            cantidad: cantidad,
            stockDisponible: libro.stock
        });
    }
    
    guardarCarrito();
    actualizarContadorCarrito();
    mostrarMensaje(`${cantidad} libro(s) agregado(s) al carrito`, 'success');
}

function abrirCarrito() {
    const modal = document.getElementById('carrito-modal');
    const itemsContainer = document.getElementById('carrito-items');
    const totalElement = document.getElementById('total-precio');
    
    if (carrito.length === 0) {
        itemsContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">El carrito está vacío</p>';
        totalElement.textContent = '0.00';
    } else {
        itemsContainer.innerHTML = carrito.map(item => `
            <div class="carrito-item">
                <img src="${item.imagen}" alt="${item.titulo}" class="carrito-item-img">
                <div class="carrito-item-info">
                    <h4>${item.titulo}</h4>
                    <p>por ${item.autor}</p>
                    <div class="carrito-item-controls">
                        <button onclick="cambiarCantidad(${item.id}, -1)">-</button>
                        <span>${item.cantidad}</span>
                        <button onclick="cambiarCantidad(${item.id}, 1)">+</button>
                        <button class="btn-remove" onclick="eliminarDelCarrito(${item.id})">&times;</button>
                    </div>
                </div>
                <div class="carrito-item-precio">
                    <strong>S/ ${(item.precio * item.cantidad).toFixed(2)}</strong>
                </div>
            </div>
        `).join('');
        
        const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        totalElement.textContent = total.toFixed(2);
    }
    
    modal.style.display = 'block';
}

window.cambiarCantidad = function cambiarCantidad(libroId, cambio) {
    const item = carrito.find(item => item.id === libroId);
    if (!item) return;
    
    const nuevaCantidad = item.cantidad + cambio;
    
    if (nuevaCantidad <= 0) {
        eliminarDelCarrito(libroId);
        return;
    }
    
    if (nuevaCantidad > item.stockDisponible) {
        mostrarMensaje('No hay suficiente stock disponible', 'error');
        return;
    }
    
    item.cantidad = nuevaCantidad;
    guardarCarrito();
    actualizarContadorCarrito();
    abrirCarrito(); // Refrescar la vista del carrito
}

window.eliminarDelCarrito = function eliminarDelCarrito(libroId) {
    carrito = carrito.filter(item => item.id !== libroId);
    guardarCarrito();
    actualizarContadorCarrito();
    abrirCarrito(); // Refrescar la vista del carrito
}

function vaciarCarrito() {
    carrito = [];
    guardarCarrito();
    actualizarContadorCarrito();
    abrirCarrito(); // Refrescar la vista del carrito
}

function procesarPago() {
    if (carrito.length === 0) {
        mostrarMensaje('El carrito está vacío', 'error');
        return;
    }
    
    // Cerrar modal del carrito
    cerrarModal(document.getElementById('carrito-modal'));
    
    // Abrir modal de pago
    const pagoModal = document.getElementById('pago-modal');
    const procesandoDiv = document.getElementById('pago-procesando');
    const exitosoDiv = document.getElementById('pago-exitoso');
    
    procesandoDiv.style.display = 'block';
    exitosoDiv.style.display = 'none';
    pagoModal.style.display = 'block';
    
    // Simular procesamiento de pago
    setTimeout(() => {
        procesandoDiv.style.display = 'none';
        exitosoDiv.style.display = 'block';
        
        // Vaciar carrito después del pago exitoso
        vaciarCarrito();
        
        // Cerrar modal después de 3 segundos
        setTimeout(() => {
            cerrarModal(pagoModal);
        }, 3000);
    }, 3000);
}

function actualizarContadorCarrito() {
    const contador = document.getElementById('carrito-count');
    if (contador) {
        const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        contador.textContent = totalItems;
    }
}

function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

// Funciones de autenticación
function cambiarTab(tab) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    tabBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

function manejarLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    
    console.log('Intentando login con:', email, password);
    console.log('Usuarios disponibles:', usuarios);
    
    if (!usuarios || usuarios.length === 0) {
        mostrarMensaje('Error: No se pudieron cargar los datos de usuarios', 'error');
        return;
    }
    
    const usuario = usuarios.find(u => u.email === email && u.password === password);
    
    if (usuario) {
        usuarioActual = usuario;
        localStorage.setItem('usuarioActual', JSON.stringify(usuario));
        
        // Actualizar navegación inmediatamente
        actualizarNavegacionLogueado();
        
        mostrarMensaje('Inicio de sesión exitoso', 'success');
        
        setTimeout(() => {
            if (usuario.rol === 'ADMIN') {
                window.location.href = window.location.pathname.includes('/pages/') ? 'admin.html' : 'pages/admin.html';
            } else {
                window.location.href = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
            }
        }, 1500);
    } else {
        mostrarMensaje('Email o contraseña incorrectos', 'error');
        console.log('Login fallido para:', email);
    }
}

function manejarRegistro(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('register-nombre').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    if (password !== confirmPassword) {
        mostrarMensaje('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (usuarios.find(u => u.email === email)) {
        mostrarMensaje('El email ya está registrado', 'error');
        return;
    }
    
    const nuevoUsuario = {
        id: usuarios.length + 1,
        nombre: nombre,
        email: email,
        password: password,
        rol: 'USUARIO',
        fechaRegistro: new Date().toISOString().split('T')[0]
    };
    
    usuarios.push(nuevoUsuario);
    
    // En una aplicación real, esto se enviaría al servidor
    // Por ahora solo lo guardamos en localStorage
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    
    mostrarMensaje('Registro exitoso. Ahora puedes iniciar sesión.', 'success');
    
    // Cambiar a tab de login
    setTimeout(() => {
        cambiarTab('login');
        document.getElementById('login-email').value = email;
    }, 1500);
}

function verificarSesion() {
    const usuarioGuardado = localStorage.getItem('usuarioActual');
    if (usuarioGuardado) {
        usuarioActual = JSON.parse(usuarioGuardado);
        
        // Actualizar la navegación para mostrar usuario logueado
        actualizarNavegacionLogueado();
        
        // Mostrar panel admin si es admin
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel && usuarioActual.rol === 'ADMIN') {
            adminPanel.style.display = 'block';
        }
        
        // Verificar si está en página de admin sin permisos
        if (window.location.pathname.includes('admin.html') && usuarioActual.rol !== 'ADMIN') {
            window.location.href = '../index.html';
        }
    } else {
        // Actualizar navegación para usuario no logueado
        actualizarNavegacionDeslogueado();
        
        // Si está en página de admin sin sesión, redirigir
        if (window.location.pathname.includes('admin.html')) {
            window.location.href = 'login.html';
        }
    }
}

function actualizarNavegacionLogueado() {
    // Ocultar botón de login
    const loginLink = document.querySelector('a[href*="login.html"]');
    if (loginLink) {
        loginLink.parentElement.style.display = 'none';
    }
    
    // Mostrar información del usuario y botón de logout
    mostrarInfoUsuario();
}

function actualizarNavegacionDeslogueado() {
    // Mostrar botón de login
    const loginLink = document.querySelector('a[href*="login.html"]');
    if (loginLink) {
        loginLink.parentElement.style.display = 'block';
    }
    
    // Ocultar información del usuario
    ocultarInfoUsuario();
    
    // Ocultar panel admin
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        adminPanel.style.display = 'none';
    }
}

function mostrarInfoUsuario() {
    if (!usuarioActual) return;
    
    // Buscar si ya existe el elemento de usuario
    let userInfo = document.getElementById('user-info');
    
    if (!userInfo) {
        // Crear elemento de información del usuario
        userInfo = document.createElement('li');
        userInfo.className = 'nav-item';
        userInfo.id = 'user-info';
        
        // Insertar antes del carrito
        const carritoBtn = document.querySelector('#carrito-btn').parentElement;
        if (carritoBtn && carritoBtn.parentNode) {
            carritoBtn.parentNode.insertBefore(userInfo, carritoBtn);
        }
    }
    
    userInfo.style.display = 'block';
    userInfo.innerHTML = `
        <span class="nav-link user-greeting">
            <i class="fas fa-user"></i>
            Hola, ${usuarioActual.nombre}
        </span>
    `;
    
    // Manejar botón de logout - solo crear si no estamos en admin
    if (!window.location.pathname.includes('admin.html')) {
        let logoutBtn = document.getElementById('logout-nav-btn');
        
        if (!logoutBtn) {
            // Crear botón de cerrar sesión
            logoutBtn = document.createElement('li');
            logoutBtn.className = 'nav-item';
            logoutBtn.id = 'logout-nav-btn';
            
            // Insertar al final del menú
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu) {
                navMenu.appendChild(logoutBtn);
            }
        }
        
        logoutBtn.style.display = 'block';
        logoutBtn.innerHTML = `
            <a href="#" class="nav-link" onclick="cerrarSesion(); return false;">
                <i class="fas fa-sign-out-alt"></i>
                Cerrar Sesión
            </a>
        `;
    }
}

function ocultarInfoUsuario() {
    // Ocultar información del usuario
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
        userInfo.style.display = 'none';
    }
    
    // Ocultar botón de logout
    const logoutBtn = document.getElementById('logout-nav-btn');
    if (logoutBtn) {
        logoutBtn.style.display = 'none';
    }
}

function cerrarSesion() {
    localStorage.removeItem('usuarioActual');
    usuarioActual = null;
    
    // Actualizar navegación inmediatamente
    actualizarNavegacionDeslogueado();
    
    // Redirigir según la página actual
    if (window.location.pathname.includes('admin.html')) {
        window.location.href = 'login.html';
    } else if (window.location.pathname.includes('/pages/')) {
        window.location.href = '../index.html';
    } else {
        // Recargar la página actual si estamos en index
        window.location.reload();
    }
}

// Hacer la función global para que se pueda llamar desde HTML
window.cerrarSesion = cerrarSesion;

// Funciones de utilidad
function mostrarMensaje(mensaje, tipo) {
    const messageDiv = document.getElementById('auth-message');
    if (messageDiv) {
        messageDiv.textContent = mensaje;
        messageDiv.className = `auth-message ${tipo}`;
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    } else {
        // Crear toast si no hay contenedor de mensajes
        const toast = document.createElement('div');
        toast.className = `toast-message ${tipo}`;
        toast.textContent = mensaje;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${tipo === 'success' ? '#d4edda' : '#f8d7da'};
            color: ${tipo === 'success' ? '#155724' : '#721c24'};
            padding: 1rem 2rem;
            border-radius: 5px;
            z-index: 9999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    }
}

function cerrarModal(modal) {
    modal.style.display = 'none';
}

// Event listeners para modal de cantidad
function inicializarModalCantidad() {
    // Botones + y -
    const btnMenos = document.getElementById('btn-menos');
    const btnMas = document.getElementById('btn-mas');
    const cantidadInput = document.getElementById('cantidad-input');
    
    if (btnMenos) {
        btnMenos.addEventListener('click', () => {
            const cantidad = parseInt(cantidadInput.value) || 1;
            if (cantidad > 1) {
                cantidadInput.value = cantidad - 1;
                actualizarTotalPreview();
            }
        });
    }
    
    if (btnMas) {
        btnMas.addEventListener('click', () => {
            const cantidad = parseInt(cantidadInput.value) || 1;
            const maxStock = parseInt(cantidadInput.max) || 1;
            if (cantidad < maxStock) {
                cantidadInput.value = cantidad + 1;
                actualizarTotalPreview();
            }
        });
    }
    
    if (cantidadInput) {
        cantidadInput.addEventListener('input', () => {
            actualizarTotalPreview();
        });
    }
    
    // Botón confirmar
    const confirmarBtn = document.getElementById('confirmar-cantidad');
    if (confirmarBtn) {
        confirmarBtn.addEventListener('click', () => {
            if (libroSeleccionadoCantidad) {
                const cantidad = parseInt(cantidadInput.value) || 1;
                agregarAlCarritoConCantidad(libroSeleccionadoCantidad.id, cantidad);
                cerrarModalCantidad();
            }
        });
    }
    
    // Botón cancelar
    const cancelarBtn = document.getElementById('cancelar-cantidad');
    if (cancelarBtn) {
        cancelarBtn.addEventListener('click', cerrarModalCantidad);
    }
    
    // Cerrar modal con X
    const cantidadModal = document.getElementById('cantidad-modal');
    if (cantidadModal) {
        const closeBtn = cantidadModal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', cerrarModalCantidad);
        }
        
        // Cerrar al hacer clic fuera del modal
        cantidadModal.addEventListener('click', (e) => {
            if (e.target === cantidadModal) {
                cerrarModalCantidad();
            }
        });
    }
}

function cerrarModalCantidad() {
    document.getElementById('cantidad-modal').style.display = 'none';
    libroSeleccionadoCantidad = null;
}