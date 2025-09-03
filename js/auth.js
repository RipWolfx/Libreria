// Variables para autenticación
let authMode = 'login';

// Inicialización para la página de autenticación
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('login.html')) {
        inicializarAuth();
    }
});

function inicializarAuth() {
    // Verificar si ya está autenticado
    if (usuarioActual) {
        window.location.href = '../index.html';
        return;
    }
    
    // Inicializar tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            
            // Actualizar botones activos
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar formulario correspondiente
            if (tab === 'login') {
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
                authMode = 'login';
            } else {
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
                authMode = 'register';
            }
            
            // Limpiar mensajes
            limpiarMensajeAuth();
        });
    });
    
    // Manejar formularios
    const loginFormElement = document.getElementById('login-form-element');
    const registerFormElement = document.getElementById('register-form-element');
    
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', manejarLogin);
    }
    
    if (registerFormElement) {
        registerFormElement.addEventListener('submit', manejarRegistro);
    }
}

// Manejar login
function manejarLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Buscar usuario
    const usuario = usuarios.find(u => u.email === email && u.password === password);
    
    if (usuario) {
        // Login exitoso
        localStorage.setItem('usuarioActual', JSON.stringify(usuario));
        
        // Actualizar variable global
        if (typeof window.usuarioActual !== 'undefined') {
            window.usuarioActual = usuario;
        }
        
        mostrarMensajeAuth('Login exitoso. Redirigiendo...', 'success');
        
        setTimeout(() => {
            if (usuario.rol === 'ADMIN') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = '../index.html';
            }
        }, 1500);
    } else {
        mostrarMensajeAuth('Email o contraseña incorrectos', 'error');
    }
}

// Manejar registro
function manejarRegistro(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('register-nombre').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    // Validaciones
    if (password !== confirmPassword) {
        mostrarMensajeAuth('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (password.length < 6) {
        mostrarMensajeAuth('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Verificar si el email ya existe
    if (usuarios.find(u => u.email === email)) {
        mostrarMensajeAuth('Este email ya está registrado', 'error');
        return;
    }
    
    // Crear nuevo usuario
    const nuevoUsuario = {
        id: usuarios.length + 1,
        nombre: nombre,
        email: email,
        password: password,
        rol: 'USUARIO',
        fechaRegistro: new Date().toISOString().split('T')[0]
    };
    
    // Usar el sistema de storage centralizado
    if (window.jsonStorage) {
        try {
            const usuarioCreado = window.jsonStorage.addUsuario(nuevoUsuario);
            console.log('[AUTH] Usuario creado via storage:', usuarioCreado);
            
            // Actualizar array local para mantener compatibilidad
            usuarios.push(nuevoUsuario);
        } catch (error) {
            console.error('[AUTH] Error al crear usuario:', error);
            mostrarMensajeAuth('Error al registrar usuario: ' + error.message, 'error');
            return;
        }
    } else {
        // Fallback al método anterior
        usuarios.push(nuevoUsuario);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
    }
    
    mostrarMensajeAuth('Registro exitoso. Puedes iniciar sesión ahora.', 'success');
    
    // Cambiar a tab de login
    setTimeout(() => {
        document.querySelector('[data-tab="login"]').click();
        document.getElementById('login-email').value = email;
    }, 2000);
}

// Mostrar mensaje de autenticación
function mostrarMensajeAuth(mensaje, tipo) {
    const messageDiv = document.getElementById('auth-message');
    messageDiv.textContent = mensaje;
    messageDiv.className = `auth-message ${tipo}`;
    messageDiv.style.display = 'block';
    
    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        limpiarMensajeAuth();
    }, 5000);
}

// Limpiar mensaje de autenticación
function limpiarMensajeAuth() {
    const messageDiv = document.getElementById('auth-message');
    messageDiv.style.display = 'none';
    messageDiv.textContent = '';
    messageDiv.className = 'auth-message';
}