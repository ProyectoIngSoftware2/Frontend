// Consultar reserva (cliente): búsqueda por código + reservas hechas
// desde este navegador.
if (API.requerirRol('cliente')) {
  const { el } = API;
  const form = document.querySelector('main form.formulario');
  const input = document.getElementById('codigo');
  const aviso = document.querySelector('main > div[style] .alerta');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const codigo = input.value.trim().toUpperCase();
    if (!codigo) {
      input.classList.add('is-invalid');
      input.focus();
      return;
    }
    window.location.href = `cliente-detalle-reserva.html?codigo=${encodeURIComponent(codigo)}`;
  });
  input.addEventListener('input', () => input.classList.remove('is-invalid'));

  // Reservas recordadas en este navegador
  const codigos = MisReservas.listar();
  if (codigos.length) {
    const tbody = el('tbody');
    const seccion = el('section', { class: 'tarjeta', style: 'max-width: 720px; margin-top: 16px;' }, [
      el('h2', { text: 'Reservas hechas desde este navegador' }),
      el('div', { class: 'tabla-wrap' }, [
        el('table', { class: 'tabla' }, [
          el('thead', {}, [el('tr', {}, ['Código', 'Fecha y hora', 'Personas', 'Estado'].map((t) => el('th', { scope: 'col', text: t })))]),
          tbody,
        ]),
      ]),
    ]);
    aviso.parentElement.before(seccion);
    API.filaMensaje(tbody, 'Cargando…');

    Promise.allSettled(codigos.map((c) => Reservas.cargarDetalle(c))).then((resultados) => {
      const filas = [];
      resultados.forEach((r, i) => {
        if (r.status !== 'fulfilled') {
          if (r.reason.status === 404) MisReservas.quitar(codigos[i]);
          return;
        }
        const res = r.value.data;
        filas.push(API.fila([
          ['Código', el('a', { class: 'codigo', href: `cliente-detalle-reserva.html?codigo=${encodeURIComponent(res.codigo_reserva)}`, text: res.codigo_reserva })],
          ['Fecha y hora', API.formatearFecha(res.fecha_hora_inicio)],
          ['Personas', String(res.cantidad_personas)],
          ['Estado', API.etiquetaEstado(res.estado)],
        ]));
      });
      if (filas.length) tbody.replaceChildren(...filas);
      else API.filaMensaje(tbody, 'No se pudieron cargar tus reservas.');
    });
  }
}
