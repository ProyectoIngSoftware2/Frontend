// =====================================================================
// login.js | Inicio de sesión contra POST /api/v1/auth/login
// Requiere js/api.js (cargado antes en login.html).
// =====================================================================

// Si ya hay una sesión vigente, ir directo a la pantalla del rol.
if (API.sesionVigente()) {
  window.location.replace(API.INICIO_POR_ROL[API.sesion().rol]);
}

const form = document.querySelector('.login__form');
const inputCorreo = document.getElementById('correo');
const inputPassword = document.getElementById('password');
const toggle = document.getElementById('togglePassword');
const errorBox = document.querySelector('.login__error');
const boton = document.querySelector('.btn--primary');

// Avisos al volver al login (sesión vencida, cuenta recién creada…)
const motivo = API.parametro('motivo');
if (motivo === 'expirada') mostrarError('Tu sesión expiró. Inicia sesión de nuevo.');

toggle.addEventListener('click', () => {
  const visible = inputPassword.type === 'text';
  inputPassword.type = visible ? 'password' : 'text';
  toggle.textContent = visible ? 'Mostrar' : 'Ocultar';
  toggle.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
});

function mostrarError(mensaje) {
  errorBox.textContent = mensaje;
  errorBox.classList.remove('is-hidden');
}

function ocultarError() {
  errorBox.classList.add('is-hidden');
  inputCorreo.classList.remove('is-invalid');
  inputPassword.classList.remove('is-invalid');
}

function setCargando(cargando) {
  boton.disabled = cargando;
  boton.textContent = cargando ? 'Ingresando...' : 'Iniciar sesión';
}

[inputCorreo, inputPassword].forEach((input) =>
  input.addEventListener('input', () => input.classList.remove('is-invalid'))
);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarError();

  const correo = inputCorreo.value.trim();
  const password = inputPassword.value;

  if (!correo || !password) {
    if (!correo) inputCorreo.classList.add('is-invalid');
    if (!password) inputPassword.classList.add('is-invalid');
    mostrarError('Completa correo y contraseña.');
    return;
  }

  setCargando(true);
  try {
    const datos = await API.post('/api/v1/auth/login', { correo, password }, { publica: true });

    // El backend responde { access_token, rol, correo, id_usuario, id_cliente, ... }
    const destino = API.INICIO_POR_ROL[datos && datos.rol];
    if (!datos || !datos.access_token || !destino) {
      mostrarError('Tu usuario no tiene un rol válido.');
      return;
    }
    API.guardarSesion(datos);
    window.location.href = destino;
  } catch (err) {
    if (err.status === 401 || err.status === 422) {
      inputCorreo.classList.add('is-invalid');
      inputPassword.classList.add('is-invalid');
      mostrarError('Correo o contraseña incorrectos.');
    } else {
      mostrarError(err.message);
    }
  } finally {
    setCargando(false);
  }
});
