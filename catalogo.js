// ===== Catálogo: Mesas y Platillos | Punto y Sal =====
// Contrato (catalogo-service, vía Gateway). Lectura pública; escritura solo administrador.
//   GET    /api/v1/catalogo/mesas               -> id_mesa, numero_mesa, capacidad, ubicacion, estado, activa
//   POST   /api/v1/catalogo/mesas               <- { numero_mesa 1-20, capacidad >0, ubicacion?, estado (disponible|mantenimiento), activa? }
//   PUT    /api/v1/catalogo/mesas/{id}          <- mismos campos, opcionales
//   DELETE /api/v1/catalogo/mesas/{id}          -> desactiva (activa=false)
//   GET    /api/v1/catalogo/platillos           -> id_platillo, nombre, descripcion, precio, disponible
//   POST   /api/v1/catalogo/platillos           <- { nombre 1-120, descripcion?, precio >=0, disponible? }
//   PUT    /api/v1/catalogo/platillos/{id}      <- mismos campos, opcionales
//   DELETE /api/v1/catalogo/platillos/{id}      -> marca disponible=false
//
// Administrador: gestiona todo. Cliente: solo consulta mesas activas y platillos disponibles.

const esAdmin = API.getRol() === 'administrador';
const precioFmt = new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' });

const m = {
  form: document.getElementById('mesaForm'),
  title: document.getElementById('mesaFormTitle'),
  numero: document.getElementById('numeroMesa'),
  capacidad: document.getElementById('capacidad'),
  ubicacion: document.getElementById('ubicacion'),
  estado: document.getElementById('estadoMesa'),
  editId: document.getElementById('editMesaId'),
  submit: document.getElementById('mesaSubmit'),
  cancel: document.getElementById('mesaCancel'),
  tbody: document.getElementById('mesasTbody'),
};

const p = {
  form: document.getElementById('platilloForm'),
  title: document.getElementById('platilloFormTitle'),
  nombre: document.getElementById('nombrePlatillo'),
  descripcion: document.getElementById('descripcion'),
  precio: document.getElementById('precio'),
  disponible: document.getElementById('disponible'),
  editId: document.getElementById('editPlatilloId'),
  submit: document.getElementById('platilloSubmit'),
  cancel: document.getElementById('platilloCancel'),
  tbody: document.getElementById('platillosTbody'),
};

function filaVacia(tbody, columnas, texto) {
  const tr = document.createElement('tr');
  const td = API.celda(texto);
  td.colSpan = columnas;
  td.className = 'table-empty';
  tr.appendChild(td);
  tbody.appendChild(tr);
}

function formatearPrecio(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? precioFmt.format(n) : String(valor ?? '');
}

const ESTADO_MESA = { disponible: 'Disponible', mantenimiento: 'Mantenimiento' };

// ===== Mesas ============================================================

async function cargarMesas() {
  try {
    let mesas = API.lista(await API.get('/api/v1/catalogo/mesas'));
    if (!esAdmin) mesas = mesas.filter((x) => x.activa !== false);
    pintarMesas(mesas);
  } catch (error) {
    API.mostrarMensaje(`No se pudieron cargar las mesas. ${error.message}`);
  }
}

function pintarMesas(mesas) {
  m.tbody.replaceChildren();
  const columnas = esAdmin ? 6 : 4;
  if (!mesas.length) return filaVacia(m.tbody, columnas, 'No hay mesas registradas.');

  for (const x of mesas) {
    const tr = document.createElement('tr');
    tr.appendChild(API.celda(x.numero_mesa));
    tr.appendChild(API.celda(`${x.capacidad} personas`));
    tr.appendChild(API.celda(x.ubicacion || 'Sin especificar'));

    const tdEstado = document.createElement('td');
    tdEstado.appendChild(API.badge(ESTADO_MESA[x.estado] || x.estado,
      x.estado === 'disponible' ? 'activo' : 'inactivo'));
    tr.appendChild(tdEstado);

    if (esAdmin) {
      const activa = x.activa !== false;
      const tdActiva = document.createElement('td');
      tdActiva.appendChild(API.badge(activa ? 'Sí' : 'No', activa ? 'activo' : 'inactivo'));
      tr.appendChild(tdActiva);

      const tdAcc = document.createElement('td');
      tdAcc.className = 'table-actions';
      tdAcc.appendChild(API.boton('Editar', 'btn--secondary', () => editarMesa(x)));
      tdAcc.appendChild(activa
        ? API.boton('Desactivar', 'btn--danger', () => desactivarMesa(x))
        : API.boton('Reactivar', 'btn--success', () => reactivarMesa(x)));
      tr.appendChild(tdAcc);
    }
    m.tbody.appendChild(tr);
  }
}

