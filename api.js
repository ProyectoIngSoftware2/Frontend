// =====================================================================
// api.js  |  Módulo compartido para hablar con el backend de Punto y Sal
// ---------------------------------------------------------------------
// Todas las páginas deben usar este archivo para sus peticiones.
// Inclúyelo ANTES del script de cada página:
//   <script src="api.js"></script>
//   <script src="usuarios.js"></script>
//
// Qué hace:
//   - Usa siempre el API Gateway (puerto 8000)
//   - Agrega "Authorization: Bearer <token>" automáticamente
//   - Convierte las respuestas a JSON
//   - Maneja 401 (sesión vencida) y 403 (sin permiso)
//   - Ofrece utilidades de sesión: proteger páginas y cerrar sesión
// =====================================================================

const API = (() => {
  const API_BASE_URL = 'http://localhost:8000';
  const LOGIN_PAGE = 'login.html';
  const ROLES_VALIDOS = ['administrador', 'cliente'];

  // ----- Sesión ------------------------------------------------------

  function getToken() {
    return localStorage.getItem('token');
  }

  function getRol() {
    return localStorage.getItem('rol');
  }

  function guardarSesion(datos) {
    localStorage.setItem('token', datos.access_token);
    localStorage.setItem('rol', datos.rol);
    if (datos.correo) localStorage.setItem('correo', datos.correo);
    if (datos.id_usuario != null) localStorage.setItem('id_usuario', datos.id_usuario);
  }

  function cerrarSesion() {
    ['token', 'rol', 'correo', 'id_usuario'].forEach((k) => localStorage.removeItem(k));
    window.location.href = LOGIN_PAGE;
  }

  // Llamar al inicio de cada página protegida.
  // Ejemplo: API.requerirRol('administrador');
  //          API.requerirRol('administrador', 'cliente');
  function requerirRol(...rolesPermitidos) {
    const token = getToken();
    const rol = getRol();

    if (!token || !ROLES_VALIDOS.includes(rol)) {
      cerrarSesion();
      return false;
    }
    if (rolesPermitidos.length && !rolesPermitidos.includes(rol)) {
      window.location.href = rol === 'administrador' ? 'usuarios.html' : 'reservar.html';
      return false;
    }
    return true;
  }

  // ----- Errores -----------------------------------------------------

  class ApiError extends Error {
    constructor(status, mensaje, detalle) {
      super(mensaje);
      this.status = status;
      this.detalle = detalle;
    }
  }

  // FastAPI devuelve errores como { detail: "texto" } o { detail: [ {msg, loc}, ... ] }
  function mensajeDeError(status, cuerpo) {
    const detail = cuerpo && cuerpo.detail;

    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg).join('. ');
    }
    if (typeof detail === 'string') {
      return detail;
    }
    switch (status) {
      case 400: return 'La solicitud no es válida.';
      case 403: return 'No tienes permiso para realizar esta acción.';
      case 404: return 'El recurso no existe.';
      case 409: return 'El registro ya existe o está en conflicto.';
      case 422: return 'Revisa los datos del formulario.';
      case 503:
      case 504: return 'El servicio no está disponible. Intenta más tarde.';
      default:  return 'Ocurrió un error. Intenta de nuevo.';
    }
  }

  // ----- Petición base -----------------------------------------------

  async function request(metodo, ruta, cuerpo) {
    const headers = { Accept: 'application/json' };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';

    let respuesta;
    try {
      respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
        method: metodo,
        headers,
        body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      });
    } catch {
      throw new ApiError(0, 'No se pudo conectar con el servidor.');
    }

    // 204 No Content (por ejemplo, al eliminar)
    if (respuesta.status === 204) return null;

    const datos = await respuesta.json().catch(() => null);

    if (respuesta.ok) return datos;

    // Sesión vencida o token inválido: volver al login
    if (respuesta.status === 401 && ruta !== '/api/v1/auth/login') {
      cerrarSesion();
    }

    throw new ApiError(respuesta.status, mensajeDeError(respuesta.status, datos), datos);
  }

  // ----- API pública -------------------------------------------------

  return {
    get:    (ruta)         => request('GET', ruta),
    post:   (ruta, cuerpo) => request('POST', ruta, cuerpo),
    put:    (ruta, cuerpo) => request('PUT', ruta, cuerpo),
    patch:  (ruta, cuerpo) => request('PATCH', ruta, cuerpo),
    delete: (ruta)         => request('DELETE', ruta),

    guardarSesion,
    cerrarSesion,
    requerirRol,
    getRol,
    getToken,
    ApiError,
  };
})();
