// Sistema de almacenamiento centralizado que simula archivos JSON
class JSONStorage {
    constructor() {
        this.storageKey = 'libros_pequenos_db';
        this.listeners = new Map();
        this.initializeStorage();
    }

    initializeStorage() {
        // Verificar si ya existe data en localStorage
        const existingData = localStorage.getItem(this.storageKey);
        
        if (!existingData) {
            // Si no existe, crear con datos iniciales
            const initialData = {
                libros: LIBROS_DATA || [],
                usuarios: USUARIOS_DATA || [],
                version: Date.now(),
                lastModified: new Date().toISOString()
            };
            this.saveData(initialData);
            console.log('[STORAGE] Base de datos inicializada con datos por defecto');
        } else {
            console.log('[STORAGE] Base de datos existente cargada');
        }

        // Escuchar cambios en localStorage de otras pestañas/ventanas
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                this.notifyListeners('storage_changed', JSON.parse(e.newValue));
            }
        });
    }

    // Obtener todos los datos
    getAllData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : null;
    }

    // Guardar todos los datos
    saveData(data) {
        data.version = Date.now();
        data.lastModified = new Date().toISOString();
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        
        // Notificar a los listeners sobre el cambio
        this.notifyListeners('data_updated', data);
    }

    // Obtener libros
    getLibros() {
        const data = this.getAllData();
        return data ? data.libros : [];
    }

    // Guardar libros
    saveLibros(libros) {
        const data = this.getAllData();
        data.libros = libros;
        this.saveData(data);
        console.log('[STORAGE] Libros actualizados:', libros.length);
    }

    // Obtener usuarios
    getUsuarios() {
        const data = this.getAllData();
        return data ? data.usuarios : [];
    }

    // Guardar usuarios
    saveUsuarios(usuarios) {
        const data = this.getAllData();
        data.usuarios = usuarios;
        this.saveData(data);
        console.log('[STORAGE] Usuarios actualizados:', usuarios.length);
    }

    // Agregar un libro
    addLibro(libro) {
        const libros = this.getLibros();
        libro.id = this.generateId(libros);
        libros.push(libro);
        this.saveLibros(libros);
        console.log('[JSONStorage] Libro agregado:', libro);
        console.log('[JSONStorage] Total libros:', libros.length);
        return libro;
    }

    // Actualizar un libro
    updateLibro(id, libroData) {
        const libros = this.getLibros();
        const index = libros.findIndex(l => l.id == id);
        
        if (index === -1) {
            throw new Error('Libro no encontrado');
        }

        libros[index] = { ...libros[index], ...libroData };
        this.saveLibros(libros);
        return libros[index];
    }

    // Eliminar un libro
    deleteLibro(id) {
        const libros = this.getLibros();
        const index = libros.findIndex(l => l.id == id);
        
        if (index === -1) {
            throw new Error('Libro no encontrado');
        }

        const libroEliminado = libros.splice(index, 1)[0];
        this.saveLibros(libros);
        return libroEliminado;
    }

    // Agregar un usuario
    addUsuario(usuario) {
        const usuarios = this.getUsuarios();
        
        // Verificar email único
        if (usuarios.find(u => u.email === usuario.email)) {
            throw new Error('Ya existe un usuario con este email');
        }
        
        usuario.id = this.generateId(usuarios);
        usuarios.push(usuario);
        this.saveUsuarios(usuarios);
        console.log('[JSONStorage] Usuario agregado:', usuario);
        console.log('[JSONStorage] Total usuarios:', usuarios.length);
        return usuario;
    }

    // Actualizar un usuario
    updateUsuario(id, usuarioData) {
        const usuarios = this.getUsuarios();
        const index = usuarios.findIndex(u => u.id == id);
        
        if (index === -1) {
            throw new Error('Usuario no encontrado');
        }

        usuarios[index] = { ...usuarios[index], ...usuarioData };
        this.saveUsuarios(usuarios);
        return usuarios[index];
    }

    // Eliminar un usuario
    deleteUsuario(id) {
        const usuarios = this.getUsuarios();
        const index = usuarios.findIndex(u => u.id == id);
        
        if (index === -1) {
            throw new Error('Usuario no encontrado');
        }

        const usuarioEliminado = usuarios.splice(index, 1)[0];
        this.saveUsuarios(usuarios);
        return usuarioEliminado;
    }

    // Generar ID único
    generateId(array) {
        if (array.length === 0) return 1;
        return Math.max(...array.map(item => item.id || 0)) + 1;
    }

    // Sistema de listeners para notificar cambios
    addListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    removeListener(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    notifyListeners(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('[STORAGE] Error en listener:', error);
                }
            });
        }
    }

    // Exportar datos (para debug o backup)
    exportData() {
        return this.getAllData();
    }

    // Importar datos (para restaurar backup)
    importData(data) {
        this.saveData(data);
    }

    // Resetear a datos iniciales
    reset() {
        localStorage.removeItem(this.storageKey);
        this.initializeStorage();
    }

    // Obtener estadísticas
    getStats() {
        const data = this.getAllData();
        return {
            totalLibros: data.libros.length,
            totalUsuarios: data.usuarios.length,
            version: data.version,
            lastModified: data.lastModified,
            categorias: [...new Set(data.libros.map(l => l.categoria))],
            stockTotal: data.libros.reduce((sum, l) => sum + (l.stock || 0), 0)
        };
    }
}

