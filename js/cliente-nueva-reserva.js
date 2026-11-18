// Nueva reserva (cliente). La identidad del cliente sale del token:
// NO se envía id_cliente.
if (API.requerirRol('cliente')) {
  const form = document.querySelector('main form.formulario');
  const alerta = form.querySelector('.alerta--error');
  const boton = form.querySelector('button[type="submit"]');
  const lista = form.querySelector('.lista-platillos');

  // No permitir fechas pasadas en el selector.
  document.getElementById('res-fecha').min = API.isoAFechaLocal(new Date().toISOString());

  (async () => {
    try {
      const [mesas, platillos] = await Promise.all([Reservas.cargarMesas(), Reservas.cargarPlatillos()]);
      Reservas.llenarSelectMesas(document.getElementById('res-mesa'), mesas);
      Reservas.pintarListaPlatillos(lista, platillos);
    } catch (err) {
      API.mostrarAlerta(alerta, `No se pudo cargar el catálogo: ${err.message}`);
      lista.replaceChildren();
    }
  })();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    API.ocultarAlerta(alerta);
    let cuerpo;
    try {
      cuerpo = Reservas.cuerpoNuevaReserva(form);
    } catch (err) {
      API.mostrarAlerta(alerta, err.message);
      return;
    }
    API.setCargando(boton, true, 'Enviando…');
    try {
      const creada = API.datos(await API.post('/api/v1/reservas', cuerpo));
      MisReservas.agregar(creada.codigo_reserva);
      API.avisoPendiente(`¡Listo! Tu reserva ${creada.codigo_reserva} quedó en estado Pendiente. Guarda este código.`);
      window.location.href = `cliente-detalle-reserva.html?codigo=${encodeURIComponent(creada.codigo_reserva)}`;
    } catch (err) {
      API.mostrarAlerta(alerta, err.message);
      alerta.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      API.setCargando(boton, false);
    }
  });
}
