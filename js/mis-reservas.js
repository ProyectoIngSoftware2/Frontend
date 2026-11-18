// =====================================================================
// mis-reservas.js | Códigos de reserva del cliente guardados en este
// navegador. El backend todavía no tiene un endpoint para que un
// cliente liste sus propias reservas (GET /api/v1/reservas es solo para
// administradores), así que recordamos los códigos que se crean aquí.
// =====================================================================

const MisReservas = (() => {
  const clave = () => `mis_reservas_${API.sesion().id_cliente || 'x'}`;

  function listar() {
    try {
      return JSON.parse(localStorage.getItem(clave())) || [];
    } catch {
      return [];
    }
  }

  function agregar(codigo) {
    const codigos = listar().filter((c) => c !== codigo);
    codigos.unshift(codigo);
    localStorage.setItem(clave(), JSON.stringify(codigos.slice(0, 30)));
  }

  function quitar(codigo) {
    localStorage.setItem(clave(), JSON.stringify(listar().filter((c) => c !== codigo)));
  }

  return { listar, agregar, quitar };
})();
