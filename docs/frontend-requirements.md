

# Requerimientos del Frontend — Punto y Sal

## 1. Descripción general

El Frontend constituye la interfaz web del sistema de reservas y gestión de mesas del restaurante Punto y Sal.

Su propósito es proporcionar un entorno accesible, intuitivo y adaptable que permita a los clientes realizar solicitudes de reservación y al personal del restaurante administrar las operaciones relacionadas con las mesas y reservas.

La interfaz se comunicará con el Backend mediante APIs REST, permitiendo el intercambio de información entre los diferentes módulos del sistema.

## 2. Roles de usuario

El sistema contempla tres roles principales:

### 2.1 Cliente

El cliente podrá:

- Consultar la disponibilidad de mesas según la fecha, hora y cantidad de personas.
- Enviar solicitudes de reservación.
- Consultar los detalles y el estado de sus reservas.
- Modificar o cancelar reservaciones de acuerdo con las políticas establecidas.
- Seleccionar platillos anticipadamente cuando esta funcionalidad esté habilitada.

### 2.2 Recepción

El personal de recepción podrá:

- Acceder al panel de administración de reservas.
- Consultar la agenda diaria de reservaciones.
- Registrar reservas recibidas mediante llamadas telefónicas u otros canales externos.
- Buscar y filtrar reservaciones.
- Confirmar o rechazar solicitudes.
- Modificar y cancelar reservaciones.
- Asignar mesas considerando su capacidad y disponibilidad.

### 2.3 Administrador

El administrador podrá:

- Acceder a las funciones administrativas del sistema.
- Gestionar usuarios internos y roles.
- Administrar mesas, zonas y capacidades.
- Configurar horarios de operación y franjas reservables.
- Gestionar el catálogo de platillos.
- Consultar reportes e historial de reservaciones.
- Revisar la bitácora de actividad del sistema.

## 3. Módulos principales del Frontend

La interfaz estará organizada en los siguientes módulos:

| Módulo | Funcionalidad principal |
|---|---|
| Autenticación | Permitir el acceso seguro a los usuarios internos. |
| Gestión de reservas | Crear, consultar, modificar y cancelar reservaciones. |
| Disponibilidad | Mostrar las opciones de reservación disponibles. |
| Agenda diaria | Organizar las reservaciones por fecha y hora. |
| Gestión de mesas | Administrar mesas, zonas y capacidades. |
| Gestión de horarios | Configurar horarios de operación y franjas reservables. |
| Gestión del menú | Administrar platillos y su disponibilidad. |
| Reportes | Consultar información sobre reservas y ocupación. |
| Bitácora | Consultar los cambios relevantes realizados en el sistema. |

## 4. Navegación según el rol

### Cliente

Inicio → Consultar disponibilidad → Seleccionar opción → Datos de contacto → Platillos opcionales → Confirmación y estado → Mis reservas.

### Recepción

Inicio de sesión → Panel principal → Agenda diaria → Buscar o registrar reserva → Consultar disponibilidad → Confirmar o rechazar → Asignar mesa.

### Administrador

Inicio de sesión → Panel principal → Usuarios y roles / Mesas y zonas / Horarios / Menú / Reportes / Bitácora.

## 5. Requerimientos generales de la interfaz

- La interfaz deberá ser adaptable a diferentes tamaños de pantalla, incluyendo computadoras y dispositivos móviles.
- La navegación deberá ser clara y consistente.
- Los estados de las reservaciones deberán identificarse mediante texto, además de utilizar indicadores visuales.
- Los formularios deberán proporcionar mensajes claros cuando existan errores de validación.
- Se solicitará confirmación antes de cancelar reservaciones o ejecutar acciones irreversibles.
- Las funciones administrativas estarán disponibles según los permisos del usuario autenticado.
- La información de las reservaciones deberá protegerse para evitar que los clientes consulten datos de terceros.

## 6. Consideraciones técnicas

- Tecnología propuesta para el Frontend: React.
- Lenguajes y estilos: JavaScript y CSS.
- Comunicación con el Backend mediante APIs REST versionadas.
- Intercambio de información mediante JSON.
- Uso de HTTPS en los ambientes desplegados.
- Integración con los mecanismos de autenticación y autorización definidos para el Backend.

## 7. Alcance y limitaciones

Las siguientes funcionalidades no forman parte del alcance inicial del sistema:

- Desarrollo de una aplicación móvil nativa.
- Procesamiento de pagos en línea, anticipos o reembolsos.
- Integración directa con sistemas externos de punto de venta.
- Implementación de inteligencia artificial para predicción u optimización de reservas.
- Envío automático de mensajes mediante WhatsApp Business API.

## 8. Referencia documental

Documento de Diseño Conceptual — Punto y Sal: Sistema Web de Reservas y Gestión de Mesas.

Versión 4.0 — Ingeniería del Software II, III Período 2026.

Este documento establece una definición inicial de los requerimientos del Frontend y podrá actualizarse conforme avance el desarrollo y se validen las necesidades del proyecto.

