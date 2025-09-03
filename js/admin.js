// Variables para administración
let libroEditando = null;

// Inicialización del panel admin
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin.html')) {
        verificarPermisos();
        inicializarAdmin();
        inicializarEventosAdmin();
    }
});

function verificarPermisos() {
    const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || 'null');
    if (!usuarioActual || usuarioActual.rol !== 'ADMIN') {
        window.location.href = 'login.html';
        return;
    }
}

function inicializarAdmin() {
    console.log('[ADMIN] Inicializando panel de administración...');
    
    // Esperar a que el sistema de almacenamiento esté listo
    const checkData = setInterval(() => {
        if (window.jsonStorage && typeof librosManager !== 'undefined' && typeof usuariosManager !== 'undefined') {
            clearInterval(checkData);
            
            // Cargar datos desde el storage centralizado
            const librosData = window.jsonStorage.getLibros();
            const usuariosData = window.jsonStorage.getUsuarios();
            
            if (librosData.length > 0) {
                librosManager.loadData(librosData);
            }
            
            if (usuariosData.length > 0) {
                usuariosManager.loadData(usuariosData);
            }
            
            console.log('[ADMIN] Datos disponibles en storage:', {
                libros: librosData.length,
                usuarios: usuariosData.length
            });
            
            console.log('[ADMIN] Datos cargados en managers:', {
                libros: librosManager.getAll().length,
                usuarios: usuariosManager.getAll().length
            });
            
            // Forzar actualización de la interfaz
            setTimeout(() => {
                actualizarDashboard();
                mostrarUsuarios();
                mostrarLibrosAdmin();
            }, 100);
        }
    }, 100);
}

