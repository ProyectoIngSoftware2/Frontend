// =====================================================================
// reservas-comun.js | Piezas compartidas entre Admin y Cliente
// (formulario de nueva reserva y pantalla de detalle).
// Requiere js/api.js.
// =====================================================================

const Reservas = (() => {
  const { el } = API;

  // Catálogo público (no necesita token).
  async function cargarMesas() {
    return API.datos(await API.get('/api/v1/catalogo/mesas', { publica: true })) || [];
  }

  async function cargarPlatillos() {
    return API.datos(await API.get('/api/v1/catalogo/platillos', { publica: true })) || [];
  }

  const mesaUsable = (m) => m.activa && m.estado === 'disponible';
  const nombreMesa = (m) => `Mesa ${m.numero_mesa}${m.ubicacion ? ` · ${m.ubicacion}` : ''}`;

  // Llena un <select> de mesas conservando la primera opción ("Sin mesa…").
  function llenarSelectMesas(select, mesas, { soloUsables = true } = {}) {
    const primera = select.options[0];
    select.replaceChildren(primera);
    mesas
      .filter((m) => !soloUsables || mesaUsable(m))
      .forEach((m) => {
        select.append(el('option', { value: m.id_mesa, text: `${nombreMesa(m)} · capacidad ${m.capacidad}` }));
      });
  }

  // Lista de platillos disponibles con un campo de cantidad cada uno.
  function pintarListaPlatillos(contenedor, platillos) {
    const disponibles = platillos.filter((p) => p.disponible);
    if (!disponibles.length) {
      contenedor.replaceChildren(el('div', { class: 'estado', text: 'No hay platillos disponibles en este momento.' }));
      return;
    }
    contenedor.replaceChildren(
      ...disponibles.map((p) => {
        const id = `pl-${p.id_platillo}`;
        return el('div', { class: 'linea-platillo' }, [
          el('label', { for: id }, [p.nombre, el('small', { text: API.formatearPrecio(p.precio) })]),
          el('input', {
            id, type: 'number', min: '0', max: '50', value: '0', class: 'field__input',
            'data-id-platillo': p.id_platillo, 'aria-label': `Cantidad de ${p.nombre}`,
          }),
        ]);
      })
    );
  }

  // [{id_platillo, cantidad}] con las cantidades mayores a 0.
  function leerPlatillos(contenedor) {
    return [...contenedor.querySelectorAll('input[data-id-platillo]')]
      .map((i) => ({ id_platillo: Number(i.dataset.idPlatillo), cantidad: Number(i.value) }))
      .filter((p) => Number.isInteger(p.cantidad) && p.cantidad > 0);
  }

  // Valida y arma el cuerpo de POST /api/v1/reservas a partir del formulario.
  function cuerpoNuevaReserva(form) {
    const fecha = form.querySelector('#res-fecha').value;
    const personas = Number(form.querySelector('#res-personas').value);
    const duracion = Number(form.querySelector('#res-duracion').value);
    const mesa = form.querySelector('#res-mesa').value;
    const obs = form.querySelector('#res-obs').value.trim();

    if (!fecha) throw new Error('Elige la fecha y hora de la reserva.');
    if (new Date(fecha) <= new Date()) throw new Error('La fecha y hora deben ser futuras.');
    if (!Number.isInteger(personas) || personas < 1) throw new Error('La cantidad de personas debe ser al menos 1.');
    if (!Number.isInteger(duracion) || duracion < 15 || duracion > 720) throw new Error('La duración debe estar entre 15 y 720 minutos.');

    const cuerpo = {
      fecha_hora_inicio: API.fechaLocalAISO(fecha),
      cantidad_personas: personas,
      duracion_minutos: duracion,
    };
    if (mesa) cuerpo.id_mesa = Number(mesa);
    if (obs) cuerpo.observaciones = obs;
    const platillos = leerPlatillos(form.querySelector('.lista-platillos'));
    if (platillos.length) cuerpo.platillos = platillos;
    return cuerpo;
  }

  // ----- Detalle ------------------------------------------------------

  async function cargarDetalle(codigo) {
    // { data: reserva, platillos: [...], historial: [...] }
    return API.get(`/api/v1/reservas/${encodeURIComponent(codigo)}`);
  }

  function pintarCabecera(reserva) {
    document.title = `Reserva ${reserva.codigo_reserva} · Punto y Sal`;
    const cab = document.querySelector('.pagina-cab');
    cab.querySelector('h1 .codigo').textContent = reserva.codigo_reserva;
    cab.querySelector('h1 + p').replaceChildren(API.etiquetaEstado(reserva.estado));
    document.querySelectorAll('#modal-cancelar .modal__cuerpo p').forEach((p) => {
      p.textContent = `¿Seguro que quieres cancelar la reserva ${reserva.codigo_reserva}? Esta acción no se puede deshacer.`;
    });
  }

  // datos: [[título, valor], ...]
  function pintarInfo(datos) {
    document.getElementById('info').replaceChildren(
      ...datos.map(([dt, dd]) => el('div', { class: 'dato' }, [el('dt', { text: dt }), el('dd', {}, [dd])]))
    );
  }

  function pintarPlatillos(platillos) {
    const tbody = document.getElementById('tb-platillos');
    const total = document.getElementById('total');
    if (!platillos.length) {
      API.filaMensaje(tbody, 'Esta reserva no incluye platillos.');
      total.textContent = 'Total: L 0.00';
      return;
    }
    tbody.replaceChildren(
      ...platillos.map((p) => API.fila([
        ['Platillo', p.nombre || `Platillo #${p.id_platillo}`],
        ['Cantidad', String(p.cantidad)],
        ['Precio unitario', API.formatearPrecio(p.precio_unitario)],
        ['Observaciones', API.texto(p.observaciones)],
      ]))
    );
    const suma = platillos.reduce((acc, p) => acc + Number(p.precio_unitario || 0) * Number(p.cantidad || 0), 0);
    total.textContent = `Total: ${API.formatearPrecio(suma)}`;
  }

  function pintarHistorial(historial) {
    const tbody = document.getElementById('tb-historial');
    if (!historial.length) {
      API.filaMensaje(tbody, 'Sin cambios de estado registrados.');
      return;
    }
    tbody.replaceChildren(
      ...historial.map((h) => API.fila([
        ['Fecha', API.formatearFecha(h.fecha_cambio)],
        ['De', h.estado_anterior ? API.etiquetaEstado(h.estado_anterior) : '—'],
        ['A', API.etiquetaEstado(h.estado_nuevo)],
        ['Comentario', API.texto(h.comentario)],
      ]))
    );
  }

  // Llena el modal "Modificar" con los datos actuales.
  function llenarModalModificar(reserva) {
    document.getElementById('ed-fecha').value = API.isoAFechaLocal(reserva.fecha_hora_inicio);
    document.getElementById('ed-personas').value = reserva.cantidad_personas;
    document.getElementById('ed-duracion').value = reserva.duracion_minutos;
    document.getElementById('ed-obs').value = reserva.observaciones || '';
    const mesa = document.getElementById('ed-mesa');
    if (mesa) mesa.value = '';
  }

  // Solo envía los campos que cambiaron (PATCH parcial).
  function cambiosModificar(reserva) {
    const cambios = {};
    const fecha = document.getElementById('ed-fecha').value;
    const personas = Number(document.getElementById('ed-personas').value);
    const duracion = Number(document.getElementById('ed-duracion').value);
    const obs = document.getElementById('ed-obs').value.trim();
    const mesa = document.getElementById('ed-mesa');

    if (!fecha) throw new Error('Elige la fecha y hora.');
    if (!Number.isInteger(personas) || personas < 1) throw new Error('La cantidad de personas debe ser al menos 1.');
    if (!Number.isInteger(duracion) || duracion < 15 || duracion > 720) throw new Error('La duración debe estar entre 15 y 720 minutos.');

    if (fecha !== API.isoAFechaLocal(reserva.fecha_hora_inicio)) cambios.fecha_hora_inicio = API.fechaLocalAISO(fecha);
    if (personas !== reserva.cantidad_personas) cambios.cantidad_personas = personas;
    if (duracion !== reserva.duracion_minutos) cambios.duracion_minutos = duracion;
    if (obs !== (reserva.observaciones || '')) cambios.observaciones = obs || null;
    if (mesa && mesa.value && Number(mesa.value) !== reserva.id_mesa) cambios.id_mesa = Number(mesa.value);
    return cambios;
  }

  // Oculta Modificar/Cancelar cuando la reserva ya no admite cambios.
  function ajustarAcciones(reserva) {
    const final = API.ESTADOS_FINALES.includes(reserva.estado);
    document.querySelectorAll('.pagina-cab a[href="#modal-modificar"], .pagina-cab a[href="#modal-cancelar"]')
      .forEach((a) => a.classList.toggle('is-hidden', final));
    const tarjetaEstado = document.getElementById('nuevo-estado')?.closest('.tarjeta');
    if (tarjetaEstado) tarjetaEstado.classList.toggle('is-hidden', final);
  }

  // Alerta de error dentro de un modal (la crea si el diseño no la trae).
  function alertaModal(idModal) {
    const form = document.querySelector(`#${idModal} form`);
    let alerta = form.querySelector('.alerta--error');
    if (!alerta) {
      alerta = el('div', { class: 'alerta alerta--error is-hidden', role: 'alert' }, [el('span')]);
      form.prepend(alerta);
    }
    return alerta;
  }

  return {
    cargarMesas,
    cargarPlatillos,
    mesaUsable,
    nombreMesa,
    llenarSelectMesas,
    pintarListaPlatillos,
    cuerpoNuevaReserva,
    cargarDetalle,
    pintarCabecera,
    pintarInfo,
    pintarPlatillos,
    pintarHistorial,
    llenarModalModificar,
    cambiosModificar,
    ajustarAcciones,
    alertaModal,
  };
})();
