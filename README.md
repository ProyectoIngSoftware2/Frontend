# Frontend: Punto y Sal

Interfaz web del sistema de reservas y gestión de mesas del restaurante **Punto y Sal**.
Está hecha con HTML, CSS y JavaScript, y consume el backend
(FastAPI + PostgreSQL) a través del **API Gateway**.

## Tabla de contenido

- [Requisitos](#requisitos)
- [Cómo ejecutar el proyecto](#cómo-ejecutar-el-proyecto)
- [Conexión con el backend](#conexión-con-el-backend)
- [Roles y acceso](#roles-y-acceso)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Pantallas](#pantallas)
- [Buenas prácticas del código](#buenas-prácticas-del-código)
- [Solución de problemas](#solución-de-problemas)
- [Equipo](#equipo)

## Requisitos

- Un navegador moderno (Chrome, Edge o Firefox).
- [Visual Studio Code](https://code.visualstudio.com/) con la extensión **Live Server**.
- El backend de Punto y Sal en ejecución (repositorio `Backend`, rama `development`).

El frontend son archivos estáticos: se abren directamente en el navegador.

## Cómo ejecutar el proyecto

1. Clona el repositorio y entra a la carpeta:
   ```bash
   git clone https://github.com/ProyectoIngSoftware2/Frontend.git
   cd Frontend
   ```
2. Asegúrate de que el backend esté corriendo y que el Gateway responda en
   `http://localhost:8000/docs`.
3. Abre la carpeta en VS Code (`code .`).
4. Haz clic derecho en `login.html` y elige **Open with Live Server**.
   La aplicación se abrirá en `http://127.0.0.1:5500/login.html`.
5. Inicia sesión con una cuenta registrada en la base de datos.

> Las credenciales de prueba **no** se guardan en este repositorio porque es público.
> Pídelas al equipo de backend.

## Conexión con el backend

| Concepto | Valor |
|---|---|
| Punto de entrada único | API Gateway: `http://localhost:8000` |
| Prefijo de las rutas | `/api/v1/` |
| Autenticación | JWT enviado como `Authorization: Bearer <token>` |
| Login | `POST /api/v1/auth/login` con `{ "correo", "password" }` |
| Respuesta del login | `access_token`, `rol`, `correo`, `id_usuario` y, según el rol, `id_cliente` o `id_administrador` |

Reglas importantes:

- El frontend **solo** se comunica con el Gateway (puerto 8000). Nunca llama
  directamente a los microservicios (8001 a 8004) ni a la base de datos.
- El navegador solo puede llamar al backend si el origen del frontend está
  permitido en la configuración de **CORS** del Gateway. Con Live Server, el
  origen es `http://127.0.0.1:5500`.
- Si el backend responde **401**, la sesión venció o el token no es válido: el
  frontend borra la sesión y regresa al login.
- Si responde **403**, el usuario no tiene permiso para esa acción.

## Roles y acceso

El sistema maneja dos roles:

| Rol | Acceso |
|---|---|
| `administrador` | Panel de administración: clientes, mesas, platillos, reservas, usuarios y horarios |
| `cliente` | Área del cliente: inicio, nueva reserva, mis reservas, consulta y perfil |

- Después del login, cada usuario es redirigido al área de su rol.
- Las páginas protegidas verifican el rol al cargar. Si un cliente intenta abrir
  una página de administrador escribiendo la dirección a mano, es redirigido.
- Esta verificación en el frontend es solo para la experiencia de uso: **la
  seguridad real la aplica el backend** validando el JWT en cada petición.

## Estructura del proyecto

```
Frontend/
├── login.html, login.js, login.css     Inicio de sesión
├── registro.html                       Registro de clientes
├── Admin/                              Pantallas del administrador
│   ├── admin-panel.html                Panel principal
│   ├── admin-clientes.html             Gestión de clientes
│   ├── admin-mesas.html                Gestión de mesas
│   ├── admin-platillos.html            Gestión de platillos
│   ├── admin-reservas.html             Listado de reservas
│   └── admin-detalle-reserva.html      Detalle de una reserva
├── Cliente/                            Pantallas del cliente
│   ├── cliente-inicio.html             Inicio del cliente
│   ├── cliente-nueva-reserva.html      Crear una reserva
│   ├── cliente-consultar.html          Consultar reservas
│   ├── cliente-detalle-reserva.html    Detalle de una reserva
│   ├── cliente-perfil.html             Perfil del cliente
│   ├── menu.html                       Menú del restaurante
│   └── cliente.css                     Estilos del área de cliente
├── js/                                 Lógica de cada pantalla
│   ├── api.js                          Cliente HTTP compartido (Gateway, token, errores)
│   ├── reservas-comun.js               Funciones comunes de reservas
│   ├── admin-*.js                      Lógica de las pantallas de administrador
│   ├── cliente-*.js                    Lógica de las pantallas de cliente
│   ├── mis-reservas.js                 Listado de reservas del cliente
│   └── registro.js                     Registro de clientes
├── usuarios.html, usuarios.js          Gestión de usuarios y roles
├── horarios.html, horarios.js          Horarios operativos y bloqueos
├── catalogo.html, catalogo.js          Catálogo de mesas y platillos
├── estilos.css, style.css,             Estilos generales y componentes comunes
│   componentes.css
└── docs/                               Documentación de diseño y requerimientos
```

Convención de nombres: cada pantalla tiene su HTML y un archivo JS con el mismo
nombre (por ejemplo, `Admin/admin-mesas.html` usa `js/admin-mesas.js`).

## Pantallas

### Administrador
- **Panel:** acceso a todos los módulos de gestión.
- **Clientes:** consulta y administración de clientes.
- **Mesas y platillos:** crear, editar, desactivar y reactivar.
- **Reservas:** listado y detalle de reservas.
- **Usuarios y roles:** crear usuarios, asignar rol (`administrador` o `cliente`),
  editar, activar y desactivar. Consulta de roles.
- **Horarios y bloqueos:** configurar horarios por día de la semana y registrar
  bloqueos por mesa o generales.

### Cliente
- **Inicio** y **menú** del restaurante.
- **Nueva reserva:** fecha, hora, cantidad de personas y platillos opcionales.
- **Mis reservas:** consulta y detalle.
- **Perfil:** datos del cliente.

## Buenas prácticas del código

- **Todas las peticiones pasan por `api.js`.** No se escribe `fetch` directo en
  las pantallas; así el token, la URL del Gateway y el manejo de errores están en
  un solo lugar.
- **Nunca usar `innerHTML` con datos del backend.** Para mostrar texto que viene
  del servidor se usa `textContent` o se crean los elementos con
  `document.createElement`, para evitar ataques XSS.
- **Fechas con zona horaria.** Las fechas se envían en formato ISO-8601 con zona
  horaria (por ejemplo `2026-12-24T18:00:00-06:00`) para que el backend guarde la
  hora que eligió el usuario.
- **Validar antes de enviar**, con las mismas reglas que el backend (campos
  obligatorios, longitudes, rangos), y mostrar mensajes claros al usuario.
- **Confirmar acciones destructivas** (desactivar, eliminar) antes de ejecutarlas.
- **No guardar secretos en el repositorio**: ni contraseñas, ni archivos `.env`,
  ni credenciales de prueba.

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| "No se pudo conectar con el servidor" | El backend no está corriendo, o CORS no permite el origen del frontend | Verifica `http://localhost:8000/docs` y que `http://127.0.0.1:5500` esté en la configuración de CORS |
| Error 503 "Service unavailable" | El Gateway funciona pero un microservicio está caído | Revisa la terminal del servicio correspondiente |
| Regresa al login al entrar a una página | No hay sesión, o el token venció | Inicia sesión de nuevo |
| La página se ve sin estilos | Falta un archivo CSS o la ruta es incorrecta | Revisa que el `<link>` apunte al archivo correcto según la carpeta |
| "Open with Live Server" no aparece | La extensión no está instalada | Instala **Live Server** desde Extensiones (`Ctrl + Shift + X`) |

## Equipo

**Frontend**

| Integrante | Responsabilidad |
|---|---|
| Julissa Valladares | Login, sesiones, navegación por roles, área del cliente e integración con el backend |
| Sebastián Rivera | Gestión administrativa: usuarios, roles, horarios y bloqueos |

Ambos comparten reservas, catálogo, diseño común y pruebas.

**Backend:** Noé Mejía y David Ávila.
