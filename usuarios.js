// ===== Usuarios y Roles | Punto y Sal =====
// Contrato (clientes-service, vía Gateway):
//   GET    /api/v1/usuarios              -> id_usuario, correo, rol, activo, fecha_creacion
//   POST   /api/v1/usuarios              <- { correo, password, rol }
//   PUT    /api/v1/usuarios/{id}         <- { correo?, rol?, activo? }   (sin password)
//   DELETE /api/v1/usuarios/{id}         -> desactiva (no puede desactivarse a sí mismo)
//   GET    /api/v1/roles                 -> roles disponibles (administrador, cliente)

const ROLES_OFICIALES = ['administrador', 'cliente'];

const el = {
  form: document.getElementById('usuarioForm'),
  formTitle: document.getElementById('formTitle'),
  correo: document.getElementById('correo'),
  rol: document.getElementById('rolForm'),
  password: document.getElementById('password'),
  passwordField: document.getElementById('passwordField'),
  editId: document.getElementById('editId'),
  editHint: document.getElementById('editHint'),
  submit: document.getElementById('submitBtn'),
  cancel: document.getElementById('cancelBtn'),
  tbody: document.getElementById('usuariosTbody'),
  rolesTbody: document.getElementById('rolesTbody'),
};

function iniciar() {
  API.iniciarNavbar();
  document.getElementById('usuarioForm').addEventListener('submit', guardarUsuario);
  document.getElementById('cancelBtn').addEventListener('click', salirDeEdicion);
  cargarRoles();
  cargarUsuarios();
}

// ----- Usuarios -------------------------------------------------------

async function cargarUsuarios() {
  try {
    const usuarios = API.lista(await API.get('/api/v1/usuarios'));
    pintarUsuarios(usuarios);
  } catch (error) {
    API.mostrarMensaje(`No se pudieron cargar los usuarios. ${error.message}`);
  }
}

function pintarUsuarios(usuarios) {
  el.tbody.replaceChildren();

  if (!usuarios.length) {
    const tr = document.createElement('tr');
    const td = API.celda('No hay usuarios registrados.');
    td.colSpan = 6;
    td.className = 'table-empty';
    tr.appendChild(td);
    el.tbody.appendChild(tr);
    return;
  }

  const yo = API.usuarioActual().id_usuario;

  for (const u of usuarios) {
    const tr = document.createElement('tr');
    tr.appendChild(API.celda(u.id_usuario));
    tr.appendChild(API.celda(u.correo));

    const tdRol = document.createElement('td');
    tdRol.appendChild(API.badge(u.rol, ROLES_OFICIALES.includes(u.rol) ? u.rol : 'inactivo'));
    tr.appendChild(tdRol);

    const tdEstado = document.createElement('td');
    tdEstado.appendChild(API.badge(u.activo ? 'Activo' : 'Inactivo', u.activo ? 'activo' : 'inactivo'));
    tr.appendChild(tdEstado);

    tr.appendChild(API.celda(API.formatearFecha(u.fecha_creacion)));

    const tdAcciones = document.createElement('td');
    tdAcciones.className = 'table-actions';
    tdAcciones.appendChild(API.boton('Editar', 'btn--secondary', () => entrarEnEdicion(u)));

    const esYo = u.id_usuario === yo;
    if (u.activo) {
      const b = API.boton('Desactivar', 'btn--danger', () => desactivarUsuario(u));
      if (esYo) {
        b.disabled = true;
        b.title = 'No puedes desactivar tu propia cuenta';
      }
      tdAcciones.appendChild(b);
    } else {
      tdAcciones.appendChild(API.boton('Reactivar', 'btn--success', () => reactivarUsuario(u)));
    }
    tr.appendChild(tdAcciones);

    el.tbody.appendChild(tr);
  }
}

