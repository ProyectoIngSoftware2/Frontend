// ===== Configuración =====
// Ajusta estos valores según lo que espere el backend (revísalo en http://localhost:8000/docs)
const CONFIG = {
  API_URL: 'http://localhost:8000/api/v1/auth/login',
  CAMPO_USUARIO: 'correo',      // el backend (LoginRequest) espera 'correo'
  CAMPO_PASSWORD: 'password',   // nombre del campo de contraseña que espera el backend
  RUTAS_POR_ROL: {
    administrador: 'admin.html',
    cliente: 'cliente.html',
  },
};

// ===== Elementos =====
const form = document.querySelector('.login__form');
const inputUsuario = document.getElementById('correo');
const inputPassword = document.getElementById('password');
const toggle = document.getElementById('togglePassword');
const errorBox = document.querySelector('.login__error');
const boton = document.querySelector('.btn--primary');

// ===== Mostrar / ocultar contraseña =====
toggle.addEventListener('click', () => {
  const visible = inputPassword.type === 'text';
  inputPassword.type = visible ? 'password' : 'text';
  toggle.textContent = visible ? 'Mostrar' : 'Ocultar';
  toggle.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
});

// ===== Utilidades de interfaz =====
function mostrarError(mensaje) {
  errorBox.textContent = mensaje;
  errorBox.classList.remove('is-hidden');
}

function ocultarError() {
  errorBox.classList.add('is-hidden');
  inputUsuario.classList.remove('is-invalid');
  inputPassword.classList.remove('is-invalid');
}

function setCargando(cargando) {
  boton.disabled = cargando;
  boton.textContent = cargando ? 'Ingresando...' : 'Iniciar sesión';
}

// Lee el contenido de un JWT (sin verificarlo; eso lo hace el backend)
function leerToken(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
}

// Quita el error rojo del campo en cuanto la persona escribe
[inputUsuario, inputPassword].forEach((input) =>
  input.addEventListener('input', () => input.classList.remove('is-invalid'))
);

// ===== Envío del formulario =====
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarError();

  const usuario = inputUsuario.value.trim();
  const password = inputPassword.value;

  // Validación de campos vacíos
  if (!usuario || !password) {
    if (!usuario) inputUsuario.classList.add('is-invalid');
    if (!password) inputPassword.classList.add('is-invalid');
    mostrarError('Completa correo y contraseña.');
    return;
  }

  setCargando(true);

  try {
    const respuesta = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        [CONFIG.CAMPO_USUARIO]: usuario,
        [CONFIG.CAMPO_PASSWORD]: password,
      }),
    });

    const datos = await respuesta.json().catch(() => ({}));

    if (respuesta.ok) {
      const token = datos.access_token || datos.token;
      if (!token) {
        mostrarError('Respuesta inesperada del servidor.');
        return;
      }

      const contenido = leerToken(token);
      const rol = datos.role || contenido.role;

      localStorage.setItem('token', token);
      localStorage.setItem('rol', rol || '');

      const destino = CONFIG.RUTAS_POR_ROL[rol];
      if (destino) {
        window.location.href = destino;
      } else {
        mostrarError('Tu usuario no tiene un rol válido.');
      }
      return;
    }

    if (respuesta.status === 401 || respuesta.status === 400 || respuesta.status === 422) {
      mostrarError('Correo o contraseña incorrectos.');
    } else if (respuesta.status === 503 || respuesta.status === 504) {
      mostrarError('El servicio no está disponible. Intenta más tarde.');
    } else {
      mostrarError('Ocurrió un error. Intenta de nuevo.');
    }
  } catch {
    // El servidor no respondió o el navegador bloqueó la petición (CORS)
    mostrarError('No se pudo conectar con el servidor.');
  } finally {
    setCargando(false);
  }
});
