// Panel del administrador: indicadores y próximas reservas.
if (API.requerirRol('administrador')) {
  const valores = document.querySelectorAll('.grid-indicadores .indicador__valor');
  const tbody = document.getElementById('tb-proximas');

  (async () => {
    valores.forEach((v) => { v.textContent = '…'; });
    API.filaMensaje(tbody, 'Cargando reservas…');

    // Cada fuente se carga por separado: si una falla, las demás se muestran igual.
    const [reservas, clientes, mesas, platillos] = await Promise.allSettled([
      API.get('/api/v1/reservas').then(API.datos),
      API.get('/api/v1/clientes').then(API.datos),
      API.get('/api/v1/catalogo/mesas', { publica: true }).then(API.datos),
      API.get('/api/v1/catalogo/platillos', { publica: true }).then(API.datos),
    ]);
    const lista = (r) => (r.status === 'fulfilled' ? r.value || [] : null);
    const R = lista(reservas);
    const C = lista(clientes);
    const M = lista(mesas);
    const P = lista(platillos);

    const contar = (arr, fn) => (arr ? String(arr.filter(fn).length) : '—');
    const cifras = [
      contar(R, (r) => r.estado === 'pendiente'),
      contar(R, (r) => r.estado === 'aprobada'),
      contar(R, (r) => r.estado === 'confirmada'),
      R ? String(R.length) : '—',
      contar(C, (c) => c.activo),
      contar(M, (m) => m.activa && m.estado === 'disponible'),
      contar(P, (p) => p.disponible),
    ];
    valores.forEach((v, i) => { v.textContent = cifras[i] ?? '—'; });

    if (!R) {
      API.filaMensaje(tbody, reservas.reason.message);
      return;
    }

    const nombres = new Map((C || []).map((c) => [c.id_cliente, c.nombre_completo]));
    const ahora = Date.now();
    const proximas = R
      .filter((r) => new Date(r.fecha_hora_inicio).getTime() >= ahora && !API.ESTADOS_FINALES.includes(r.estado))
      .sort((a, b) => new Date(a.fecha_hora_inicio) - new Date(b.fecha_hora_inicio))
      .slice(0, 8);

    if (!proximas.length) {
      API.filaMensaje(tbody, 'No hay reservas próximas.');
      return;
    }
    tbody.replaceChildren(
      ...proximas.map((r) => API.fila([
        ['Código', API.el('a', { class: 'codigo', href: `admin-detalle-reserva.html?codigo=${encodeURIComponent(r.codigo_reserva)}`, text: r.codigo_reserva })],
        ['Cliente', nombres.get(r.id_cliente) || `Cliente #${r.id_cliente}`],
        ['Fecha y hora', API.formatearFecha(r.fecha_hora_inicio)],
        ['Personas', String(r.cantidad_personas)],
        ['Estado', API.etiquetaEstado(r.estado)],
      ]))
    );
  })();
}