async function guardarMesa(e) {
  e.preventDefault();
  const editId = m.editId.value;
  const numero_mesa = m.numero.value.trim();
  const capacidad = Number(m.capacidad.value);
  const ubicacion = m.ubicacion.value.trim();

  if (!numero_mesa || numero_mesa.length > 20) {
    m.numero.classList.add('is-invalid');
    return API.mostrarMensaje('Escribe el número o nombre de la mesa (máximo 20 caracteres).');
  }
  if (!Number.isInteger(capacidad) || capacidad < 1) {
    m.capacidad.classList.add('is-invalid');
    return API.mostrarMensaje('La capacidad debe ser un número entero mayor que 0.');
  }

  const cuerpo = {
    numero_mesa,
    capacidad,
    ubicacion: ubicacion || null,
    estado: m.estado.value,
  };

  m.submit.disabled = true;
  try {
    if (editId) {
      await API.put(`/api/v1/catalogo/mesas/${editId}`, cuerpo);
      API.mostrarMensaje('Mesa actualizada.', 'exito');
    } else {
      await API.post('/api/v1/catalogo/mesas', cuerpo);
      API.mostrarMensaje('Mesa creada.', 'exito');
    }
    salirEdicionMesa();
    cargarMesas();
  } catch (error) {
    API.mostrarMensaje(error.status === 409 ? 'Ya existe una mesa con ese número.' : error.message);
  } finally {
    m.submit.disabled = false;
  }
}

async function desactivarMesa(x) {
  if (!confirm(`¿Desactivar la mesa ${x.numero_mesa}? Ya no se podrá reservar.`)) return;
  try {
    await API.delete(`/api/v1/catalogo/mesas/${x.id_mesa}`);
    API.mostrarMensaje('Mesa desactivada.', 'exito');
    cargarMesas();
  } catch (error) {
    API.mostrarMensaje(error.message);
  }
}

async function reactivarMesa(x) {
  try {
    await API.put(`/api/v1/catalogo/mesas/${x.id_mesa}`, { activa: true });
    API.mostrarMensaje('Mesa reactivada.', 'exito');
    cargarMesas();
  } catch (error) {
    API.mostrarMensaje(error.message);
  }
}

