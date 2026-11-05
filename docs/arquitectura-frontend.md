# Arquitectura y Estructura del Frontend: Punto y Sal

## 1. Introducción

Este documento describe la propuesta de organización técnica del Frontend del sistema de reservas y gestión de mesas del restaurante Punto y Sal.

Su objetivo es definir la estructura de carpetas, los componentes reutilizables, las rutas, el control de acceso por rol y las convenciones de trabajo que permitirán al equipo desarrollar la interfaz de forma ordenada y consistente.

Esta propuesta complementa los documentos **Requerimientos del Frontend** y **Diseño Conceptual de la Interfaz**.

---

## 2. Tecnologías propuestas

| Elemento | Propuesta | Propósito |
|---|---|---|
| Biblioteca principal | React | Construcción de la interfaz mediante componentes. |
| Lenguaje | JavaScript | Lógica de la interfaz. |
| Estilos | CSS | Presentación visual y diseño adaptable. |
| Herramienta de desarrollo | Vite | Creación y ejecución del proyecto en ambiente local. |
| Navegación | React Router | Manejo de rutas y pantallas. |
| Comunicación con el Backend | Fetch API o Axios | Consumo de las APIs REST. |
| Control de versiones | Git y GitHub | Registro de cambios y trabajo colaborativo. |

Las herramientas complementarias (Vite, React Router y Axios) se confirmarán con el equipo antes de iniciar la implementación.

---

## 3. Estructura de carpetas

Se propone la siguiente organización del proyecto:

```
frontend/
├── public/
├── src/
│   ├── assets/          # Logotipo, imágenes e íconos
│   ├── components/
│   │   ├── common/      # Componentes reutilizables
│   │   └── layout/      # Estructura general de las pantallas
│   ├── pages/
│   │   ├── auth/        # Inicio de sesión
│   │   ├── cliente/     # Reserva, consulta de reservas y menú
│   │   ├── recepcion/   # Dashboard y agenda diaria
│   │   └── admin/       # Mesas, horarios, platillos, usuarios, reportes y bitácora
│   ├── routes/          # Definición de rutas y rutas protegidas
│   ├── services/        # Comunicación con las APIs REST
│   ├── context/         # Estado global (sesión del usuario)
│   ├── hooks/           # Lógica reutilizable
│   ├── utils/           # Funciones auxiliares, validaciones y constantes
│   ├── styles/          # Variables de color, tipografía y estilos globales
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── package.json
└── README.md
```

Esta estructura separa la presentación (páginas y componentes), la lógica de comunicación (servicios) y la configuración visual (estilos), lo que facilita el mantenimiento y la reutilización del código.

---

## 4. Componentes reutilizables

### 4.1 Componentes comunes

| Componente | Descripción | Uso principal |
|---|---|---|
| Boton | Botón con variantes principal, secundaria y de peligro. | Todas las pantallas. |
| CampoFormulario | Campo de entrada con etiqueta y mensaje de validación. | Formularios de reserva, mesas y platillos. |
| Tabla | Tabla con encabezados, registros y acciones. | Gestión de reservas, mesas, platillos y reportes. |
| BarraFiltros | Buscador y filtros por fecha, estado, zona o categoría. | Pantallas administrativas. |
| EtiquetaEstado | Muestra el estado mediante texto y color. | Reservas y mesas. |
| ModalConfirmacion | Solicita confirmación antes de una acción irreversible. | Cancelar reservas o desactivar registros. |
| TarjetaIndicador | Panel con un dato resumido. | Dashboard de recepción y reportes. |
| Cargando | Indicador mientras se obtiene información. | Consultas al Backend. |
| SinResultados | Mensaje cuando no existen registros. | Tablas y búsquedas. |
| MensajeError | Mensaje claro cuando ocurre un error. | Formularios y consultas. |

### 4.2 Componentes de estructura

- **LayoutPublico:** estructura para las pantallas del cliente, con la identificación de Punto y Sal y el área de contenido.
- **LayoutPrivado:** estructura para recepción y administrador, con menú de navegación, área principal y opción para cerrar sesión.
- **MenuNavegacion:** muestra únicamente las opciones permitidas para el rol del usuario autenticado.

---

## 5. Rutas del sistema

| Ruta | Pantalla | Acceso |
|---|---|---|
| `/` | Inicio | Público |
| `/reservar` | Reserva del cliente | Público |
| `/mis-reservas` | Consulta de reservas del cliente | Público, mediante código de reserva |
| `/menu` | Catálogo de platillos (consulta) | Público |
| `/login` | Inicio de sesión | Recepción y administrador |
| `/panel` | Panel principal (contenido según el rol) | Recepción y administrador |
| `/reservas` | Gestión de reservas | Recepción y administrador |
| `/mesas` | Gestión de mesas y zonas | Administrador; recepción en modo de consulta |
| `/horarios` | Horarios y disponibilidad | Administrador |
| `/platillos` | Gestión del catálogo de platillos | Administrador |
| `/usuarios` | Usuarios internos y roles | Administrador |
| `/reportes` | Reportes | Administrador |
| `/bitacora` | Bitácora de actividad | Administrador |

---

## 6. Control de acceso por rol

- Se utilizará un componente **RutaProtegida** que verificará si existe una sesión activa y si el rol del usuario tiene permiso para acceder a la pantalla solicitada.
- Si no existe sesión, el usuario será redirigido a `/login`.
- Si el usuario no tiene el rol requerido, se mostrará un mensaje de acceso no autorizado.
- El menú de navegación mostrará solo las opciones correspondientes al rol.
- La consulta de reservas por parte del cliente requerirá el código de reserva junto con un dato de contacto, para evitar el acceso a información de terceros. El mecanismo definitivo se acordará con el equipo de Backend.
- El control de acceso en el Frontend es complementario. La validación final de permisos se realizará en el Backend en cada solicitud.

