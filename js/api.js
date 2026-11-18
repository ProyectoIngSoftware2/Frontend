// =====================================================================
// api.js | Conexión compartida con el backend de Punto y Sal
// ---------------------------------------------------------------------
// Inclúyelo ANTES del script de cada página:
//   <script src="../js/api.js"></script>
//   <script src="../js/admin-reservas.js"></script>
//
// - Todas las peticiones van al API Gateway (puerto 8000).
// - Agrega "Authorization: Bearer <token>" automáticamente.
// - Si el token vence o es inválido (401), cierra la sesión.
// - Protege páginas por rol y conecta el botón "Cerrar sesión".
// =====================================================================

const API = (() => {
  // Cambia esta URL si el Gateway corre en otra máquina o puerto.
  const API_BASE_URL = 'http://localhost:8000';

  // Las páginas de Admin/ y Cliente/ están una carpeta más adentro.
  const EN_SUBCARPETA = /\/(Admin|Cliente)\//i.test(window.location.pathname);
  const RAIZ = EN_SUBCARPETA ? '../' : '';
  const LOGIN_PAGE = `${RAIZ}login.html`;
  const INICIO_POR_ROL = {
    administrador: `${RAIZ}Admin/admin-panel.html`,
    cliente: `${RAIZ}Cliente/cliente-inicio.html`,
  };
  const CLAVES_SESION = ['token', 'rol', 'correo', 'id_usuario', 'id_cliente', 'id_administrador', 'expira'];

  // ----- Sesión ------------------------------------------------------

  function guardarSesion(datos) {
    localStorage.setItem('token', datos.access_token);
    localStorage.setItem('rol', datos.rol);
    localStorage.setItem('correo', datos.correo || '');
    localStorage.setItem('id_usuario', datos.id_usuario ?? '');
    localStorage.setItem('id_cliente', datos.id_cliente ?? '');
    localStorage.setItem('id_administrador', datos.id_administrador ?? '');
    const segundos = Number(datos.expires_in) || 3600;
    localStorage.setItem('expira', String(Date.now() + segundos * 1000));
  }

  function limpiarSesion() {
    CLAVES_SESION.forEach((k) => localStorage.removeItem(k));
  }

  function sesion() {
    const numero = (k) => {
      const v = localStorage.getItem(k);
      return v === null || v === '' ? null : Number(v);
    };
    return {
      token: localStorage.getItem('token'),
      rol: localStorage.getItem('rol'),
      correo: localStorage.getItem('correo') || '',
      id_usuario: numero('id_usuario'),
      id_cliente: numero('id_cliente'),
      id_administrador: numero('id_administrador'),
      expira: numero('expira'),
    };
  }

  function sesionVigente() {
    const s = sesion();
    return Boolean(s.token && INICIO_POR_ROL[s.rol] && (!s.expira || s.expira > Date.now()));
  }

  function cerrarSesion(motivo) {
    limpiarSesion();
    const extra = motivo ? `?motivo=${encodeURIComponent(motivo)}` : '';
    window.location.href = LOGIN_PAGE + extra;
  }

  // Llamar al inicio de cada página protegida: API.requerirRol('administrador')
  function requerirRol(rol) {
    if (!sesionVigente()) {
      cerrarSesion(localStorage.getItem('token') ? 'expirada' : '');
      return false;
    }
    const s = sesion();
    if (rol && s.rol !== rol) {
      window.location.href = INICIO_POR_ROL[s.rol];
      return false;
    }
    prepararCabecera();
    return true;
  }

  // Muestra el correo de la sesión y conecta "Cerrar sesión".
  function prepararCabecera() {
    const s = sesion();
    document
      .querySelectorAll('.sidebar__pie span, .topbar__correo')
      .forEach((el) => { el.textContent = s.correo; });
    document.querySelectorAll('[data-cerrar-sesion]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        cerrarSesion();
      });
    });
  }

  // ----- Errores -----------------------------------------------------

  class ApiError extends Error {
    constructor(status, mensaje, detalle) {
      super(mensaje);
      this.status = status;
      this.detalle = detalle;
    }
  }

  // Mensajes del backend (en inglés) traducidos para la interfaz.
  const TRADUCCIONES = {
    'Invalid credentials': 'Correo o contraseña incorrectos.',
    'Not authenticated': 'Tu sesión no es válida. Inicia sesión de nuevo.',
    'Token has expired': 'Tu sesión expiró. Inicia sesión de nuevo.',
    'Invalid authentication credentials': 'Tu sesión no es válida. Inicia sesión de nuevo.',
    'Not enough permissions': 'No tienes permiso para realizar esta acción.',
    'Reservation not found': 'No encontramos una reserva con ese código.',
    'Customer not found': 'No se encontró el cliente.',
    'Table not found': 'No se encontró la mesa.',
    'Dish not found': 'No se encontró el platillo.',
    'Only cancellation is allowed for clients': 'Solo puedes cancelar la reserva; el restaurante gestiona los demás estados.',
    'Email or identity number already registered': 'Ese correo o número de identidad ya está registrado.',
    'Database connection failed': 'No hay conexión con la base de datos. Intenta más tarde.',
    'Internal server error': 'Ocurrió un error en el servidor. Intenta de nuevo.',
  };

  const CAMPOS = {
    correo: 'Correo', password: 'Contraseña', nombre_completo: 'Nombre completo',
    telefono: 'Teléfono', numero_identidad: 'Número de identidad',
    fecha_hora_inicio: 'Fecha y hora', cantidad_personas: 'Cantidad de personas',
    duracion_minutos: 'Duración', id_mesa: 'Mesa', observaciones: 'Observaciones',
    id_cliente: 'Cliente', numero_mesa: 'Número de mesa', capacidad: 'Capacidad',
    ubicacion: 'Ubicación', nombre: 'Nombre', descripcion: 'Descripción', precio: 'Precio',
  };

  function mensajeDeError(status, cuerpo) {
    const detail = cuerpo && cuerpo.detail;
    if (Array.isArray(detail)) {
      // 422 de FastAPI: [{loc: ["body", "campo"], msg: "..."}]
      return detail
        .map((d) => {
          const campo = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : '';
          return `${CAMPOS[campo] || campo}: ${d.msg}`;
        })
        .join(' · ');
    }
    if (typeof detail === 'string') {
      if (TRADUCCIONES[detail]) return TRADUCCIONES[detail];
      if (/^Service '.*' (is unavailable|did not respond in time)$/.test(detail)) {
        return 'El servicio no está disponible. Intenta más tarde.';
      }
      if (/^Dish \d+ does not exist$/.test(detail)) return 'Uno de los platillos ya no existe.';
      return detail; // mensajes de reglas de la BD (ya vienen en español)
    }
    switch (status) {
      case 400: return 'La solicitud no es válida.';
      case 403: return 'No tienes permiso para realizar esta acción.';
      case 404: return 'El recurso no existe.';
      case 409: return 'El registro ya existe o está en conflicto.';
      case 422: return 'Revisa los datos del formulario.';
      case 503:
      case 504: return 'El servicio no está disponible. Intenta más tarde.';
      default: return 'Ocurrió un error. Intenta de nuevo.';
    }
  }

  // ----- Petición base -----------------------------------------------

  async function request(metodo, ruta, cuerpo, { publica = false } = {}) {
    const headers = { Accept: 'application/json' };
    const token = localStorage.getItem('token');
    if (token && !publica) headers.Authorization = `Bearer ${token}`;
    if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';

    let respuesta;
    try {
      respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
        method: metodo,
        headers,
        body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      });
    } catch {
      // Servidor apagado o petición bloqueada por CORS.
      throw new ApiError(0, 'No se pudo conectar con el servidor. Verifica que el backend esté encendido y que CORS_ORIGINS incluya esta página.');
    }

    if (respuesta.status === 204) return null;
    const datos = await respuesta.json().catch(() => null);
    if (respuesta.ok) return datos;

    // Token vencido o inválido en una ruta protegida: volver al login.
    if (respuesta.status === 401 && token && !publica && ruta !== '/api/v1/auth/login') {
      cerrarSesion('expirada');
    }
    throw new ApiError(respuesta.status, mensajeDeError(respuesta.status, datos), datos);
  }

  // El backend envuelve todo en { data: ... }
  const datos = (r) => (r && 'data' in r ? r.data : r);

  // ----- Formato ------------------------------------------------------

  const ESTADOS_RESERVA = {
    pendiente: ['Pendiente', 'warn'],
    aprobada: ['Aprobada', 'info'],
    confirmada: ['Confirmada', 'ok'],
    rechazada: ['Rechazada', 'danger'],
    cancelada: ['Cancelada', 'muted'],
    completada: ['Completada', 'ok'],
  };
  const ESTADOS_FINALES = ['rechazada', 'cancelada', 'completada'];

  function etiqueta(texto, variante) {
    const s = document.createElement('span');
    s.className = `etiqueta etiqueta--${variante}`;
    s.textContent = texto;
    return s;
  }

  function etiquetaEstado(estado) {
    const [texto, variante] = ESTADOS_RESERVA[estado] || [estado || '—', 'muted'];
    return etiqueta(texto, variante);
  }

  function formatearFecha(iso, conHora = true) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return conHora
      ? d.toLocaleString('es-HN', { dateStyle: 'short', timeStyle: 'short' })
      : d.toLocaleDateString('es-HN', { dateStyle: 'short' });
  }

  function formatearPrecio(valor) {
    const n = Number(valor) || 0;
    return `L ${n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // "2026-12-24T18:00" (datetime-local) -> "2026-12-24T18:00:00-06:00"
  // El backend exige la zona horaria en las fechas.
  function fechaLocalAISO(valor) {
    if (!valor) return null;
    const base = valor.slice(0, 16);
    const offsetMin = -new Date(base).getTimezoneOffset();
    const signo = offsetMin >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMin);
    const hh = String(Math.floor(abs / 60)).padStart(2, '0');
    const mm = String(abs % 60).padStart(2, '0');
    return `${base}:00${signo}${hh}:${mm}`;
  }

  // ISO del backend -> "2026-12-24T18:00" para un input datetime-local
  function isoAFechaLocal(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  const texto = (v) => (v === null || v === undefined || v === '' ? '—' : String(v));
  const normalizar = (v) => String(v ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  // ----- Utilidades de interfaz --------------------------------------

  // Crea elementos de forma segura (el texto nunca se interpreta como HTML).
  function el(tag, props = {}, hijos = []) {
    const nodo = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (k === 'text') nodo.textContent = v;
      else if (k === 'class') nodo.className = v;
      else if (k.startsWith('on')) nodo.addEventListener(k.slice(2), v);
      else nodo.setAttribute(k, v);
    });
    [].concat(hijos).forEach((h) => {
      if (h === null || h === undefined) return;
      nodo.append(h instanceof Node ? h : document.createTextNode(String(h)));
    });
    return nodo;
  }

  // Fila de tabla: celdas = [[etiqueta, contenido], ...]
  function fila(celdas) {
    return el('tr', {}, celdas.map(([label, contenido]) => el('td', { 'data-label': label }, [contenido])));
  }

  // Mensaje "vacío" o "cargando" que ocupa toda la tabla.
  function filaMensaje(tbody, mensaje) {
    const columnas = tbody.closest('table').querySelectorAll('thead th').length || 1;
    tbody.replaceChildren(el('tr', {}, [el('td', { colspan: columnas }, [el('div', { class: 'estado', text: mensaje })])]));
  }

  function mostrarAlerta(alerta, mensaje, ms = 0) {
    if (!alerta) return;
    const span = alerta.querySelector('span') || alerta;
    span.textContent = mensaje;
    alerta.classList.remove('is-hidden');
    clearTimeout(alerta._timer);
    if (ms) alerta._timer = setTimeout(() => alerta.classList.add('is-hidden'), ms);
  }

  function ocultarAlerta(alerta) {
    if (alerta) alerta.classList.add('is-hidden');
  }

  function setCargando(boton, cargando, textoCargando = 'Guardando…') {
    if (!boton) return;
    if (cargando) {
      boton.dataset.textoOriginal = boton.textContent;
      boton.textContent = textoCargando;
    } else if (boton.dataset.textoOriginal) {
      boton.textContent = boton.dataset.textoOriginal;
    }
    boton.disabled = cargando;
  }

  // Los modales del diseño funcionan con :target (#modal-x).
  const abrirModal = (id) => { window.location.hash = id; };
  const cerrarModal = () => { window.location.hash = 'cerrar'; };

  // Mensaje que sobrevive a una redirección (p. ej. "Reserva creada").
  function avisoPendiente(mensaje) {
    if (mensaje !== undefined) {
      sessionStorage.setItem('aviso', mensaje);
      return null;
    }
    const m = sessionStorage.getItem('aviso');
    sessionStorage.removeItem('aviso');
    return m;
  }

  const parametro = (nombre) => new URLSearchParams(window.location.search).get(nombre);

  // ----- API pública -------------------------------------------------

  return {
    get: (ruta, opc) => request('GET', ruta, undefined, opc),
    post: (ruta, cuerpo, opc) => request('POST', ruta, cuerpo, opc),
    patch: (ruta, cuerpo) => request('PATCH', ruta, cuerpo),
    put: (ruta, cuerpo) => request('PUT', ruta, cuerpo),
    delete: (ruta) => request('DELETE', ruta),
    datos,
    ApiError,

    guardarSesion,
    limpiarSesion,
    sesion,
    sesionVigente,
    cerrarSesion,
    requerirRol,
    INICIO_POR_ROL,

    ESTADOS_RESERVA,
    ESTADOS_FINALES,
    etiqueta,
    etiquetaEstado,
    formatearFecha,
    formatearPrecio,
    fechaLocalAISO,
    isoAFechaLocal,
    texto,
    normalizar,

    el,
    fila,
    filaMensaje,
    mostrarAlerta,
    ocultarAlerta,
    setCargando,
    abrirModal,
    cerrarModal,
    avisoPendiente,
    parametro,
  };
})();