async function guardarUsuario(e) {
  e.preventDefault();

  const editId = el.editId.value;
  const correo = el.correo.value.trim();
  const rol = el.rol.value;
  const password = el.password.value;

  // Validaciones (mismas reglas que el backend)
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    el.correo.classList.add('is-invalid');
    return API.mostrarMensaje('Escribe un correo válido.');
  }
  if (!ROLES_OFICIALES.includes(rol)) {
    return API.mostrarMensaje('Selecciona un rol válido.');
  }
  if (!editId && (password.length < 8 || password.length > 72)) {
    el.password.classList.add('is-invalid');
    return API.mostrarMensaje('La contraseña debe tener entre 8 y 72 caracteres.');
  }

  el.submit.disabled = true;
  try {
    if (editId) {
      await API.put(`/api/v1/usuarios/${editId}`, { correo, rol });
      API.mostrarMensaje('Usuario actualizado.', 'exito');
    } else {
      await API.post('/api/v1/usuarios', { correo, password, rol });
      API.mostrarMensaje('Usuario creado.', 'exito');
    }
    salirDeEdicion();
    cargarUsuarios();
  } catch (error) {
    const texto = error.status === 409 ? 'Ya existe un usuario con ese correo.' : error.message;
    API.mostrarMensaje(texto);
  } finally {
    el.submit.disabled = false;
  }
}

async function desactivarUsuario(u) {
  if (!confirm(`¿Desactivar a ${u.correo}? No podrá iniciar sesión.`)) return;
  try {
    await API.delete(`/api/v1/usuarios/${u.id_usuario}`);
    API.mostrarMensaje('Usuario desactivado.', 'exito');
    cargarUsuarios();
  } catch (error) {
    API.mostrarMensaje(error.message);
  }
}

async function reactivarUsuario(u) {
  try {
    await API.put(`/api/v1/usuarios/${u.id_usuario}`, { activo: true });
    API.mostrarMensaje('Usuario reactivado.', 'exito');
    cargarUsuarios();
  } catch (error) {
    API.mostrarMensaje(error.message);
  }
}

function entrarEnEdicion(u) {
  el.editId.value = u.id_usuario;
  el.correo.value = u.correo;
  el.rol.value = u.rol;
  el.password.value = '';
  el.password.required = false;
  el.passwordField.hidden = true;
  el.editHint.hidden = false;
  el.formTitle.textContent = `Editar usuario #${u.id_usuario}`;
  el.submit.textContent = 'Guardar cambios';
  el.cancel.classList.remove('hidden');
  el.correo.focus();
}

function salirDeEdicion() {
  el.form.reset();
  el.editId.value = '';
  el.password.required = true;
  el.passwordField.hidden = false;
  el.editHint.hidden = true;
  el.formTitle.textContent = 'Nuevo usuario';
  el.submit.textContent = 'Crear';
  el.cancel.classList.add('hidden');
  [el.correo, el.password].forEach((i) => i.classList.remove('is-invalid'));
}

// ----- Roles ----------------------------------------------------------

async function cargarRoles() {
  try {
    const roles = API.lista(await API.get('/api/v1/roles'));
    pintarRoles(roles);
    llenarSelectorDeRoles(roles);
  } catch {
    // Si falla, el formulario conserva las dos opciones oficiales
    pintarRoles([]);
  }
}

function pintarRoles(roles) {
  el.rolesTbody.replaceChildren();
  if (!roles.length) {
    const tr = document.createElement('tr');
    const td = API.celda('No se pudieron cargar los roles.');
    td.colSpan = 3;
    td.className = 'table-empty';
    tr.appendChild(td);
    el.rolesTbody.appendChild(tr);
    return;
  }
  for (const r of roles) {
    const tr = document.createElement('tr');
    tr.appendChild(API.celda(r.nombre));
    tr.appendChild(API.celda(r.descripcion || ''));
    const td = document.createElement('td');
    const activo = r.activo !== false;
    td.appendChild(API.badge(activo ? 'Activo' : 'Inactivo', activo ? 'activo' : 'inactivo'));
    tr.appendChild(td);
    el.rolesTbody.appendChild(tr);
  }
}

// Solo roles oficiales y activos; nunca se inventa un tercer rol
function llenarSelectorDeRoles(roles) {
  const validos = roles
    .filter((r) => r.activo !== false && ROLES_OFICIALES.includes(r.nombre))
    .map((r) => r.nombre);
  if (!validos.length) return;

  el.rol.replaceChildren();
  for (const nombre of validos) {
    const opt = document.createElement('option');
    opt.value = nombre;
    opt.textContent = nombre.charAt(0).toUpperCase() + nombre.slice(1);
    el.rol.appendChild(opt);
  }
}

// ----- Arranque -------------------------------------------------------
if (API.requerirRol('administrador')) {
  iniciar();
}
