// Registro público de clientes: POST /api/v1/clientes
// Al crear la cuenta inicia sesión automáticamente.

const form = document.getElementById('formRegistro');
const errorBox = document.querySelector('.login__error');
const boton = form.querySelector('.btn--primary');
const campos = {
  nombre_completo: document.getElementById('nombre'),
  correo: document.getElementById('correo'),
  telefono: document.getElementById('telefono'),
  numero_identidad: document.getElementById('identidad'),
  password: document.getElementById('password'),
};
const toggle = document.getElementById('togglePassword');

toggle.addEventListener('click', () => {
  const visible = campos.password.type === 'text';
  campos.password.type = visible ? 'password' : 'text';
  toggle.textContent = visible ? 'Mostrar' : 'Ocultar';
});

Object.values(campos).forEach((c) => c.addEventListener('input', () => c.classList.remove('is-invalid')));

function error(mensaje, ...invalidos) {
  errorBox.textContent = mensaje;
  errorBox.classList.remove('is-hidden');
  invalidos.forEach((c) => c.classList.add('is-invalid'));
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.classList.add('is-hidden');

  const cuerpo = {
    nombre_completo: campos.nombre_completo.value.trim(),
    correo: campos.correo.value.trim(),
    telefono: campos.telefono.value.trim(),
    password: campos.password.value,
  };
  const identidad = campos.numero_identidad.value.trim();
  if (identidad) cuerpo.numero_identidad = identidad;

  const vacios = ['nombre_completo', 'correo', 'telefono', 'password'].filter((k) => !cuerpo[k]);
  if (vacios.length) return error('Completa los campos obligatorios.', ...vacios.map((k) => campos[k]));
  if (!campos.correo.checkValidity()) return error('Escribe un correo válido.', campos.correo);
  if (cuerpo.password.length < 8) return error('La contraseña debe tener al menos 8 caracteres.', campos.password);

  boton.disabled = true;
  boton.textContent = 'Creando cuenta...';
  try {
    await API.post('/api/v1/clientes', cuerpo, { publica: true });
    const sesion = await API.post(
      '/api/v1/auth/login',
      { correo: cuerpo.correo, password: cuerpo.password },
      { publica: true }
    );
    API.guardarSesion(sesion);
    window.location.href = API.INICIO_POR_ROL[sesion.rol] || 'login.html';
  } catch (err) {
    if (err.status === 409) error(err.message, campos.correo);
    else error(err.message);
  } finally {
    boton.disabled = false;
    boton.textContent = 'Crear cuenta';
  }
});
