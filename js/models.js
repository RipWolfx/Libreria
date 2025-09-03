// Modelos para el sistema de librería

class LibroModel {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.titulo = data.titulo || '';
        this.autor = data.autor || '';
        this.categoria = data.categoria || '';
        this.precio = parseFloat(data.precio) || 0;
        this.stock = parseInt(data.stock) || 0;
        this.descripcion = data.descripcion || '';
        this.imagen = data.imagen || 'https://via.placeholder.com/300x400?text=Sin+Imagen';
        this.isbn = data.isbn || this.generateISBN();
        this.fechaCreacion = data.fechaCreacion || new Date().toISOString();
    }

    generateId() {
        // Generar ID único basado en timestamp y número aleatorio
        return Date.now() + Math.floor(Math.random() * 1000);
    }

    generateISBN() {
        // Generar ISBN ficticio
        return `978-84-376-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${Math.floor(Math.random() * 10)}`;
    }

    validate() {
        const errors = [];
        
        if (!this.titulo || this.titulo.trim().length < 2) {
            errors.push('El título debe tener al menos 2 caracteres');
        }
        
        if (!this.autor || this.autor.trim().length < 2) {
            errors.push('El autor debe tener al menos 2 caracteres');
        }
        
        if (!this.categoria || this.categoria.trim().length < 2) {
            errors.push('La categoría es requerida');
        }
        
        if (this.precio < 0) {
            errors.push('El precio no puede ser negativo');
        }
        
        if (this.stock < 0) {
            errors.push('El stock no puede ser negativo');
        }
        
        if (!this.descripcion || this.descripcion.trim().length < 10) {
            errors.push('La descripción debe tener al menos 10 caracteres');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    toJSON() {
        return {
            id: this.id,
            titulo: this.titulo,
            autor: this.autor,
            categoria: this.categoria,
            precio: this.precio,
            stock: this.stock,
            descripcion: this.descripcion,
            imagen: this.imagen,
            isbn: this.isbn,
            fechaCreacion: this.fechaCreacion
        };
    }
}

class UsuarioModel {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.nombre = data.nombre || '';
        this.email = data.email || '';
        this.password = data.password || '';
        this.rol = data.rol || 'USUARIO';
        this.fechaRegistro = data.fechaRegistro || new Date().toISOString().split('T')[0];
        this.activo = data.activo !== undefined ? data.activo : true;
    }

    generateId() {
        return Date.now() + Math.floor(Math.random() * 1000);
    }

    validate() {
        const errors = [];
        
        if (!this.nombre || this.nombre.trim().length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
        }
        
        if (!this.email || !this.isValidEmail(this.email)) {
            errors.push('El email debe tener un formato válido');
        }
        
        if (!this.password || this.password.length < 6) {
            errors.push('La contraseña debe tener al menos 6 caracteres');
        }
        
        if (!['ADMIN', 'USUARIO'].includes(this.rol)) {
            errors.push('El rol debe ser ADMIN o USUARIO');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    toJSON() {
        return {
            id: this.id,
            nombre: this.nombre,
            email: this.email,
            password: this.password,
            rol: this.rol,
            fechaRegistro: this.fechaRegistro,
            activo: this.activo
        };
    }
}

// Clase para manejar la colección de libros
class LibrosManager {
    constructor() {
        this.libros = [];
        this.nextId = 1;
    }

    loadData(librosData) {
        this.libros = librosData.map(libro => new LibroModel(libro));
        this.nextId = Math.max(...this.libros.map(l => l.id)) + 1;
    }

    getAll() {
        return this.libros;
    }

    getById(id) {
        return this.libros.find(libro => libro.id == id);
    }

    create(libroData) {
        const libro = new LibroModel(libroData);
        const validation = libro.validate();
        
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        // Verificar que no exista un libro con el mismo título y autor
        const exists = this.libros.some(l => 
            l.titulo.toLowerCase() === libro.titulo.toLowerCase() && 
            l.autor.toLowerCase() === libro.autor.toLowerCase()
        );

        if (exists) {
            throw new Error('Ya existe un libro con ese título y autor');
        }

        this.libros.push(libro);
        this.saveToStorage();
        return libro;
    }

    update(id, libroData) {
        const index = this.libros.findIndex(libro => libro.id == id);
        if (index === -1) {
            throw new Error('Libro no encontrado');
        }

        const libroActualizado = new LibroModel({...this.libros[index].toJSON(), ...libroData});
        const validation = libroActualizado.validate();
        
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        this.libros[index] = libroActualizado;
        this.saveToStorage();
        return libroActualizado;
    }

    delete(id) {
        const index = this.libros.findIndex(libro => libro.id == id);
        if (index === -1) {
            throw new Error('Libro no encontrado');
        }

        const libroEliminado = this.libros.splice(index, 1)[0];
        this.saveToStorage();
        return libroEliminado;
    }

    search(query) {
        const searchTerm = query.toLowerCase();
        return this.libros.filter(libro => 
            libro.titulo.toLowerCase().includes(searchTerm) ||
            libro.autor.toLowerCase().includes(searchTerm) ||
            libro.categoria.toLowerCase().includes(searchTerm)
        );
    }

    filterByCategory(categoria) {
        if (!categoria) return this.libros;
        return this.libros.filter(libro => libro.categoria === categoria);
    }

    saveToStorage() {
        if (window.jsonStorage) {
            window.jsonStorage.saveLibros(this.libros.map(l => l.toJSON()));
        }
    }

    loadFromStorage() {
        if (window.jsonStorage) {
            const stored = window.jsonStorage.getLibros();
            if (stored && stored.length > 0) {
                this.loadData(stored);
            }
        }
    }
}

// Clase para manejar la colección de usuarios
class UsuariosManager {
    constructor() {
        this.usuarios = [];
        this.nextId = 1;
    }

    loadData(usuariosData) {
        this.usuarios = usuariosData.map(usuario => new UsuarioModel(usuario));
        this.nextId = Math.max(...this.usuarios.map(u => u.id)) + 1;
    }

    getAll() {
        return this.usuarios;
    }

    getById(id) {
        return this.usuarios.find(usuario => usuario.id == id);
    }

    getByEmail(email) {
        return this.usuarios.find(usuario => usuario.email === email);
    }

    create(usuarioData) {
        const usuario = new UsuarioModel(usuarioData);
        const validation = usuario.validate();
        
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        // Verificar que no exista un usuario con el mismo email
        if (this.getByEmail(usuario.email)) {
            throw new Error('Ya existe un usuario con ese email');
        }

        this.usuarios.push(usuario);
        this.saveToStorage();
        return usuario;
    }

    update(id, usuarioData) {
        const index = this.usuarios.findIndex(usuario => usuario.id == id);
        if (index === -1) {
            throw new Error('Usuario no encontrado');
        }

        const usuarioActualizado = new UsuarioModel({...this.usuarios[index].toJSON(), ...usuarioData});
        
        // Si se cambió el email, verificar que no exista otro usuario con ese email
        if (usuarioActualizado.email !== this.usuarios[index].email) {
            if (this.getByEmail(usuarioActualizado.email)) {
                throw new Error('Ya existe un usuario con ese email');
            }
        }

        const validation = usuarioActualizado.validate();
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        this.usuarios[index] = usuarioActualizado;
        this.saveToStorage();
        return usuarioActualizado;
    }

    delete(id) {
        const index = this.usuarios.findIndex(usuario => usuario.id == id);
        if (index === -1) {
            throw new Error('Usuario no encontrado');
        }

        // No permitir eliminar el admin principal
        if (this.usuarios[index].email === 'admin@librospequenos.com') {
            throw new Error('No se puede eliminar el administrador principal');
        }

        const usuarioEliminado = this.usuarios.splice(index, 1)[0];
        this.saveToStorage();
        return usuarioEliminado;
    }

    toggleRole(id) {
        const usuario = this.getById(id);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        if (usuario.email === 'admin@librospequenos.com') {
            throw new Error('No se puede cambiar el rol del administrador principal');
        }

        usuario.rol = usuario.rol === 'ADMIN' ? 'USUARIO' : 'ADMIN';
        this.saveToStorage();
        return usuario;
    }

    saveToStorage() {
        if (window.jsonStorage) {
            window.jsonStorage.saveUsuarios(this.usuarios.map(u => u.toJSON()));
        }
    }

    loadFromStorage() {
        if (window.jsonStorage) {
            const stored = window.jsonStorage.getUsuarios();
            if (stored && stored.length > 0) {
                this.loadData(stored);
            }
        }
    }
}

// Instancias globales
window.librosManager = new LibrosManager();
window.usuariosManager = new UsuariosManager();
