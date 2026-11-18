// Reservas (administrador): listado con filtros y creación para un cliente.
if (API.requerirRol('administrador')) {
  const { el } = API;
  const tbody = document.getElementById('tb-reservas');
  const filtros = {
    q: document.getElementById('f-q'),
    estado: document.getElementById('f-estado'),
    desde: document.getElementById('f-desde'),
    hasta: document.getElementById('f-hasta'),
  };
  const formNueva = document.querySelector('#modal-nueva form');
  const alertaNueva = formNueva.querySelector('.alerta--error');
  const selCliente = document.getElementById('res-cliente');

  let reservas = [];
  let clientes = new Map();
  let mesas = new Map();

  function pintar() {
    const q = API.normalizar(filtros.q.value.trim());
    const estado = filtros.estado.value;
    const desde = filtros.desde.value ? new Date(`${filtros.desde.value}T00:00:00`) : null;
    const hasta = filtros.hasta.value ? new Date(`${filtros.hasta.value}T23:59:59`) : null;

    const visibles = reservas.filter((r) => {
      const c = clientes.get(r.id_cliente) || {};
      const fecha = new Date(r.fecha_hora_inicio);
      if (estado && r.estado !== estado) return false;
      if (desde && fecha < desde) return false;
      if (hasta && fecha > hasta) return false;
      if (q && !API.normalizar(`${r.codigo_reserva} ${c.nombre_completo || ''} ${c.correo || ''}`).includes(q)) return false;
      return true;
    });

    if (!visibles.length) {
      API.filaMensaje(tbody, reservas.length ? 'Ninguna reserva coincide con los filtros.' : 'Todavía no hay reservas registradas.');
      return;
    }
    tbody.replaceChildren(
      ...visibles.map((r) => {
        const href = `admin-detalle-reserva.html?codigo=${encodeURIComponent(r.codigo_reserva)}`;
        const mesa = mesas.get(r.id_mesa);
        return API.fila([
          ['Código', el('a', { class: 'codigo', href, text: r.codigo_reserva })],
          ['Cliente', (clientes.get(r.id_cliente) || {}).nombre_completo || `Cliente #${r.id_cliente}`],
          ['Mesa', mesa ? `Mesa ${mesa.numero_mesa}` : (r.id_mesa ? `Mesa #${r.id_mesa}` : 'Sin asignar')],
          ['Fecha y hora', API.formatearFecha(r.fecha_hora_inicio)],
          ['Personas', String(r.cantidad_personas)],
          ['Estado', API.etiquetaEstado(r.estado)],
          ['Acciones', el('div', { class: 'tabla__acciones' }, [el('a', { class: 'boton boton--pequeno', href, text: 'Ver detalle' })])],
        ]);
      })
    );
  }

  async function cargar() {
    API.filaMensaje(tbody, 'Cargando reservas…');
    try {
      const [R, C, M, P] = await Promise.all([
        API.get('/api/v1/reservas').then(API.datos),
        API.get('/api/v1/clientes').then(API.datos),
        Reservas.cargarMesas(),
        Reservas.cargarPlatillos(),
      ]);
      reservas = (R || []).sort((a, b) => new Date(b.fecha_hora_inicio) - new Date(a.fecha_hora_inicio));
      clientes = new Map((C || []).map((c) => [c.id_cliente, c]));
      mesas = new Map((M || []).map((m) => [m.id_mesa, m]));

      // Formulario "Nueva reserva"
      const primera = selCliente.options[0];
      selCliente.replaceChildren(primera);
      (C || []).filter((c) => c.activo).forEach((c) => {
        selCliente.append(el('option', { value: c.id_cliente, text: `${c.nombre_completo} — ${c.correo}` }));
      });
      Reservas.llenarSelectMesas(document.getElementById('res-mesa'), M || []);
      Reservas.pintarListaPlatillos(formNueva.querySelector('.lista-platillos'), P || []);
      pintar();
    } catch (err) {
      API.filaMensaje(tbody, err.message);
    }
  }

  Object.values(filtros).forEach((f) => f.addEventListener('input', pintar));
  document.querySelector('.filtros').addEventListener('submit', (e) => e.preventDefault());

  formNueva.addEventListener('submit', async (e) => {
    e.preventDefault();
    API.ocultarAlerta(alertaNueva);
    const boton = formNueva.querySelector('button[type="submit"]');
    let cuerpo;
    try {
      if (!selCliente.value) throw new Error('Selecciona el cliente de la reserva.');
      cuerpo = Reservas.cuerpoNuevaReserva(formNueva);
      cuerpo.id_cliente = Number(selCliente.value); // obligatorio para administradores
    } catch (err) {
      API.mostrarAlerta(alertaNueva, err.message);
      return;
    }
    API.setCargando(boton, true, 'Registrando…');
    try {
      const creada = API.datos(await API.post('/api/v1/reservas', cuerpo));
      API.avisoPendiente(`Reserva ${creada.codigo_reserva} registrada en estado Pendiente.`);
      window.location.href = `admin-detalle-reserva.html?codigo=${encodeURIComponent(creada.codigo_reserva)}`;
    } catch (err) {
      API.mostrarAlerta(alertaNueva, err.message);
    } finally {
      API.setCargando(boton, false);
    }
  });

  cargar();
}
