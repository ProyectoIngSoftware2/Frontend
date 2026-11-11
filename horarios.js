// ===== Horarios y Bloqueos | Punto y Sal =====
// Contrato (catalogo-service, vía Gateway):
//   GET    /api/v1/catalogo/horarios         -> id_horario, dia_semana, hora_apertura, hora_cierre, intervalo_minutos, activo
//   POST   /api/v1/catalogo/horarios         <- { dia_semana 1-7, hora_apertura "HH:MM", hora_cierre "HH:MM", intervalo_minutos 1-1440, activo? }
//   PUT    /api/v1/catalogo/horarios/{id}    <- mismos campos, todos opcionales
//   DELETE /api/v1/catalogo/horarios/{id}    -> desactiva
//   GET    /api/v1/catalogo/bloqueos         -> id_bloqueo, id_mesa, inicio, fin, motivo
//   POST   /api/v1/catalogo/bloqueos         <- { id_mesa? (null = general), inicio ISO, fin ISO, motivo 1-180 }
//   PUT    /api/v1/catalogo/bloqueos/{id}    <- mismos campos, todos opcionales
//   DELETE /api/v1/catalogo/bloqueos/{id}    -> elimina
//   GET    /api/v1/catalogo/mesas            -> para elegir la mesa del bloqueo

const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const mesasPorId = new Map();

const h = {
  form: document.getElementById('horarioForm'),
  title: document.getElementById('horarioFormTitle'),
  dia: document.getElementById('dia'),
  apertura: document.getElementById('apertura'),
  cierre: document.getElementById('cierre'),
  intervalo: document.getElementById('intervalo'),
  editId: document.getElementById('editHorarioId'),
  submit: document.getElementById('horarioSubmit'),
  cancel: document.getElementById('horarioCancel'),
  tbody: document.getElementById('horariosTbody'),
};

const b = {
  form: document.getElementById('bloqueoForm'),
  title: document.getElementById('bloqueoFormTitle'),
  mesa: document.getElementById('mesaId'),
  inicio: document.getElementById('inicio'),
  fin: document.getElementById('fin'),
  motivo: document.getElementById('motivo'),
  editId: document.getElementById('editBloqueoId'),
  submit: document.getElementById('bloqueoSubmit'),
  cancel: document.getElementById('bloqueoCancel'),
  tbody: document.getElementById('bloqueosTbody'),
};

function filaVacia(tbody, columnas, texto) {
  const tr = document.createElement('tr');
  const td = API.celda(texto);
  td.colSpan = columnas;
  td.className = 'table-empty';
  tr.appendChild(td);
  tbody.appendChild(tr);
}

// "19:00:00" -> "19:00"
const hhmm = (valor) => (valor ? String(valor).slice(0, 5) : '');

// ===== Horarios =========================================================

async function cargarHorarios() {
  try {
    const horarios = API.lista(await API.get('/api/v1/catalogo/horarios'));
    pintarHorarios(horarios);
  } catch (error) {
    API.mostrarMensaje(`No se pudieron cargar los horarios. ${error.message}`);
  }
}

function pintarHorarios(horarios) {
  h.tbody.replaceChildren();
  if (!horarios.length) return filaVacia(h.tbody, 6, 'No hay horarios configurados.');

  for (const x of horarios) {
    const tr = document.createElement('tr');
    tr.appendChild(API.celda(DIAS[x.dia_semana] || x.dia_semana));
    tr.appendChild(API.celda(hhmm(x.hora_apertura)));
    tr.appendChild(API.celda(hhmm(x.hora_cierre)));
    tr.appendChild(API.celda(x.intervalo_minutos != null ? `${x.intervalo_minutos} min` : ''));

    const activo = x.activo !== false;
    const tdEstado = document.createElement('td');
    tdEstado.appendChild(API.badge(activo ? 'Activo' : 'Inactivo', activo ? 'activo' : 'inactivo'));
    tr.appendChild(tdEstado);

    const tdAcc = document.createElement('td');
    tdAcc.className = 'table-actions';
    tdAcc.appendChild(API.boton('Editar', 'btn--secondary', () => editarHorario(x)));
    tdAcc.appendChild(activo
      ? API.boton('Desactivar', 'btn--danger', () => desactivarHorario(x))
      : API.boton('Reactivar', 'btn--success', () => reactivarHorario(x)));
    tr.appendChild(tdAcc);

    h.tbody.appendChild(tr);
  }
}

