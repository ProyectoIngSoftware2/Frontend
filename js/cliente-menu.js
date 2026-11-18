// Menú (cliente): platillos disponibles del catálogo público.
if (API.requerirRol('cliente')) {
  const { el } = API;
  const grid = document.getElementById('grid-menu');
  grid.replaceChildren(el('div', { class: 'estado', text: 'Cargando menú…' }));

  API.get('/api/v1/catalogo/platillos', { publica: true })
    .then((r) => {
      const disponibles = (API.datos(r) || []).filter((p) => p.disponible);
      if (!disponibles.length) {
        grid.replaceChildren(el('div', { class: 'estado', text: 'El menú no tiene platillos disponibles por ahora.' }));
        return;
      }
      grid.replaceChildren(
        ...disponibles.map((p) => el('article', { class: 'platillo' }, [
          el('h3', { text: p.nombre }),
          el('p', { text: p.descripcion || '' }),
          el('span', { class: 'platillo__precio', text: API.formatearPrecio(p.precio) }),
        ]))
      );
    })
    .catch((err) => {
      grid.replaceChildren(el('div', { class: 'alerta alerta--error' }, [el('span', { text: err.message })]));
    });
}
