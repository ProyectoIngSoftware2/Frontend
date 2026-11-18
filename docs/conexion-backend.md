# Conexión del Frontend con el Backend

## Cómo correrlo

1. **Backend** (repo `Backend`, rama `development`): en el `.env` de la raíz agrega
   ```
   CORS_ORIGINS=http://127.0.0.1:5500,http://localhost:5500
   ```
   y levanta todo con `docker compose up --build`. Sin esta variable el Gateway
   no envía cabeceras CORS y el navegador bloquea todas las peticiones
   ("No se pudo conectar con el servidor").
2. **Frontend**: abre la carpeta en VS Code y usa **Live Server** sobre `login.html`
   (puerto 5500). No abras los HTML con doble clic (`file://` no pasa CORS).
3. Si el Gateway corre en otra máquina/puerto, cambia `API_BASE_URL` en `js/api.js`.

## Estructura

| Archivo | Qué hace |
|---|---|
| `js/api.js` | Cliente HTTP único: agrega el token, traduce errores, protege páginas por rol, cierra sesión en 401 |
| `js/reservas-comun.js` | Catálogo, formulario de reserva y pantalla de detalle (compartido Admin/Cliente) |
| `js/mis-reservas.js` | Recuerda en el navegador los códigos de reserva del cliente |
| `login.js`, `js/registro.js` | Inicio de sesión y creación de cuenta |
| `js/admin-*.js`, `js/cliente-*.js` | Un script por pantalla |

## Endpoints que usa cada pantalla

| Pantalla | Endpoints |
|---|---|
| Login | `POST /api/v1/auth/login` |
| Crear cuenta | `POST /api/v1/clientes` + login automático |
| Admin · Panel | `GET /reservas`, `GET /clientes`, `GET /catalogo/mesas`, `GET /catalogo/platillos` |
| Admin · Reservas | `GET /reservas`, `GET /clientes`, `POST /reservas` (con `id_cliente`) |
| Admin · Detalle | `GET /reservas/{codigo}`, `GET /clientes/{id}`, `PATCH /reservas/{codigo}` (estado y datos), `DELETE /reservas/{codigo}` |
| Admin · Clientes | `GET /clientes`, `PATCH /clientes/{id}`, `DELETE /clientes/{id}` |
| Admin · Mesas | `GET/POST /catalogo/mesas`, `PATCH/DELETE /catalogo/mesas/{id}` |
| Admin · Platillos | `GET/POST /catalogo/platillos`, `PATCH/DELETE /catalogo/platillos/{id}` |
| Cliente · Inicio / Perfil | `GET/PATCH /clientes/{id_cliente}` |
| Cliente · Nueva reserva | `GET /catalogo/mesas`, `GET /catalogo/platillos`, `POST /reservas` (sin `id_cliente`) |
| Cliente · Consultar / Detalle | `GET /reservas/{codigo}`, `PATCH` / `DELETE /reservas/{codigo}` |
| Cliente · Menú | `GET /catalogo/platillos` |

(Todas las rutas van con el prefijo `/api/v1` hacia `http://localhost:8000`.)

## Limitación conocida del backend

No existe un endpoint para que un **cliente** liste sus propias reservas
(`GET /api/v1/reservas` es solo para administradores). Por eso el cliente
consulta por código, y la pantalla "Consultar reserva" muestra además las
reservas creadas o consultadas desde ese navegador. Si el backend agrega algo
como `GET /api/v1/reservas?mias=true`, basta con cambiar `js/cliente-consultar.js`.
