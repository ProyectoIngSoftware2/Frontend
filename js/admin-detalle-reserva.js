// Detalle de reserva (administrador): estado, modificación y cancelación.
if (API.requerirRol('administrador')) {
  const codigo = (API.parametro('codigo') || '').trim().toUpperCase();
  const alertaExito = document.querySelector('.pila > .alerta--exito');
  const formEstado = document.querySelector('.pila form.filtros');
  const selEstado = document.getElementById('nuevo-estado');
  const formModificar = document.querySelector('#modal-modificar form');
  const formCancelar = document.querySelector('#modal-cancelar form');
  const alertaModificar = Reservas.alertaModal('modal-modificar');
  const alertaCancelar = Reservas.alertaModal('modal-cancelar');

  // Alerta de error general (para fallos al cambiar el estado o al cargar).
  const alertaError = API.el('div', { class: 'alerta alerta--error is-hidden', role: 'alert' }, [API.el('span')]);
  alertaExito.after(alertaError);

  let reserva = null;
  let mesas = [];

  async function cargar() {
    if (!codigo) {
      API.mostrarAlerta(alertaError, 'Falta el código de la reserva.');
      return;
    }
    try {
      const [detalle, M] = await Promise.all([Reservas.cargarDetalle(codigo), Reservas.cargarMesas()]);
      reserva = detalle.data;
      mesas = M;
      let cliente = null;
      try {
        cliente = API.datos(await API.get(`/api/v1/clientes/${reserva.id_cliente}`));
      } catch { /* si falla, se muestra solo el id */ }

      const mesa = mesas.find((m) => m.id_mesa === reserva.id_mesa);
      Reservas.pintarCabecera(reserva);
      Reservas.pintarInfo([
        ['Cliente', cliente ? `${cliente.nombre_completo} · ${cliente.correo}` : `Cliente #${reserva.id_cliente}`],
        ['Fecha y hora', API.formatearFecha(reserva.fecha_hora_inicio)],
        ['Duración', `${reserva.duracion_minutos} min`],
        ['Personas', String(reserva.cantidad_personas)],
        ['Mesa', mesa ? Reservas.nombreMesa(mesa) : (reserva.id_mesa ? `Mesa #${reserva.id_mesa}` : 'Sin asignar')],
        ['Observaciones', API.texto(reserva.observaciones)],
        ['Creada', API.formatearFecha(reserva.fecha_creacion)],
        ['Última actualización', API.formatearFecha(reserva.fecha_actualizacion)],
      ]);
      Reservas.pintarPlatillos(detalle.platillos || []);
      Reservas.pintarHistorial(detalle.historial || []);
      Reservas.ajustarAcciones(reserva);
      Reservas.llenarSelectMesas(document.getElementById('ed-mesa'), mesas);

      // El estado actual no se ofrece como "nuevo estado".
      [...selEstado.options].forEach((o) => { o.hidden = o.value === reserva.estado; });
      selEstado.value = '';
    } catch (err) {
      API.mostrarAlerta(alertaError, err.message);
      document.querySelectorAll('.pila > .tarjeta, .pagina-cab .tabla__acciones a:not([href="admin-reservas.html"])')
        .forEach((n) => n.classList.add('is-hidden'));
    }
  }

  async function aplicar(peticion, alerta, boton, mensajeExito) {
    API.ocultarAlerta(alerta);
    API.ocultarAlerta(alertaError);
    API.setCargando(boton, true);
    try {
      await peticion();
      API.cerrarModal();
      API.mostrarAlerta(alertaExito, mensajeExito, 5000);
      await cargar();
    } catch (err) {
      API.mostrarAlerta(alerta, err.message);
    } finally {
      API.setCargando(boton, false);
    }
  }

  // Cambiar estado: el backend valida si la transición está permitida.
  formEstado.addEventListener('submit', (e) => {
    e.preventDefault();
    const estado = selEstado.value;
    if (!estado) {
      API.mostrarAlerta(alertaError, 'Selecciona el nuevo estado.');
      return;
    }
    aplicar(
      () => API.patch(`/api/v1/reservas/${encodeURIComponent(codigo)}`, { estado }),
      alertaError,
      formEstado.querySelector('button'),
      `La reserva pasó a "${API.ESTADOS_RESERVA[estado][0]}".`
    );
  });

  document.querySelector('a[href="#modal-modificar"]').addEventListener('click', () => {
    if (reserva) Reservas.llenarModalModificar(reserva);
    API.ocultarAlerta(alertaModificar);
  });

  formModificar.addEventListener('submit', (e) => {
    e.preventDefault();
    let cambios;
    try {
      cambios = Reservas.cambiosModificar(reserva);
    } catch (err) {
      API.mostrarAlerta(alertaModificar, err.message);
      return;
    }
    if (!Object.keys(cambios).length) {
      API.cerrarModal();
      return;
    }
    aplicar(
      () => API.patch(`/api/v1/reservas/${encodeURIComponent(codigo)}`, cambios),
      alertaModificar,
      formModificar.querySelector('button[type="submit"]'),
      'La reserva se actualizó.'
    );
  });

  formCancelar.addEventListener('submit', (e) => {
    e.preventDefault();
    aplicar(
      () => API.delete(`/api/v1/reservas/${encodeURIComponent(codigo)}`),
      alertaCancelar,
      formCancelar.querySelector('button[type="submit"]'),
      'La reserva fue cancelada.'
    );
  });

  const aviso = API.avisoPendiente();
  if (aviso) API.mostrarAlerta(alertaExito, aviso, 6000);
  cargar();
}