async function guardarHorario(e) {
  e.preventDefault();
  const editId = h.editId.value;
  const dia_semana = Number(h.dia.value);
  const hora_apertura = hhmm(h.apertura.value);
  const hora_cierre = hhmm(h.cierre.value);
  const intervalo_minutos = Number(h.intervalo.value);

  if (!hora_apertura || !hora_cierre) {
    return API.mostrarMensaje('Indica la hora de apertura y de cierre.');
  }
  if (hora_cierre <= hora_apertura) {
    h.cierre.classList.add('is-invalid');
    return API.mostrarMensaje('La hora de cierre debe ser posterior a la de apertura.');
  }
  if (!Number.isInteger(intervalo_minutos) || intervalo_minutos < 1 || intervalo_minutos > 1440) {
    h.intervalo.classList.add('is-invalid');
    return API.mostrarMensaje('El intervalo debe ser un número entero entre 1 y 1440 minutos.');
  }

  const cuerpo = { dia_semana, hora_apertura, hora_cierre, intervalo_minutos };

  h.submit.disabled = true;
  try {
    if (editId) {
      await API.put(`/api/v1/catalogo/horarios/${editId}`, cuerpo);
      API.mostrarMensaje('Horario actualizado.', 'exito');
    } else {
      await API.post('/api/v1/catalogo/horarios', { ...cuerpo, activo: true });
      API.mostrarMensaje('Horario creado.', 'exito');
    }
    salirEdicionHorario();
    cargarHorarios();
  } catch (error) {
    API.mostrarMensaje(error.message);
  } finally {
    h.submit.disabled = false;
  }
}

async function desactivarHorario(x) {
  if (!confirm(`¿Desactivar el horario del ${DIAS[x.dia_semana]}?`)) return;
  try {
    await API.delete(`/api/v1/catalogo/horarios/${x.id_horario}`);
    API.mostrarMensaje('Horario desactivado.', 'exito');
    cargarHorarios();
  } catch (error) {
    API.mostrarMensaje(error.message);
  }
}

async function reactivarHorario(x) {
  try {
    await API.put(`/api/v1/catalogo/horarios/${x.id_horario}`, { activo: true });
    API.mostrarMensaje('Horario reactivado.', 'exito');
    cargarHorarios();
  } catch (error) {
    API.mostrarMensaje(error.message);
  }
}