function editarMesa(x) {
  m.editId.value = x.id_mesa;
  m.numero.value = x.numero_mesa;
  m.capacidad.value = x.capacidad;
  m.ubicacion.value = x.ubicacion || '';
  m.estado.value = x.estado || 'disponible';
  m.title.textContent = `Editar mesa ${x.numero_mesa}`;
  m.submit.textContent = 'Guardar cambios';
  m.cancel.classList.remove('hidden');
  m.form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function salirEdicionMesa() {
  m.form.reset();
  m.editId.value = '';
  m.title.textContent = 'Nueva mesa';
  m.submit.textContent = 'Crear mesa';
  m.cancel.classList.add('hidden');
  [m.numero, m.capacidad].forEach((i) => i.classList.remove('is-invalid'));
}

// ===== Platillos ========================================================

async function cargarPlatillos() {
  try {
    let platillos = API.lista(await API.get('/api/v1/catalogo/platillos'));
    if (!esAdmin) platillos = platillos.filter((x) => x.disponible !== false);
    pintarPlatillos(platillos);
  } catch (error) {
    API.mostrarMensaje(`No se pudieron cargar los platillos. ${error.message}`);
  }
}

function pintarPlatillos(platillos) {
  p.tbody.replaceChildren();
  const columnas = esAdmin ? 5 : 4;
  if (!platillos.length) return filaVacia(p.tbody, columnas, 'No hay platillos en el menú.');

  for (const x of platillos) {
    const tr = document.createElement('tr');
    tr.appendChild(API.celda(x.nombre));
    tr.appendChild(API.celda(x.descripcion || ''));
    tr.appendChild(API.celda(formatearPrecio(x.precio)));

    const disponible = x.disponible !== false;
    const tdDisp = document.createElement('td');
    tdDisp.appendChild(API.badge(disponible ? 'Disponible' : 'No disponible', disponible ? 'activo' : 'inactivo'));
    tr.appendChild(tdDisp);

    if (esAdmin) {
      const tdAcc = document.createElement('td');
      tdAcc.className = 'table-actions';
      tdAcc.appendChild(API.boton('Editar', 'btn--secondary', () => editarPlatillo(x)));
      tdAcc.appendChild(disponible
        ? API.boton('Retirar', 'btn--danger', () => retirarPlatillo(x))
        : API.boton('Reactivar', 'btn--success', () => reactivarPlatillo(x)));
      tr.appendChild(tdAcc);
    }
    p.tbody.appendChild(tr);
  }
}

async function guardarPlatillo(e) {
  e.preventDefault();
  const editId = p.editId.value;
  const nombre = p.nombre.value.trim();
  const descripcion = p.descripcion.value.trim();
  const precio = Number(p.precio.value);

  if (!nombre || nombre.length > 120) {
    p.nombre.classList.add('is-invalid');
    return API.mostrarMensaje('Escribe el nombre del platillo (máximo 120 caracteres).');
  }
  if (p.precio.value === '' || !Number.isFinite(precio) || precio < 0) {
    p.precio.classList.add('is-invalid');
    return API.mostrarMensaje('El precio debe ser un número igual o mayor que 0.');
  }

  const cuerpo = {
    nombre,
    descripcion: descripcion || null,
    precio,
    disponible: p.disponible.checked,
  };

  p.submit.disabled = true;
  try {
    if (editId) {
      await API.put(`/api/v1/catalogo/platillos/${editId}`, cuerpo);
      API.mostrarMensaje('Platillo actualizado.', 'exito');
    } else {
      await API.post('/api/v1/catalogo/platillos', cuerpo);
      API.mostrarMensaje('Platillo creado.', 'exito');
    }
    salirEdicionPlatillo();
    cargarPlatillos();
  } catch (error) {
    API.mostrarMensaje(error.message);
  } finally {
    p.submit.disabled = false;
  }
}

async function retirarPlatillo(x) {
  if (!confirm(`¿Retirar "${x.nombre}" del menú?`)) return;
  try {
    await API.delete(`/api/v1/catalogo/platillos/${x.id_platillo}`);
    API.mostrarMensaje('Platillo retirado del menú.', 'exito');
    cargarPlatillos();
  } catch (error) {
    API.mostrarMensaje(error.message);
  }
}

async function reactivarPlatillo(x) {
  try {
    await API.put(`/api/v1/catalogo/platillos/${x.id_platillo}`, { disponible: true });
    API.mostrarMensaje('Platillo disponible otra vez.', 'exito');
    cargarPlatillos();
  } catch (error) {
    API.mostrarMensaje(error.message);
  }
}

function editarPlatillo(x) {
  p.editId.value = x.id_platillo;
  p.nombre.value = x.nombre;
  p.descripcion.value = x.descripcion || '';
  p.precio.value = x.precio;
  p.disponible.checked = x.disponible !== false;
  p.title.textContent = `Editar ${x.nombre}`;
  p.submit.textContent = 'Guardar cambios';
  p.cancel.classList.remove('hidden');
  p.form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function salirEdicionPlatillo() {
  p.form.reset();
  p.disponible.checked = true;
  p.editId.value = '';
  p.title.textContent = 'Nuevo platillo';
  p.submit.textContent = 'Crear platillo';
  p.cancel.classList.add('hidden');
  [p.nombre, p.precio].forEach((i) => i.classList.remove('is-invalid'));
}

// ===== Arranque =========================================================

function iniciar() {
  API.iniciarNavbar();

  if (esAdmin) {
    m.form.addEventListener('submit', guardarMesa);
    m.cancel.addEventListener('click', salirEdicionMesa);
    p.form.addEventListener('submit', guardarPlatillo);
    p.cancel.addEventListener('click', salirEdicionPlatillo);
    [m.numero, m.capacidad, p.nombre, p.precio].forEach((i) =>
      i.addEventListener('input', () => i.classList.remove('is-invalid')));
  } else {
    // El cliente solo consulta: se ocultan formularios y columnas de gestión
    document.querySelectorAll('.solo-admin').forEach((n) => { n.hidden = true; });
    document.getElementById('subtitulo').textContent = 'Conoce nuestras mesas y el menú disponible';
  }

  cargarMesas();
  cargarPlatillos();
}

if (API.requerirRol('administrador', 'cliente')) {
  iniciar();
}