function inicializarEventosAdmin() {
    // Tabs de administración
    const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
    adminTabBtns.forEach(btn => {
        btn.addEventListener('click', () => cambiarTabAdmin(btn.dataset.tab));
    });
    
    // Botón agregar libro
    const agregarLibroBtn = document.getElementById('agregar-libro-btn');
    if (agregarLibroBtn) {
        agregarLibroBtn.addEventListener('click', () => abrirModalLibro(null));
    }
    
    // Formulario de libro
    const libroForm = document.getElementById('libro-form');
    if (libroForm) {
        libroForm.addEventListener('submit', guardarLibro);
    }
    
    // Botones del modal de libro
    const cancelarLibroBtn = document.getElementById('cancelar-libro');
    if (cancelarLibroBtn) {
        cancelarLibroBtn.addEventListener('click', cerrarModalLibro);
    }
    
    // Formulario y botones del modal de usuario
    const usuarioForm = document.getElementById('usuario-form');
    if (usuarioForm) {
        usuarioForm.addEventListener('submit', guardarUsuario);
    }
    
    const cancelarUsuarioBtn = document.getElementById('cancelar-usuario');
    if (cancelarUsuarioBtn) {
        cancelarUsuarioBtn.addEventListener('click', cerrarModalUsuario);
    }
    
    // Filtros de libros en admin
    const adminSearchLibros = document.getElementById('admin-search-libros');
    const adminCategoriaFilter = document.getElementById('admin-categoria-filter');
    
    if (adminSearchLibros) {
        adminSearchLibros.addEventListener('input', filtrarLibrosAdmin);
    }
    if (adminCategoriaFilter) {
        adminCategoriaFilter.addEventListener('change', filtrarLibrosAdmin);
    }
    
    // Eventos de modales
    const modales = document.querySelectorAll('.modal');
    modales.forEach(modal => {
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

function cambiarTabAdmin(tab) {
    const tabBtns = document.querySelectorAll('.admin-tab-btn');
    const sections = document.querySelectorAll('.admin-section');
    
    tabBtns.forEach(btn => btn.classList.remove('active'));
    sections.forEach(section => section.style.display = 'none');
    
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-section`).style.display = 'block';
}

function actualizarDashboard() {
    const totalUsuarios = document.getElementById('total-usuarios');
    const totalLibros = document.getElementById('total-libros');
    const totalVentas = document.getElementById('total-ventas');
    
    // Obtener datos del storage centralizado
    const usuariosCount = window.jsonStorage ? window.jsonStorage.getUsuarios().length : usuariosManager.getAll().length;
    const librosCount = window.jsonStorage ? window.jsonStorage.getLibros().length : librosManager.getAll().length;
    
    if (totalUsuarios) totalUsuarios.textContent = usuariosCount;
    if (totalLibros) totalLibros.textContent = librosCount;
    if (totalVentas) totalVentas.textContent = Math.floor(Math.random() * 100); // Simulado
    
    console.log('[ADMIN] Dashboard actualizado:', { usuarios: usuariosCount, libros: librosCount });
}

function mostrarUsuarios() {
    const tbody = document.getElementById('usuarios-table-body');
    if (!tbody) return;
    
    // Obtener usuarios del storage centralizado para incluir los nuevos registros
    const usuariosFromStorage = window.jsonStorage ? window.jsonStorage.getUsuarios() : [];
    const usuarios = usuariosFromStorage.length > 0 ? usuariosFromStorage : usuariosManager.getAll();
    
    console.log('[ADMIN] Mostrando usuarios:', usuarios.length);
    
    tbody.innerHTML = usuarios.map(usuario => `
        <tr>
            <td>${usuario.id}</td>
            <td>${usuario.nombre}</td>
            <td>${usuario.email}</td>
            <td>
                <span class="badge ${usuario.rol === 'ADMIN' ? 'badge-admin' : 'badge-user'}">
                    ${usuario.rol}
                </span>
            </td>
            <td>${usuario.fechaRegistro}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editarUsuarioCompleto(${usuario.id})" title="Editar usuario">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-edit" onclick="toggleRolUsuario(${usuario.id})" title="Cambiar rol">
                        <i class="fas fa-user-cog"></i>
                    </button>
                    <button class="btn-delete" onclick="eliminarUsuario(${usuario.id})" title="Eliminar usuario">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function mostrarLibrosAdmin(librosAMostrar = null) {
    const tbody = document.getElementById('libros-table-body');
    if (!tbody) return;
    
    // Obtener libros del storage centralizado para incluir los nuevos
    let libros;
    if (librosAMostrar) {
        libros = librosAMostrar;
    } else {
        const librosFromStorage = window.jsonStorage ? window.jsonStorage.getLibros() : [];
        libros = librosFromStorage.length > 0 ? librosFromStorage : librosManager.getAll();
    }
    
    console.log('[ADMIN] Mostrando libros:', libros.length);
    tbody.innerHTML = libros.map(libro => `
        <tr>
            <td>${libro.id}</td>
            <td>
                <img src="${libro.imagen}" alt="${libro.titulo}" 
                     style="width: 50px; height: 60px; object-fit: cover; border-radius: 5px;"
                     onerror="this.src='https://via.placeholder.com/50x60?text=Sin+Imagen'">
            </td>
            <td>${libro.titulo}</td>
            <td>${libro.autor}</td>
            <td>${libro.categoria}</td>
            <td>S/ ${libro.precio.toFixed(2)}</td>
            <td>${libro.stock}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editarLibro(${libro.id})" title="Editar libro">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="eliminarLibro(${libro.id})" title="Eliminar libro">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filtrarLibrosAdmin() {
    const searchTerm = document.getElementById('admin-search-libros')?.value.toLowerCase() || '';
    const categoriaSeleccionada = document.getElementById('admin-categoria-filter')?.value || '';
    
    let librosFiltrados = librosManager.getAll();
    
    // Filtrar por búsqueda
    if (searchTerm) {
        librosFiltrados = librosManager.search(searchTerm);
    }
    
    // Filtrar por categoría
    if (categoriaSeleccionada) {
        librosFiltrados = librosFiltrados.filter(libro => libro.categoria === categoriaSeleccionada);
    }
    
    mostrarLibrosAdmin(librosFiltrados);
}

function abrirModalLibro(libro = null) {
    const modal = document.getElementById('libro-modal');
    const title = document.getElementById('libro-modal-title');
    const form = document.getElementById('libro-form');
    
    console.log('[ADMIN] Abriendo modal libro:', libro ? 'EDITAR' : 'AGREGAR', libro);
    
    libroEditando = libro;
    
    if (libro && libro.id) {
        // Modo EDITAR
        title.textContent = 'Editar Libro';
        document.getElementById('libro-id').value = libro.id || '';
        document.getElementById('libro-titulo').value = libro.titulo || '';
        document.getElementById('libro-autor').value = libro.autor || '';
        document.getElementById('libro-categoria').value = libro.categoria || '';
        document.getElementById('libro-isbn').value = libro.isbn || '';
        document.getElementById('libro-precio').value = libro.precio || '';
        document.getElementById('libro-stock').value = libro.stock || '';
        document.getElementById('libro-imagen').value = libro.imagen || '';
        document.getElementById('libro-descripcion').value = libro.descripcion || '';
    } else {
        // Modo AGREGAR
        title.textContent = 'Agregar Libro';
        libroEditando = null;
        
        // Limpiar todos los campos explícitamente
        document.getElementById('libro-id').value = '';
        document.getElementById('libro-titulo').value = '';
        document.getElementById('libro-autor').value = '';
        document.getElementById('libro-categoria').value = '';
        document.getElementById('libro-isbn').value = '';
        document.getElementById('libro-precio').value = '';
        document.getElementById('libro-stock').value = '';
        document.getElementById('libro-imagen').value = '';
        document.getElementById('libro-descripcion').value = '';
        
        // También hacer reset del form como backup
        form.reset();
    }
    
    modal.style.display = 'block';
}

// Hacer función global
window.abrirModalLibro = abrirModalLibro;

function cerrarModalLibro() {
    const modal = document.getElementById('libro-modal');
    modal.style.display = 'none';
    libroEditando = null;
}

function guardarLibro(e) {
    e.preventDefault();
    
    const formData = {
        titulo: document.getElementById('libro-titulo').value.trim(),
        autor: document.getElementById('libro-autor').value.trim(),
        categoria: document.getElementById('libro-categoria').value,
        isbn: document.getElementById('libro-isbn').value.trim(),
        precio: parseFloat(document.getElementById('libro-precio').value) || 0,
        stock: parseInt(document.getElementById('libro-stock').value) || 0,
        imagen: document.getElementById('libro-imagen').value.trim(),
        descripcion: document.getElementById('libro-descripcion').value.trim()
    };
    
    // Validaciones básicas
    if (!formData.titulo || !formData.autor || !formData.categoria || !formData.isbn) {
        mostrarMensajeAdmin('Por favor, complete todos los campos obligatorios', 'error');
        return;
    }
    
    try {
        if (libroEditando && libroEditando.id) {
            // Editar libro existente
            console.log('[ADMIN] Editando libro ID:', libroEditando.id, formData);
            if (window.jsonStorage) {
                window.jsonStorage.updateLibro(libroEditando.id, formData);
                console.log('[ADMIN] Libro actualizado via storage:', formData);
            } else {
                librosManager.update(libroEditando.id, formData);
            }
            mostrarMensajeAdmin('Libro actualizado exitosamente', 'success');
        } else {
            // Agregar nuevo libro
            console.log('[ADMIN] Agregando nuevo libro:', formData);
            if (window.jsonStorage) {
                const nuevoLibro = window.jsonStorage.addLibro(formData);
                console.log('[ADMIN] Libro creado via storage:', nuevoLibro);
            } else {
                librosManager.create(formData);
            }
            mostrarMensajeAdmin('Libro agregado exitosamente', 'success');
        }
        
        // Actualizar la interfaz
        mostrarLibrosAdmin();
        actualizarDashboard();
        cerrarModalLibro();
        
    } catch (error) {
        console.error('Error al guardar libro:', error);
        mostrarMensajeAdmin(`Error: ${error.message}`, 'error');
    }
}

function editarLibro(id) {
    // Obtener libro del storage o manager
    const librosFromStorage = window.jsonStorage ? window.jsonStorage.getLibros() : [];
    const libros = librosFromStorage.length > 0 ? librosFromStorage : librosManager.getAll();
    const libro = libros.find(l => l.id == id);
    
    if (libro) {
        abrirModalLibro(libro);
    }
}

function eliminarLibro(id) {
    // Obtener libro del storage o manager
    const librosFromStorage = window.jsonStorage ? window.jsonStorage.getLibros() : [];
    const libros = librosFromStorage.length > 0 ? librosFromStorage : librosManager.getAll();
    const libro = libros.find(l => l.id == id);
    
    if (!libro) return;
    
    if (confirm(`¿Estás seguro de que quieres eliminar el libro "${libro.titulo}"?`)) {
        try {
            if (window.jsonStorage) {
                window.jsonStorage.deleteLibro(id);
                console.log('[ADMIN] Libro eliminado via storage:', id);
            } else {
                librosManager.delete(id);
            }
            
            mostrarLibrosAdmin();
            actualizarDashboard();
            mostrarMensajeAdmin('Libro eliminado exitosamente', 'success');
        } catch (error) {
            mostrarMensajeAdmin(`Error: ${error.message}`, 'error');
        }
    }
}

function toggleRolUsuario(id) {
    try {
        const usuario = usuariosManager.toggleRole(id);
        mostrarUsuarios();
        actualizarDashboard();
        mostrarMensajeAdmin(`Rol de ${usuario.nombre} cambiado a ${usuario.rol}`, 'success');
    } catch (error) {
        mostrarMensajeAdmin(`Error: ${error.message}`, 'error');
    }
}

function eliminarUsuario(id) {
    const usuario = usuariosManager.getById(id);
    if (!usuario) return;
    
    if (confirm(`¿Estás seguro de que quieres eliminar al usuario "${usuario.nombre}"?`)) {
        try {
            usuariosManager.delete(id);
            
            // Los datos se sincronizan automáticamente
            
            mostrarUsuarios();
            actualizarDashboard();
            mostrarMensajeAdmin('Usuario eliminado exitosamente', 'success');
        } catch (error) {
            mostrarMensajeAdmin(`Error: ${error.message}`, 'error');
        }
    }
}

// Funciones para modal de usuario
let usuarioEditando = null;

function editarUsuarioCompleto(id) {
    // Obtener usuario del storage o manager
    const usuariosFromStorage = window.jsonStorage ? window.jsonStorage.getUsuarios() : [];
    const usuarios = usuariosFromStorage.length > 0 ? usuariosFromStorage : usuariosManager.getAll();
    const usuario = usuarios.find(u => u.id == id);
    
    if (!usuario) {
        mostrarMensajeAdmin('Usuario no encontrado', 'error');
        return;
    }
    
    usuarioEditando = usuario;
    abrirModalUsuario(usuario);
}

function abrirModalUsuario(usuario) {
    const modal = document.getElementById('usuario-modal');
    const title = document.getElementById('usuario-modal-title');
    
    if (!modal || !usuario) return;
    
    title.textContent = 'Editar Usuario';
    
    // Llenar el formulario
    document.getElementById('usuario-id').value = usuario.id;
    document.getElementById('usuario-nombre').value = usuario.nombre || '';
    document.getElementById('usuario-email').value = usuario.email || '';
    document.getElementById('usuario-password').value = ''; // Siempre vacío por seguridad
    document.getElementById('usuario-rol').value = usuario.rol || 'USUARIO';
    document.getElementById('usuario-fecha-registro').value = usuario.fechaRegistro || '';
    document.getElementById('usuario-activo').checked = usuario.activo !== false;
    
    modal.style.display = 'block';
}

function cerrarModalUsuario() {
    const modal = document.getElementById('usuario-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    usuarioEditando = null;
}

function guardarUsuario(e) {
    e.preventDefault();
    
    if (!usuarioEditando) {
        mostrarMensajeAdmin('Error: No hay usuario para editar', 'error');
        return;
    }
    
    const formData = {
        nombre: document.getElementById('usuario-nombre').value.trim(),
        email: document.getElementById('usuario-email').value.trim(),
        rol: document.getElementById('usuario-rol').value,
        fechaRegistro: document.getElementById('usuario-fecha-registro').value,
        activo: document.getElementById('usuario-activo').checked
    };
    
    // Solo incluir password si se proporcionó uno nuevo
    const newPassword = document.getElementById('usuario-password').value.trim();
    if (newPassword) {
        if (newPassword.length < 6) {
            mostrarMensajeAdmin('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        formData.password = newPassword;
    }
    
    try {
        // Validaciones
        if (!formData.nombre || formData.nombre.length < 2) {
            throw new Error('El nombre debe tener al menos 2 caracteres');
        }
        
        if (!formData.email || !isValidEmail(formData.email)) {
            throw new Error('El email debe tener un formato válido');
        }
        
        // Verificar email único (excepto el usuario actual)
        const usuariosFromStorage = window.jsonStorage ? window.jsonStorage.getUsuarios() : [];
        const usuarios = usuariosFromStorage.length > 0 ? usuariosFromStorage : usuariosManager.getAll();
        const emailExists = usuarios.some(u => u.id != usuarioEditando.id && u.email === formData.email);
        
        if (emailExists) {
            throw new Error('Ya existe un usuario con ese email');
        }
        
        // Actualizar usuario
        if (window.jsonStorage) {
            // Usar storage directo
            const usuarioActualizado = window.jsonStorage.updateUsuario(usuarioEditando.id, formData);
            console.log('[ADMIN] Usuario actualizado via storage:', usuarioActualizado);
        } else {
            // Usar manager como fallback
            usuariosManager.update(usuarioEditando.id, formData);
        }
        
        // Actualizar la interfaz
        mostrarUsuarios();
        actualizarDashboard();
        cerrarModalUsuario();
        
        mostrarMensajeAdmin('Usuario actualizado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        mostrarMensajeAdmin(`Error: ${error.message}`, 'error');
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Actualizar función de eliminar usuario para usar storage
function eliminarUsuario(id) {
    // Obtener usuario del storage
    const usuariosFromStorage = window.jsonStorage ? window.jsonStorage.getUsuarios() : [];
    const usuarios = usuariosFromStorage.length > 0 ? usuariosFromStorage : usuariosManager.getAll();
    const usuario = usuarios.find(u => u.id == id);
    
    if (!usuario) return;
    
    if (confirm(`¿Estás seguro de que quieres eliminar al usuario "${usuario.nombre}"?`)) {
        try {
            if (window.jsonStorage) {
                window.jsonStorage.deleteUsuario(id);
            } else {
                usuariosManager.delete(id);
            }
            
            mostrarUsuarios();
            actualizarDashboard();
            mostrarMensajeAdmin('Usuario eliminado exitosamente', 'success');
        } catch (error) {
            mostrarMensajeAdmin(`Error: ${error.message}`, 'error');
        }
    }
}

// Actualizar función toggle rol para usar storage
function toggleRolUsuario(id) {
    try {
        // Obtener usuario del storage
        const usuariosFromStorage = window.jsonStorage ? window.jsonStorage.getUsuarios() : [];
        const usuarios = usuariosFromStorage.length > 0 ? usuariosFromStorage : usuariosManager.getAll();
        const usuario = usuarios.find(u => u.id == id);
        
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        
        if (usuario.email === 'admin@librospequenos.com') {
            throw new Error('No se puede cambiar el rol del administrador principal');
        }
        
        const nuevoRol = usuario.rol === 'ADMIN' ? 'USUARIO' : 'ADMIN';
        
        if (window.jsonStorage) {
            window.jsonStorage.updateUsuario(id, { rol: nuevoRol });
        } else {
            usuariosManager.toggleRole(id);
        }
        
        mostrarUsuarios();
        actualizarDashboard();
        mostrarMensajeAdmin(`Rol de ${usuario.nombre} cambiado a ${nuevoRol}`, 'success');
    } catch (error) {
        mostrarMensajeAdmin(`Error: ${error.message}`, 'error');
    }
}

// Hacer funciones globales
window.editarLibro = editarLibro;
window.eliminarLibro = eliminarLibro;
window.toggleRolUsuario = toggleRolUsuario;
window.eliminarUsuario = eliminarUsuario;
window.editarUsuarioCompleto = editarUsuarioCompleto;

function mostrarMensajeAdmin(mensaje, tipo) {
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
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (document.body.contains(toast)) {
            document.body.removeChild(toast);
        }
    }, 3000);
}