// Clase para sincronizar datos entre páginas
class DataSynchronizer {
    constructor(storage) {
        this.storage = storage;
        this.setupSynchronization();
    }

    setupSynchronization() {
        // Escuchar cambios en el storage
        this.storage.addListener('data_updated', (data) => {
            this.syncGlobalVariables(data);
        });

        this.storage.addListener('storage_changed', (data) => {
            this.syncGlobalVariables(data);
            this.refreshUI();
        });
    }

    // Sincronizar variables globales
    syncGlobalVariables(data) {
        if (typeof window.libros !== 'undefined') {
            window.libros = [...data.libros];
            console.log('[SYNC] Libros globales actualizados:', window.libros.length);
        }

        if (typeof window.usuarios !== 'undefined') {
            window.usuarios = [...data.usuarios];
            console.log('[SYNC] Usuarios globales actualizados:', window.usuarios.length);
        }

        // Actualizar managers si existen
        if (typeof window.librosManager !== 'undefined') {
            window.librosManager.loadData(data.libros);
        }

        if (typeof window.usuariosManager !== 'undefined') {
            window.usuariosManager.loadData(data.usuarios);
        }
    }

    // Refrescar UI en todas las páginas
    refreshUI() {
        // Refrescar catálogo de libros si existe
        if (typeof window.mostrarLibros === 'function' && document.getElementById('libros-container')) {
            setTimeout(() => {
                window.mostrarLibros(window.libros);
            }, 100);
        }

        // Refrescar página de libros específica si existe
        if (typeof window.mostrarLibrosPage === 'function' && document.getElementById('libros-container')) {
            setTimeout(() => {
                window.librosFiltrados = [...window.libros];
                window.mostrarLibrosPage();
            }, 100);
        }

        // Refrescar admin si existe
        if (typeof window.actualizarDashboard === 'function') {
            setTimeout(() => {
                window.actualizarDashboard();
                if (typeof window.mostrarLibrosAdmin === 'function') {
                    window.mostrarLibrosAdmin();
                }
                if (typeof window.mostrarUsuarios === 'function') {
                    window.mostrarUsuarios();
                }
            }, 100);
        }

        console.log('[SYNC] UI refrescada en todas las páginas');
    }

    // Forzar sincronización
    forceSync() {
        const data = this.storage.getAllData();
        this.syncGlobalVariables(data);
        this.refreshUI();
    }
}

// Instancias globales
window.jsonStorage = new JSONStorage();
window.dataSynchronizer = new DataSynchronizer(window.jsonStorage);

// Funciones de utilidad globales
window.getLibrosFromStorage = () => window.jsonStorage.getLibros();
window.getUsuariosFromStorage = () => window.jsonStorage.getUsuarios();
window.syncData = () => window.dataSynchronizer.forceSync();

console.log('[STORAGE] Sistema de almacenamiento JSON inicializado');
