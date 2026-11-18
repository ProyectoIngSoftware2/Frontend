// Detalle de reserva (cliente): ver, modificar o cancelar su propia reserva.
// El backend responde 404 si el código no existe o es de otro cliente.
if (API.requerirRol('cliente')) {
  const codigo = (API.parametro('codigo') || '').trim().toUpperCase();
  const alertaExito = document.querySelector('.pila > .alerta--exito');
  const formModificar = document.querySelector('#modal-modificar form');
  const formCancelar = document.querySelector('#modal-cancelar form');
  const alertaModificar = Reservas.alertaModal('modal-modificar');
  const alertaCancelar = Reservas.alertaModal('modal-cancelar');
  const alertaError = API.el('div', { class: 'alerta alerta--error is-hidden', role: 'alert' }, [API.el('span')]);
  alertaExito.after(alertaError);

  let reserva = null;

  function ocultarContenido() {
    document.querySelectorAll('.pila > .tarjeta, .pagina-cab .tabla__acciones a:not([href="cliente-consultar.html"]), .pagina-cab h1 + p')
      .forEach((n) => n.classList.add('is-hidden'));
    document.querySelector('.pagina-cab h1').textContent = 'Reserva no encontrada';
  }

  async function cargar() {
    if (!codigo) {
      ocultarContenido();
      API.mostrarAlerta(alertaError, 'Escribe un código de reserva para consultarla.');
      return;
    }
    try {
      const [detalle, mesas] = await Promise.all([Reservas.cargarDetalle(codigo), Reservas.cargarMesas().catch(() => [])]);
      reserva = detalle.data;
      MisReservas.agregar(reserva.codigo_reserva);
      const mesa = mesas.find((m) => m.id_mesa === reserva.id_mesa);
      Reservas.pintarCabecera(reserva);
      Reservas.pintarInfo([
        ['Fecha y hora', API.formatearFecha(reserva.fecha_hora_inicio)],
        ['Duración', `${reserva.duracion_minutos} min`],
        ['Personas', String(reserva.cantidad_personas)],
        ['Mesa', mesa ? Reservas.nombreMesa(mesa) : (reserva.id_mesa ? `Mesa #${reserva.id_mesa}` : 'La asigna el restaurante')],
        ['Observaciones', API.texto(reserva.observaciones)],
        ['Creada', API.formatearFecha(reserva.fecha_creacion)],
        ['Última actualización', API.formatearFecha(reserva.fecha_actualizacion)],
      ]);
      Reservas.pintarPlatillos(detalle.platillos || []);
      Reservas.pintarHistorial(detalle.historial || []);
      Reservas.ajustarAcciones(reserva);
    } catch (err) {
      ocultarContenido();
      API.mostrarAlerta(alertaError, err.status === 404
        ? `No encontramos la reserva ${codigo} entre tus reservas. Revisa el código.`
        : err.message);
    }
  }

  async function aplicar(peticion, alerta, boton, mensajeExito) {
    API.ocultarAlerta(alerta);
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

  document.querySelector('a[href="#modal-modificar"]').addEventListener('click', () => {
    if (reserva) Reservas.llenarModalModificar(reserva);
    API.ocultarAlerta(alertaModificar);
  });

  formModificar.addEventListener('submit', (e) => {
    e.preventDefault();
    let cambios;
    try {
      cambios = Reservas.cambiosModificar(reserva);
      if (cambios.fecha_hora_inicio && new Date(cambios.fecha_hora_inicio) <= new Date()) {
        throw new Error('La fecha y hora deben ser futuras.');
      }
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
      'Tu reserva se actualizó.'
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

  if (['#modal-modificar', '#modal-cancelar'].includes(window.location.hash)) API.cerrarModal();
  const aviso = API.avisoPendiente();
  if (aviso) API.mostrarAlerta(alertaExito, aviso);
  cargar();
}
