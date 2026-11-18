// Inicio del cliente: saludo con su nombre real.
if (API.requerirRol('cliente')) {
  const { id_cliente } = API.sesion();
  const titulo = document.querySelector('.pagina-cab h1');
  titulo.textContent = 'Hola';
  if (id_cliente) {
    API.get(`/api/v1/clientes/${id_cliente}`)
      .then((r) => {
        const nombre = (API.datos(r).nombre_completo || '').split(' ')[0];
        titulo.textContent = nombre ? `Hola, ${nombre}` : 'Hola';
      })
      .catch(() => { /* el saludo genérico es suficiente */ });
  }
}