function editarHorario(x) {
  h.editId.value = x.id_horario;
  h.dia.value = String(x.dia_semana);
  h.apertura.value = hhmm(x.hora_apertura);
  h.cierre.value = hhmm(x.hora_cierre);
  h.intervalo.value = x.intervalo_minutos;
  h.title.textContent = `Editar horario del ${DIAS[x.dia_semana]}`;
  h.submit.textContent = 'Guardar cambios';
  h.cancel.classList.remove('hidden');
  h.form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function salirEdicionHorario() {
  h.form.reset();
  h.intervalo.value = 30;
  h.editId.value = '';
  h.title.textContent = 'Configurar horario operativo';
  h.submit.textContent = 'Guardar horario';
  h.cancel.classList.add('hidden');
  [h.cierre, h.intervalo].forEach((i) => i.classList.remove('is-invalid'));
}

// ===== Mesas (para el selector de bloqueos) =============================

async function cargarMesas() {
  try {
    const mesas = API.lista(await API.get('/api/v1/catalogo/mesas'));
    for (const m of mesas) {
      mesasPorId.set(m.id_mesa, m);
      if (m.activa === false) continue;
      const opt = document.createElement('option');
      opt.value = m.id_mesa;
      const capacidad = m.capacidad ? ` (${m.capacidad} personas)` : '';
      opt.textContent = `Mesa ${m.numero_mesa ?? m.id_mesa}${capacidad}`;
      b.mesa.appendChild(opt);
    }
  } catch {
    // Sin mesas el bloqueo general sigue disponible
  }
}

function nombreMesa(id) {
  if (id == null) return 'Todas (general)';
  const m = mesasPorId.get(id);
  return m ? `Mesa ${m.numero_mesa ?? id}` : `Mesa #${id}`;
}

// ===== Bloqueos =========================================================

async function cargarBloqueos() {
  try {
    const bloqueos = API.lista(await API.get('/api/v1/catalogo/bloqueos'));
    pintarBloqueos(bloqueos);
  } catch (error) {
    API.mostrarMensaje(`No se pudieron cargar los bloqueos. ${error.message}`);
  }
}

function pintarBloqueos(bloqueos) {
  b.tbody.replaceChildren();
  if (!bloqueos.length) return filaVacia(b.tbody, 5, 'No hay bloqueos registrados.');

  for (const x of bloqueos) {
    const tr = document.createElement('tr');
    tr.appendChild(API.celda(nombreMesa(x.id_mesa)));
    tr.appendChild(API.celda(API.formatearFecha(x.inicio)));
    tr.appendChild(API.celda(API.formatearFecha(x.fin)));
    tr.appendChild(API.celda(x.motivo));

    const tdAcc = document.createElement('td');
    tdAcc.className = 'table-actions';
    tdAcc.appendChild(API.boton('Editar', 'btn--secondary', () => editarBloqueo(x)));
    tdAcc.appendChild(API.boton('Eliminar', 'btn--danger', () => eliminarBloqueo(x)));
    tr.appendChild(tdAcc);

    b.tbody.appendChild(tr);
  }
}

async function guardarBloqueo(e) {
  e.preventDefault();
  const editId = b.editId.value;
  const motivo = b.motivo.value.trim();

  if (!b.inicio.value || !b.fin.value) {
    return API.mostrarMensaje('Indica la fecha y hora de inicio y de fin.');
  }
  if (new Date(b.fin.value) <= new Date(b.inicio.value)) {
    b.fin.classList.add('is-invalid');
    return API.mostrarMensaje('El fin del bloqueo debe ser posterior al inicio.');
  }
  if (!motivo || motivo.length > 180) {
    b.motivo.classList.add('is-invalid');
    return API.mostrarMensaje('Escribe un motivo (máximo 180 caracteres).');
  }

  const cuerpo = {
    id_mesa: b.mesa.value ? Number(b.mesa.value) : null,
    inicio: API.fechaLocalAISO(b.inicio.value),
    fin: API.fechaLocalAISO(b.fin.value),
    motivo,
  };

  b.submit.disabled = true;
  try {
    if (editId) {
      await API.put(`/api/v1/catalogo/bloqueos/${editId}`, cuerpo);
      API.mostrarMensaje('Bloqueo actualizado.', 'exito');
    } else {
      await API.post('/api/v1/catalogo/bloqueos', cuerpo);
      API.mostrarMensaje('Bloqueo creado.', 'exito');
    }
    salirEdicionBloqueo();
    cargarBloqueos();
  } catch (error) {
    API.mostrarMensaje(error.message);
  } finally {
    b.submit.disabled = false;
  }
}

async function eliminarBloqueo(x) {
  if (!confirm(`¿Eliminar el bloqueo "${x.motivo}"?`)) return;
  try {
    await API.delete(`/api/v1/catalogo/bloqueos/${x.id_bloqueo}`);
    API.mostrarMensaje('Bloqueo eliminado.', 'exito');
    cargarBloqueos();
  } catch (error) {
    API.mostrarMensaje(error.message);
  }
}

function editarBloqueo(x) {
  b.editId.value = x.id_bloqueo;
  b.mesa.value = x.id_mesa == null ? '' : String(x.id_mesa);
  b.inicio.value = API.isoAFechaLocal(x.inicio);
  b.fin.value = API.isoAFechaLocal(x.fin);
  b.motivo.value = x.motivo;
  b.title.textContent = 'Editar bloqueo';
  b.submit.textContent = 'Guardar cambios';
  b.cancel.classList.remove('hidden');
  b.form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function salirEdicionBloqueo() {
  b.form.reset();
  b.editId.value = '';
  b.title.textContent = 'Registrar bloqueo';
  b.submit.textContent = 'Crear bloqueo';
  b.cancel.classList.add('hidden');
  [b.fin, b.motivo].forEach((i) => i.classList.remove('is-invalid'));
}

// ===== Arranque =========================================================

async function iniciar() {
  API.iniciarNavbar();
  h.form.addEventListener('submit', guardarHorario);
  h.cancel.addEventListener('click', salirEdicionHorario);
  b.form.addEventListener('submit', guardarBloqueo);
  b.cancel.addEventListener('click', salirEdicionBloqueo);
  [h.cierre, h.intervalo, b.fin, b.motivo].forEach((i) =>
    i.addEventListener('input', () => i.classList.remove('is-invalid')));

  cargarHorarios();
  await cargarMesas(); // primero las mesas, para mostrar sus nombres en los bloqueos
  cargarBloqueos();
}

if (API.requerirRol('administrador')) {
  iniciar();
}