---

## 7. Comunicación con el Backend

- Todas las solicitudes a las APIs REST se realizarán desde la carpeta `services/`, nunca directamente desde las páginas.
- Un archivo base (`api.js`) centralizará la configuración común:
  - URL base obtenida desde una variable de entorno (por ejemplo, `VITE_API_URL`).
  - Prefijo de versión de la API (por ejemplo, `/api/v1`).
  - Encabezados para el intercambio de información en formato JSON.
  - Envío del token de sesión en las solicitudes protegidas.
- Se propone un servicio por módulo:

| Servicio | Módulo relacionado |
|---|---|
| authService | Autenticación |
| reservasService | Gestión de reservas y agenda diaria |
| disponibilidadService | Consulta de disponibilidad |
| mesasService | Mesas y zonas |
| horariosService | Horarios y bloqueos |
| platillosService | Catálogo de platillos |
| usuariosService | Usuarios internos y roles |
| reportesService | Reportes |
| bitacoraService | Bitácora de actividad |

### 7.1 Manejo de respuestas y errores

| Situación | Comportamiento en la interfaz |
|---|---|
| Sesión expirada o no válida | Redirigir al inicio de sesión. |
| Acceso no autorizado | Mostrar mensaje de permisos insuficientes. |
| Datos inválidos | Mostrar los mensajes de validación junto al campo correspondiente. |
| Registro no encontrado | Mostrar mensaje de ausencia de resultados. |
| Error del servidor o sin conexión | Mostrar un mensaje general y permitir reintentar. |

Los endpoints definitivos y el formato de las respuestas se acordarán con el equipo de Backend.

---

## 8. Manejo del estado

- **Estado global:** se utilizará Context API para almacenar la sesión del usuario y su rol.
- **Estado local:** los formularios, filtros y tablas manejarán su propio estado dentro de cada pantalla.
- No se contempla una librería adicional de manejo de estado en el alcance inicial. Su uso se evaluará si la complejidad del sistema aumenta.

---

## 9. Estados de las reservaciones

Los estados se definirán en un único archivo de constantes (`utils/constantes.js`) para mantener consistencia en todas las pantallas:

- Pendiente
- Confirmada
- Rechazada
- Cancelada

Cada estado se mostrará siempre con su **texto visible** y un color de apoyo, de acuerdo con los lineamientos de usabilidad. Los valores deberán coincidir con los definidos por el Backend.

---

## 10. Estilos y diseño adaptable

La paleta establecida en el Diseño Conceptual de la Interfaz se definirá como variables globales en `styles/variables.css`:

```css
:root {
  --color-principal: #183044;   /* Azul petróleo */
  --color-secundario: #2D5D7B;  /* Azul medio */
  --color-fondo: #F4F7FA;       /* Fondo claro */
  --color-acento: #E9A15B;      /* Acento cálido */
}
```

Lineamientos:

- Se aplicará un enfoque **mobile first**: los estilos base se diseñarán para dispositivos móviles y se ampliarán para pantallas mayores.
- Puntos de quiebre de referencia: 768 px (tabletas) y 1024 px (escritorio).
- En dispositivos móviles, las tablas extensas podrán mostrarse como tarjetas para evitar desplazamientos horizontales.
- Los formularios de reserva se dividirán en pasos cortos en pantallas pequeñas.

---

## 11. Convenciones de código

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes | PascalCase | `TablaReservas.jsx` |
| Funciones y variables | camelCase | `obtenerReservas()` |
| Constantes | Mayúsculas con guion bajo | `ESTADOS_RESERVA` |
| Servicios | camelCase terminado en Service | `reservasService.js` |
| Rutas | Minúsculas separadas por guiones | `/mis-reservas` |

Lineamientos adicionales:

- Un componente por archivo.
- Los nombres del dominio se escribirán en español (reserva, mesa, platillo, zona) para mantener consistencia con la documentación del proyecto.
- Los componentes deberán contemplar los estados de carga, ausencia de resultados y error.

---

## 12. Flujo de trabajo en Git

### 12.1 Ramas

| Rama | Propósito |
|---|---|
| `main` | Versión estable del proyecto. |
| `develop` | Integración de funcionalidades en desarrollo. |
| `feature/nombre-funcionalidad` | Desarrollo de una funcionalidad específica. |

### 12.2 Mensajes de commit

Se propone el formato `tipo: descripción breve`:

| Tipo | Uso | Ejemplo |
|---|---|---|
| feat | Nueva funcionalidad | `feat: agregar formulario de reserva` |
| fix | Corrección de errores | `fix: corregir validación de fecha` |
| docs | Documentación | `docs: agregar arquitectura del frontend` |
| style | Cambios de estilo o formato | `style: ajustar espaciado del dashboard` |
| refactor | Reorganización sin cambiar la funcionalidad | `refactor: separar servicios de reservas` |

Los cambios se integrarán a `develop` mediante Pull Requests revisados por al menos un integrante del equipo.

---

## 13. Alcance

Este documento representa una propuesta inicial de arquitectura para el Frontend.

No constituye todavía una implementación funcional. La estructura, las rutas y las convenciones podrán ajustarse durante el desarrollo, siempre que se mantengan alineadas con los requerimientos del proyecto y los acuerdos con el equipo de Backend.

---

## 14. Referencia documental

Documento de Diseño Conceptual: Punto y Sal, Sistema Web de Reservas y Gestión de Mesas.

Versión 4.0, Ingeniería del Software II, III Período 2026.

Documentos complementarios del Frontend: Requerimientos del Frontend y Diseño Conceptual de la Interfaz.
