// Mi perfil (cliente): GET y PATCH /api/v1/clientes/{id_cliente}
if (API.requerirRol('cliente')) {
  const { id_cliente } = API.sesion();
  const alertaExito = document.querySelector('.tarjeta > .alerta--exito');
  const form = document.querySelector('main form.formulario');
  const alertaError = form.querySelector('.alerta--error');
  const boton = form.querySelector('button[type="submit"]');
  const campos = {
    nombre_completo: document.getElementById('cli-nombre'),
    telefono: document.getElementById('cli-tel'),
    numero_identidad: document.getElementById('cli-id'),
    correo: document.getElementById('cli-correo'),
  };
  let perfil = null;

  function llenar(p) {
    perfil = p;
    Object.entries(campos).forEach(([k, i]) => { i.value = p[k] || ''; });
  }

  async function cargar() {
    if (!id_cliente) {
      API.mostrarAlerta(alertaError, 'Tu cuenta no tiene un perfil de cliente vinculado.');
      boton.disabled = true;
      return;
    }
    boton.disabled = true;
    try {
      llenar(API.datos(await API.get(`/api/v1/clientes/${id_cliente}`)));
      boton.disabled = false;
    } catch (err) {
      API.mostrarAlerta(alertaError, err.message);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    API.ocultarAlerta(alertaError);
    API.ocultarAlerta(alertaExito);
    const valores = Object.fromEntries(Object.entries(campos).map(([k, i]) => [k, i.value.trim()]));
    if (!valores.nombre_completo || !valores.telefono || !valores.correo) {
      API.mostrarAlerta(alertaError, 'Nombre, teléfono y correo son obligatorios.');
      return;
    }
    if (!campos.correo.checkValidity()) {
      API.mostrarAlerta(alertaError, 'Escribe un correo válido.');
      return;
    }
    const cambios = {};
    Object.entries(valores).forEach(([k, v]) => { if (v !== (perfil[k] || '')) cambios[k] = v; });
    if ('numero_identidad' in cambios && !cambios.numero_identidad) cambios.numero_identidad = null;
    if (!Object.keys(cambios).length) {
      API.mostrarAlerta(alertaExito, 'No hay cambios que guardar.', 3000);
      return;
    }

    API.setCargando(boton, true);
    try {
      llenar(API.datos(await API.patch(`/api/v1/clientes/${id_cliente}`, cambios)));
      if (cambios.correo) {
        // El correo también es el de inicio de sesión.
        localStorage.setItem('correo', perfil.correo);
        document.querySelectorAll('.topbar__correo').forEach((s) => { s.textContent = perfil.correo; });
      }
      API.mostrarAlerta(alertaExito, cambios.correo
        ? 'Tus datos se actualizaron. La próxima vez inicia sesión con tu nuevo correo.'
        : 'Tus datos se actualizaron.', 6000);
    } catch (err) {
      API.mostrarAlerta(alertaError, err.message);
    } finally {
      API.setCargando(boton, false);
    }
  });

  cargar();
}
