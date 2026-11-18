// Mesas (administrador): listado, registro, edición y desactivación.
if (API.requerirRol('administrador')) {
  const { el } = API;
  const tbody = document.getElementById('tb-mesas');
  const alertaExito = document.querySelector('.tarjeta > .alerta--exito');
  const fq = document.getElementById('mf-q');
  const festado = document.getElementById('mf-estado');
  const modalTitulo = document.querySelector('#modal-mesa .modal__cab h2');
  const form = document.querySelector('#modal-mesa form');
  const alertaForm = form.querySelector('.alerta--error');
  const campos = {
    numero_mesa: document.getElementById('m-num'),
    capacidad: document.getElementById('m-cap'),
    ubicacion: document.getElementById('m-ubi'),
    estado: document.getElementById('m-estado'),
    activa: form.querySelector('input[name="m-activa"]'),
  };
  const formDesactivar = document.querySelector('#modal-desactivar form');
  const textoDesactivar = document.querySelector('#modal-desactivar .modal__cuerpo p');
  const alertaDesactivar = el('div', { class: 'alerta alerta--error is-hidden', role: 'alert' }, [el('span')]);
  formDesactivar.prepend(alertaDesactivar);

  let mesas = [];
  let editando = null; // null = nueva mesa

  function pintar() {
    const q = API.normalizar(fq.value.trim());
    const estado = festado.value;
    const visibles = mesas.filter((m) =>
      (!estado || m.estado === estado) &&
      (!q || API.normalizar(`${m.numero_mesa} ${m.ubicacion || ''}`).includes(q)));

    if (!visibles.length) {
      API.filaMensaje(tbody, mesas.length ? 'Ninguna mesa coincide con la búsqueda.' : 'Todavía no hay mesas registradas.');
      return;
    }
    tbody.replaceChildren(
      ...visibles.map((m) => {
        const acciones = [el('a', { class: 'boton boton--pequeno', href: '#modal-mesa', text: 'Editar', onclick: () => abrirForm(m) })];
        if (m.activa) {
          acciones.push(el('a', { class: 'boton boton--pequeno boton--peligro', href: '#modal-desactivar', text: 'Desactivar', onclick: () => abrirDesactivar(m) }));
        }
        return API.fila([
          ['Mesa', `Mesa ${m.numero_mesa}`],
          ['Capacidad', String(m.capacidad)],
          ['Ubicación', API.texto(m.ubicacion)],
          ['Estado', m.estado === 'disponible' ? API.etiqueta('Disponible', 'ok') : API.etiqueta('Mantenimiento', 'warn')],
          ['Activa', m.activa ? API.etiqueta('Activa', 'ok') : API.etiqueta('Inactiva', 'muted')],
          ['Acciones', el('div', { class: 'tabla__acciones' }, acciones)],
        ]);
      })
    );
  }

  async function cargar() {
    API.filaMensaje(tbody, 'Cargando mesas…');
    try {
      mesas = (await Reservas.cargarMesas())
        .sort((a, b) => String(a.numero_mesa).localeCompare(String(b.numero_mesa), 'es', { numeric: true }));
      pintar();
    } catch (err) {
      API.filaMensaje(tbody, err.message);
    }
  }

  function abrirForm(m) {
    editando = m;
    API.ocultarAlerta(alertaForm);
    modalTitulo.textContent = m ? `Editar mesa ${m.numero_mesa}` : 'Nueva mesa';
    campos.numero_mesa.value = m ? m.numero_mesa : '';
    campos.capacidad.value = m ? m.capacidad : '';
    campos.ubicacion.value = m ? m.ubicacion || '' : '';
    campos.estado.value = m ? m.estado : 'disponible';
    campos.activa.checked = m ? m.activa : true;
  }

  function abrirDesactivar(m) {
    editando = m;
    API.ocultarAlerta(alertaDesactivar);
    textoDesactivar.textContent = `¿Desactivar la mesa ${m.numero_mesa}? Dejará de ofrecerse para nuevas reservas.`;
  }

  document.querySelector('.pagina-cab a[href="#modal-mesa"]').addEventListener('click', () => abrirForm(null));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const valores = {
      numero_mesa: campos.numero_mesa.value.trim(),
      capacidad: Number(campos.capacidad.value),
      ubicacion: campos.ubicacion.value.trim() || null,
      estado: campos.estado.value,
      activa: campos.activa.checked,
    };
    if (!valores.numero_mesa) return API.mostrarAlerta(alertaForm, 'Escribe el número o código de la mesa.');
    if (!Number.isInteger(valores.capacidad) || valores.capacidad < 1) return API.mostrarAlerta(alertaForm, 'La capacidad debe ser un número entero mayor que 0.');

    let peticion;
    if (editando) {
      const cambios = {};
      Object.entries(valores).forEach(([k, v]) => { if (v !== (editando[k] ?? null)) cambios[k] = v; });
      if (!Object.keys(cambios).length) return API.cerrarModal();
      peticion = () => API.patch(`/api/v1/catalogo/mesas/${editando.id_mesa}`, cambios);
    } else {
      peticion = () => API.post('/api/v1/catalogo/mesas', valores);
    }

    const boton = form.querySelector('button[type="submit"]');
    API.setCargando(boton, true);
    try {
      await peticion();
      API.cerrarModal();
      API.mostrarAlerta(alertaExito, editando ? 'La mesa se actualizó.' : 'La mesa se registró.', 4000);
      await cargar();
    } catch (err) {
      API.mostrarAlerta(alertaForm, err.status === 409 ? 'Ya existe una mesa con ese número.' : err.message);
    } finally {
      API.setCargando(boton, false);
    }
  });

  formDesactivar.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!editando) return;
    const boton = formDesactivar.querySelector('button[type="submit"]');
    API.setCargando(boton, true, 'Desactivando…');
    try {
      await API.delete(`/api/v1/catalogo/mesas/${editando.id_mesa}`);
      API.cerrarModal();
      API.mostrarAlerta(alertaExito, `La mesa ${editando.numero_mesa} fue desactivada.`, 4000);
      await cargar();
    } catch (err) {
      API.mostrarAlerta(alertaDesactivar, err.message);
    } finally {
      API.setCargando(boton, false);
    }
  });

  if (window.location.hash === '#modal-mesa') abrirForm(null);
  if (window.location.hash === '#modal-desactivar') API.cerrarModal();

  [fq, festado].forEach((f) => f.addEventListener('input', pintar));
  document.querySelector('.filtros').addEventListener('submit', (e) => e.preventDefault());
  cargar();
}
