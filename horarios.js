// ===== Horarios y Bloqueos — Punto y Sal =====
const API_BASE = 'http://localhost:8000';

const token = localStorage.getItem('token');
const rol = localStorage.getItem('rol');

if (!token) {
  window.location.href = 'login.html';
}

if (rol !== 'administrador') {
  document.body.innerHTML = '<div style="padding:40px; text-align:center; color:#fff;"><h2>Acceso denegado</h2><p>Solo administradores pueden acceder a esta sección.</p><a href="login.html" style="color:#E9A15B;">Volver al login</a></div>';
}

async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    window.location.href = 'login.html';
  }
  return response;
}

async function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 5000);
}

async function showSuccess(msg) {
  const el = document.getElementById('successMsg');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3000);
}

const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

async function loadHorarios() {
  const res = await apiRequest('/api/v1/catalogo/horarios');
  const data = await res.json();
  const tbody = document.getElementById('horariosTbody');
  tbody.innerHTML = '';
  for (const h of data.data || []) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${DIAS[h.dia_semana]}</td>
      <td>${h.hora_apertura}</td>
      <td>${h.hora_cierre}</td>
      <td>${h.intervalo_minutos} min</td>
      <td><span class="badge badge--${h.activo ? 'activo' : 'inactivo'}">${h.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td>
        ${h.activo
          ? `<button class="btn btn--danger" style="width:auto; padding:6px 12px; font-size:0.8rem;" onclick="deactivateHorario(${h.id_horario})">Desactivar</button>`
          : `<button class="btn btn--success" style="width:auto; padding:6px 12px; font-size:0.8rem;" onclick="reactivarHorario(${h.id_horario})">Reactivar</button>`}
      </td>
    `;
    tbody.appendChild(tr);
  }
}

async function loadBloqueos() {
  const res = await apiRequest('/api/v1/catalogo/bloqueos');
  const data = await res.json();
  const tbody = document.getElementById('bloqueosTbody');
  tbody.innerHTML = '';
  for (const b of data.data || []) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${b.id_mesa || 'General'}</td>
      <td>${new Date(b.inicio).toLocaleString()}</td>
      <td>${new Date(b.fin).toLocaleString()}</td>
      <td>${b.motivo}</td>
      <td>${b.creado_por || 'Sistema'}</td>
      <td>
        <button class="btn btn--danger" style="width:auto; padding:6px 12px; font-size:0.8rem;" onclick="deleteBloqueo(${b.id_bloqueo})">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

async function deactivateHorario(id) {
  const res = await apiRequest(`/api/v1/catalogo/horarios/${id}`, { method: 'DELETE' });
  if (res.ok) {
    showSuccess('Horario desactivado');
    loadHorarios();
  } else {
    const err = await res.json().catch(() => ({}));
    showError(err.detail || 'Error al desactivar');
  }
}

async function reactivarHorario(id) {
  const res = await apiRequest(`/api/v1/catalogo/horarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ activo: true }),
  });
  if (res.ok) {
    showSuccess('Horario reactivado');
    loadHorarios();
  } else {
    const err = await res.json().catch(() => ({}));
    showError(err.detail || 'Error al reactivar');
  }
}

async function deleteBloqueo(id) {
  if (!confirm('¿Eliminar este bloqueo?')) return;
  const res = await apiRequest(`/api/v1/catalogo/bloqueos/${id}`, { method: 'DELETE' });
  if (res.ok) {
    showSuccess('Bloqueo eliminado');
    loadBloqueos();
  } else {
    const err = await res.json().catch(() => ({}));
    showError(err.detail || 'Error al eliminar');
  }
}

document.getElementById('horarioForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const editId = document.getElementById('editHorarioId').value;
  const body = {
    dia_semana: parseInt(document.getElementById('dia').value),
    hora_apertura: document.getElementById('apertura').value,
    hora_cierre: document.getElementById('cierre').value,
    intervalo_minutos: parseInt(document.getElementById('intervalo').value),
    activo: true,
  };
  const method = editId ? 'PUT' : 'POST';
  const path = editId ? `/api/v1/catalogo/horarios/${editId}` : '/api/v1/catalogo/horarios';
  const res = await apiRequest(path, { method, body: JSON.stringify(body) });
  if (res.ok) {
    showSuccess(editId ? 'Horario actualizado' : 'Horario creado');
    document.getElementById('horarioForm').reset();
    document.getElementById('intervalo').value = 30;
    document.getElementById('editHorarioId').value = '';
    loadHorarios();
  } else {
    const err = await res.json().catch(() => ({}));
    showError(err.detail || 'Error al guardar horario');
  }
});

document.getElementById('bloqueoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    id_mesa: document.getElementById('mesaId').value ? parseInt(document.getElementById('mesaId').value) : null,
    inicio: document.getElementById('inicio').value,
    fin: document.getElementById('fin').value,
    motivo: document.getElementById('motivo').value,
  };
  const res = await apiRequest('/api/v1/catalogo/bloqueos', { method: 'POST', body: JSON.stringify(body) });
  if (res.ok) {
    showSuccess('Bloqueo creado');
    document.getElementById('bloqueoForm').reset();
    loadBloqueos();
  } else {
    const err = await res.json().catch(() => ({}));
    showError(err.detail || 'Error al crear bloqueo');
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('rol');
  window.location.href = 'login.html';
});

document.getElementById('userInfo').textContent = `Administrador (${rol})`;

loadHorarios();
loadBloqueos();
