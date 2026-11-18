// Clientes (administrador): listado, edición y desactivación.
if (API.requerirRol('administrador')) {
  const { el } = API;
  const tbody = document.getElementById('tb-clientes');
  const alertaExito = document.querySelector('.tarjeta > .alerta--exito');
  const fq = document.getElementById('c-q');
  const festado = document.getElementById('c-estado');
  const formEditar = document.querySelector('#modal-editar form');
  const alertaEditar = formEditar.querySelector('.alerta--error');
  const formDesactivar = document.querySelector('#modal-desactivar form');
  const textoDesactivar = document.querySelector('#modal-desactivar .modal__cuerpo p');
  const alertaDesactivar = el('div', { class: 'alerta alerta--error is-hidden', role: 'alert' }, [el('span')]);
  formDesactivar.prepend(alertaDesactivar);

  const campos = {
    nombre_completo: document.getElementById('ed-nombre'),
    telefono: document.getElementById('ed-tel'),
    numero_identidad: document.getElementById('ed-id'),
    correo: document.getElementById('ed-correo'),
  };

  let clientes = [];
  let seleccionado = null;

  function pintar() {
    const q = API.normalizar(fq.value.trim());
    const estado = festado.value;
    const visibles = clientes.filter((c) => {
      if (estado === 'activos' && !c.activo) return false;
      if (estado === 'inactivos' && c.activo) return false;
      return !q || API.normalizar(`${c.nombre_completo} ${c.correo} ${c.telefono} ${c.numero_identidad || ''}`).includes(q);
    });
    if (!visibles.length) {
      API.filaMensaje(tbody, clientes.length ? 'Ningún cliente coincide con la búsqueda.' : 'Todavía no hay clientes registrados.');
      return;
    }
    tbody.replaceChildren(
      ...visibles.map((c) => {
        const acciones = [
          el('a', { class: 'boton boton--pequeno', href: '#modal-editar', text: 'Editar', onclick: () => abrirEditar(c) }),
        ];
        if (c.activo) {
          acciones.push(el('a', { class: 'boton boton--pequeno boton--peligro', href: '#modal-desactivar', text: 'Desactivar', onclick: () => abrirDesactivar(c) }));
        }
        return API.fila([
          ['Nombre', c.nombre_completo],
          ['Correo', c.correo],
          ['Teléfono', API.texto(c.telefono)],
          ['Identidad', API.texto(c.numero_identidad)],
          ['Registro', API.formatearFecha(c.fecha_registro, false)],
          ['Estado', c.activo ? API.etiqueta('Activo', 'ok') : API.etiqueta('Inactivo', 'muted')],
          ['Acciones', el('div', { class: 'tabla__acciones' }, acciones)],
        ]);
      })
    );
  }

  async function cargar() {
    API.filaMensaje(tbody, 'Cargando clientes…');
    try {
      clientes = (API.datos(await API.get('/api/v1/clientes')) || [])
        .sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo, 'es'));
      pintar();
    } catch (err) {
      API.filaMensaje(tbody, err.message);
    }
  }

  function abrirEditar(c) {
    seleccionado = c;
    API.ocultarAlerta(alertaEditar);
    Object.entries(campos).forEach(([k, input]) => { input.value = c[k] || ''; });
  }

  function abrirDesactivar(c) {
    seleccionado = c;
    API.ocultarAlerta(alertaDesactivar);
    textoDesactivar.textContent = `¿Desactivar a ${c.nombre_completo}? No podrá iniciar sesión y sus reservas se conservan.`;
  }

  formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!seleccionado) return;
    const valores = Object.fromEntries(Object.entries(campos).map(([k, i]) => [k, i.value.trim()]));
    if (!valores.nombre_completo || !valores.telefono || !valores.correo) {
      API.mostrarAlerta(alertaEditar, 'Nombre, teléfono y correo son obligatorios.');
      return;
    }
    // Solo se envían los campos modificados.
    const cambios = {};
    Object.entries(valores).forEach(([k, v]) => {
      if (v !== (seleccionado[k] || '')) cambios[k] = v;
    });
    if ('numero_identidad' in cambios && !cambios.numero_identidad) cambios.numero_identidad = null;
    if (!Object.keys(cambios).length) {
      API.cerrarModal();
      return;
    }
    const boton = formEditar.querySelector('button[type="submit"]');
    API.setCargando(boton, true);
    try {
      await API.patch(`/api/v1/clientes/${seleccionado.id_cliente}`, cambios);
      API.cerrarModal();
      API.mostrarAlerta(alertaExito, 'Los datos del cliente se actualizaron.', 4000);
      await cargar();
    } catch (err) {
      API.mostrarAlerta(alertaEditar, err.message);
    } finally {
      API.setCargando(boton, false);
    }
  });

  formDesactivar.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!seleccionado) return;
    const boton = formDesactivar.querySelector('button[type="submit"]');
    API.setCargando(boton, true, 'Desactivando…');
    try {
      await API.delete(`/api/v1/clientes/${seleccionado.id_cliente}`);
      API.cerrarModal();
      API.mostrarAlerta(alertaExito, `${seleccionado.nombre_completo} fue desactivado.`, 4000);
      await cargar();
    } catch (err) {
      API.mostrarAlerta(alertaDesactivar, err.message);
    } finally {
      API.setCargando(boton, false);
    }
  });

  // Si alguien abre el modal desde la URL sin elegir un cliente, se cierra.
  if (['#modal-editar', '#modal-desactivar'].includes(window.location.hash)) API.cerrarModal();

  [fq, festado].forEach((f) => f.addEventListener('input', pintar));
  document.querySelector('.filtros').addEventListener('submit', (e) => e.preventDefault());
  cargar();
}
