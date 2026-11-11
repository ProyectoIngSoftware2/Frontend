// ===== Reservar — Punto y Sal (Cliente) =====
const API_BASE = 'http://localhost:8000';

const token = localStorage.getItem('token');
const rol = localStorage.getItem('rol');

if (!token) {
  window.location.href = 'login.html';
}

if (rol !== 'cliente') {
  document.body.innerHTML = '<div style="padding:40px; text-align:center; color:#fff;"><h2>Acceso denegado</h2><p>Esta sección es solo para clientes.</p><a href="login.html" style="color:#E9A15B;">Volver al login</a></div>';
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

let platillos = [];

document.getElementById('addPlatilloBtn').addEventListener('click', () => {
  const row = document.createElement('div');
  row.style.cssText = 'display:flex; gap:8px; margin-top:8px; align-items:end;';
  row.innerHTML = `
    <input type="number" class="field__input" placeholder="ID platillo" min="1" style="flex:1;">
    <input type="number" class="field__input" placeholder="Cantidad" min="1" max="50" value="1" style="width:100px;">
    <input type="text" class="field__input" placeholder="Observaciones" style="flex:1;">
    <button type="button" class="btn btn--danger" style="width:auto; padding:6px 12px; font-size:0.8rem;" onclick="this.parentElement.remove()">Eliminar</button>
  `;
  document.getElementById('platillosList').appendChild(row);
});

document.getElementById('reservaForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fechaHora = document.getElementById('fechaHora').value;
  const personas = parseInt(document.getElementById('personas').value);
  const observaciones = document.getElementById('observaciones').value;

  const platillosItems = [];
  const rows = document.querySelectorAll('#platillosList > div');
  for (const row of rows) {
    const inputs = row.querySelectorAll('input');
    platillosItems.push({
      id_platillo: parseInt(inputs[0].value),
      cantidad: parseInt(inputs[1].value) || 1,
      observaciones: inputs[2].value,
    });
  }

  const body = {
    fecha_hora_inicio: fechaHora,
    cantidad_personas: personas,
    observaciones: observaciones || null,
    platillos: platillosItems,
  };

  const res = await apiRequest('/api/v1/reservas', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (res.ok) {
    const data = await res.json();
    showSuccess(`Reserva creada. Código: ${data.data.codigo_reserva}`);
    document.getElementById('reservaForm').reset();
    document.getElementById('platillosList').innerHTML = '';
    platillos = [];
  } else {
    const err = await res.json().catch(() => ({}));
    showError(err.detail || 'Error al crear reserva');
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('rol');
  window.location.href = 'login.html';
});

document.getElementById('userInfo').textContent = `Cliente (${rol})`;
