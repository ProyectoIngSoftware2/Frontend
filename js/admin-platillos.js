// Platillos (administrador): menú, registro, edición y "quitar del menú".
if (API.requerirRol('administrador')) {
  const { el } = API;
  const tbody = document.getElementById('tb-platillos');
  const alertaExito = document.querySelector('.tarjeta > .alerta--exito');
  const fq = document.getElementById('pf-q');
  const fdisp = document.getElementById('pf-disp');
  const modalTitulo = document.querySelector('#modal-platillo .modal__cab h2');
  const form = document.querySelector('#modal-platillo form');
  const alertaForm = form.querySelector('.alerta--error');
  const campos = {
    nombre: document.getElementById('p-nombre'),
    descripcion: document.getElementById('p-desc'),
    precio: document.getElementById('p-precio'),
    disponible: form.querySelector('input[name="p-disp"]'),
  };
  const formQuitar = document.querySelector('#modal-quitar form');
  const textoQuitar = document.querySelector('#modal-quitar .modal__cuerpo p');
  const alertaQuitar = el('div', { class: 'alerta alerta--error is-hidden', role: 'alert' }, [el('span')]);
  formQuitar.prepend(alertaQuitar);

  let platillos = [];
  let editando = null;

  function pintar() {
    const q = API.normalizar(fq.value.trim());
    const disp = fdisp.value;
    const visibles = platillos.filter((p) =>
      (!disp || (disp === 'si') === Boolean(p.disponible)) &&
      (!q || API.normalizar(`${p.nombre} ${p.descripcion || ''}`).includes(q)));

    if (!visibles.length) {
      API.filaMensaje(tbody, platillos.length ? 'Ningún platillo coincide con la búsqueda.' : 'Todavía no hay platillos registrados.');
      return;
    }
    tbody.replaceChildren(
      ...visibles.map((p) => {
        const acciones = [el('a', { class: 'boton boton--pequeno', href: '#modal-platillo', text: 'Editar', onclick: () => abrirForm(p) })];
        if (p.disponible) {
          acciones.push(el('a', { class: 'boton boton--pequeno boton--peligro', href: '#modal-quitar', text: 'Quitar del menú', onclick: () => abrirQuitar(p) }));
        }
        return API.fila([
          ['Platillo', p.nombre],
          ['Descripción', API.texto(p.descripcion)],
          ['Precio', API.formatearPrecio(p.precio)],
          ['Disponibilidad', p.disponible ? API.etiqueta('Disponible', 'ok') : API.etiqueta('No disponible', 'muted')],
          ['Acciones', el('div', { class: 'tabla__acciones' }, acciones)],
        ]);
      })
    );
  }

  async function cargar() {
    API.filaMensaje(tbody, 'Cargando platillos…');
    try {
      platillos = (await Reservas.cargarPlatillos()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      pintar();
    } catch (err) {
      API.filaMensaje(tbody, err.message);
    }
  }

  function abrirForm(p) {
    editando = p;
    API.ocultarAlerta(alertaForm);
    modalTitulo.textContent = p ? 'Editar platillo' : 'Nuevo platillo';
    campos.nombre.value = p ? p.nombre : '';
    campos.descripcion.value = p ? p.descripcion || '' : '';
    campos.precio.value = p ? Number(p.precio).toFixed(2) : '';
    campos.disponible.checked = p ? Boolean(p.disponible) : true;
  }

  function abrirQuitar(p) {
    editando = p;
    API.ocultarAlerta(alertaQuitar);
    textoQuitar.textContent = `¿Marcar “${p.nombre}” como no disponible? Podrás volver a habilitarlo editando el platillo.`;
  }

  document.querySelector('.pagina-cab a[href="#modal-platillo"]').addEventListener('click', () => abrirForm(null));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const precioTexto = campos.precio.value.trim();
    const valores = {
      nombre: campos.nombre.value.trim(),
      descripcion: campos.descripcion.value.trim() || null,
      precio: Number(precioTexto),
      disponible: campos.disponible.checked,
    };
    if (!valores.nombre) return API.mostrarAlerta(alertaForm, 'Escribe el nombre del platillo.');
    if (precioTexto === '' || !Number.isFinite(valores.precio) || valores.precio < 0) {
      return API.mostrarAlerta(alertaForm, 'El precio debe ser un número igual o mayor que 0.');
    }

    let peticion;
    if (editando) {
      const cambios = {};
      if (valores.nombre !== editando.nombre) cambios.nombre = valores.nombre;
      if (valores.descripcion !== (editando.descripcion || null)) cambios.descripcion = valores.descripcion;
      if (valores.precio !== Number(editando.precio)) cambios.precio = valores.precio;
      if (valores.disponible !== Boolean(editando.disponible)) cambios.disponible = valores.disponible;
      if (!Object.keys(cambios).length) return API.cerrarModal();
      peticion = () => API.patch(`/api/v1/catalogo/platillos/${editando.id_platillo}`, cambios);
    } else {
      peticion = () => API.post('/api/v1/catalogo/platillos', valores);
    }

    const boton = form.querySelector('button[type="submit"]');
    API.setCargando(boton, true);
    try {
      await peticion();
      API.cerrarModal();
      API.mostrarAlerta(alertaExito, editando ? 'El platillo se actualizó.' : 'El platillo se registró.', 4000);
      await cargar();
    } catch (err) {
      API.mostrarAlerta(alertaForm, err.message);
    } finally {
      API.setCargando(boton, false);
    }
  });

  formQuitar.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!editando) return;
    const boton = formQuitar.querySelector('button[type="submit"]');
    API.setCargando(boton, true, 'Quitando…');
    try {
      await API.delete(`/api/v1/catalogo/platillos/${editando.id_platillo}`);
      API.cerrarModal();
      API.mostrarAlerta(alertaExito, `“${editando.nombre}” ya no aparece en el menú.`, 4000);
      await cargar();
    } catch (err) {
      API.mostrarAlerta(alertaQuitar, err.message);
    } finally {
      API.setCargando(boton, false);
    }
  });

  if (window.location.hash === '#modal-platillo') abrirForm(null);
  if (window.location.hash === '#modal-quitar') API.cerrarModal();

  [fq, fdisp].forEach((f) => f.addEventListener('input', pintar));
  document.querySelector('.filtros').addEventListener('submit', (e) => e.preventDefault());
  cargar();
}
