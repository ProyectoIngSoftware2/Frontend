// ===== Usuarios y Roles — Punto y Sal =====
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

async function loadUsuarios() {
  const res = await apiRequest('/api/v1/usuarios');
  const data = await res.json();
  const tbody = document.getElementById('usuariosTbody');
  tbody.innerHTML = '';
  for (const u of data.data || []) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.id_usuario}</td>
      <td>${u.correo}</td>
      <td><span class="badge badge--${u.rol}">${u.rol}</span></td>
      <td><span class="badge badge--${u.activo ? 'activo' : 'inactivo'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td>${new Date(u.fecha_creacion).toLocaleString()}</td>
      <td>
        ${u.activo
          ? `<button class="btn btn--danger" style="width:auto; padding:6px 12px; font-size:0.8rem;" onclick="deactivateUsuario(${u.id_usuario})">Desactivar</button>`
          : `<button class="btn btn--success" style="width:auto; padding:6px 12px; font-size:0.8rem;" onclick="reactivarUsuario(${u.id_usuario})">Reactivar</button>`}
      </td>
    `;
    tbody.appendChild(tr);
  }
}

async function loadRoles() {
  const res = await apiRequest('/api/v1/roles');
  const data = await res.json();
  // Roles are loaded for reference; the form has hardcoded options
}

async function deactivateUsuario(id) {
  if (!confirm('¿Desactivar este usuario? No podrá iniciar sesión.')) return;
  const res = await apiRequest(`/api/v1/usuarios/${id}`, { method: 'DELETE' });
  if (res.ok) {
    showSuccess('Usuario desactivado');
    loadUsuarios();
  } else {
    const err = await res.json().catch(() => ({}));
    showError(err.detail || 'Error al desactivar');
  }
}

async function reactivarUsuario(id) {
  const res = await apiRequest(`/api/v1/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ activo: true }),
  });
  if (res.ok) {
    showSuccess('Usuario reactivado');
    loadUsuarios();
  } else {
    const err = await res.json().catch(() => ({}));
    showError(err.detail || 'Error al reactivar');
  }
}

document.getElementById('usuarioForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('nombre').value;
  const correo = document.getElementById('correo').value;
  const rolForm = document.getElementById('rolForm').value;
  const password = document.getElementById('password').value;
  const editId = document.getElementById('editId').value;

  const body = { nombre_completo: nombre, correo, rol: rolForm };
  if (password) body.password = password;

  const method = editId ? 'PUT' : 'POST';
  const path = editId ? `/api/v1/usuarios/${editId}` : '/api/v1/usuarios';
  const res = await apiRequest(path, { method, body: JSON.stringify(body) });

  if (res.ok) {
    showSuccess(editId ? 'Usuario actualizado' : 'Usuario creado');
    document.getElementById('usuarioForm').reset();
    document.getElementById('editId').value = '';
    document.getElementById('submitBtn').textContent = 'Crear';
    document.getElementById('cancelBtn').style.display = 'none';
    loadUsuarios();
  } else {
    const err = await res.json().catch(() => ({}));
    showError(err.detail || 'Error al guardar usuario');
  }
});

document.getElementById('cancelBtn').addEventListener('click', () => {
  document.getElementById('usuarioForm').reset();
  document.getElementById('editId').value = '';
  document.getElementById('submitBtn').textContent = 'Crear';
  document.getElementById('cancelBtn').style.display = 'none';
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('rol');
  window.location.href = 'login.html';
});

document.getElementById('userInfo').textContent = `Usuario (${rol})`;

loadUsuarios();
loadRoles();
