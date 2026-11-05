# Flujos de Usuario del Frontend: Punto y Sal

## 1. Introducción

Este documento describe, paso a paso, los flujos de interacción que cada rol realizará dentro de la interfaz web del sistema de reservas y gestión de mesas del restaurante Punto y Sal.

Para cada flujo se indica el rol que lo ejecuta, la pantalla involucrada, los pasos que sigue el usuario, las validaciones que aplica la interfaz y los casos alternos que deben contemplarse.

Este documento complementa los documentos **Requerimientos del Frontend**, **Diseño Conceptual de la Interfaz** y **Arquitectura y Estructura del Frontend**.

---

## 2. Resumen de flujos

| Código | Flujo | Rol | Pantalla principal |
|---|---|---|---|
| FU-01 | Solicitar una reservación | Cliente | Reserva del cliente |
| FU-02 | Consultar, modificar o cancelar una reserva | Cliente | Mis reservas |
| FU-03 | Iniciar sesión | Recepción y administrador | Inicio de sesión |
| FU-04 | Registrar una reserva recibida por canales externos | Recepción | Gestión de reservas |
| FU-05 | Confirmar o rechazar una solicitud y asignar mesa | Recepción | Gestión de reservas |
| FU-06 | Administrar mesas y zonas | Administrador | Gestión de mesas y zonas |
| FU-07 | Configurar horarios y bloqueos | Administrador | Horarios y disponibilidad |
| FU-08 | Administrar el catálogo de platillos | Administrador | Catálogo de platillos |
| FU-09 | Consultar reportes y bitácora | Administrador | Reportes y auditoría |
| FU-10 | Administrar usuarios internos y roles | Administrador | Usuarios y roles |

---

## 3. Flujos del cliente

### FU-01 Solicitar una reservación

**Rol:** Cliente.
**Pantalla:** Reserva del cliente (`/reservar`).

**Pasos:**

1. El cliente selecciona la fecha, la hora y la cantidad de personas.
2. Presiona **Consultar disponibilidad**.
3. La interfaz muestra las opciones de mesas disponibles para los datos ingresados.
4. El cliente selecciona una opción.
5. Ingresa sus datos de contacto: nombre, teléfono y correo electrónico.
6. Opcionalmente, agrega observaciones (por ejemplo, una celebración o una necesidad especial).
7. Opcionalmente, selecciona platillos del catálogo, cuando esta funcionalidad esté habilitada.
8. Revisa el resumen de la reservación.
9. Presiona **Solicitar reserva**.
10. La interfaz muestra el código de reserva y el estado **Pendiente**.

**Validaciones:** se aplican las reglas de la sección 6 para fecha, hora, cantidad de personas y datos de contacto.

**Casos alternos:**

- **Sin disponibilidad:** se muestra un mensaje y se sugiere cambiar la fecha, la hora o la cantidad de personas.
- **Error de conexión:** se muestra un mensaje general y se conservan los datos ingresados para que el cliente pueda reintentar.

**En dispositivos móviles**, el formulario se dividirá en pasos cortos:

1. Fecha, hora y cantidad de personas.
2. Selección de mesa.
3. Datos de contacto y observaciones.
4. Platillos (opcional).
5. Resumen y confirmación.

---

### FU-02 Consultar, modificar o cancelar una reserva

**Rol:** Cliente.
**Pantalla:** Mis reservas (`/mis-reservas`).

**Pasos:**

1. El cliente ingresa su código de reserva y un dato de contacto.
2. Presiona **Consultar**.
3. La interfaz muestra el detalle: fecha, hora, cantidad de personas, mesa, platillos seleccionados y estado.
4. Si desea **modificar**, cambia la fecha, la hora o la cantidad de personas. La interfaz vuelve a consultar la disponibilidad antes de guardar los cambios.
5. Si desea **cancelar**, presiona **Cancelar reserva**. Se muestra una ventana de confirmación y, al aceptar, el estado cambia a **Cancelada**.

**Validaciones:**

- El código de reserva y el dato de contacto deben corresponder a la misma reservación.
- Si los datos no coinciden, se muestra un mensaje general que no revela si el código existe, para proteger la información de terceros.
- Las opciones de modificar y cancelar solo se muestran cuando el estado de la reserva y las políticas establecidas lo permiten.

---

## 4. Flujos de recepción

### FU-03 Iniciar sesión

**Rol:** Recepción y administrador.
**Pantalla:** Inicio de sesión (`/login`).

**Pasos:**

1. El usuario ingresa su usuario y contraseña.
2. Presiona **Iniciar sesión**.
3. La interfaz verifica que ambos campos estén completos.
4. Si las credenciales son válidas, el usuario es dirigido al panel principal correspondiente a su rol.

**Casos alternos:**

- **Credenciales incorrectas:** se muestra un mensaje general, sin indicar cuál de los dos campos es incorrecto.
- **Sesión expirada:** el usuario es dirigido nuevamente al inicio de sesión con un mensaje informativo.

---

### FU-04 Registrar una reserva recibida por canales externos

**Rol:** Recepción.
**Pantalla:** Dashboard de recepción y gestión de reservas.

**Pasos:**

1. Desde el dashboard, el usuario presiona **Nueva reserva**.
2. Ingresa la fecha, la hora y la cantidad de personas.
3. Consulta la disponibilidad.
4. Selecciona o asigna una mesa.
5. Ingresa los datos de contacto del cliente y las observaciones.
6. Presiona **Guardar**.
7. La interfaz muestra el código de reserva para comunicarlo al cliente.
8. La reserva aparece en la agenda diaria.

**Nota:** el estado inicial de las reservas registradas por recepción (pendiente o confirmada) se definirá junto con el equipo de Backend.

---

### FU-05 Confirmar o rechazar una solicitud y asignar mesa

**Rol:** Recepción.
**Pantalla:** Gestión de reservas (`/reservas`).

**Pasos:**

1. El usuario filtra las reservaciones por estado **Pendiente**.
2. Abre el detalle de una solicitud.
3. Revisa los datos del cliente, la cantidad de personas y la mesa seleccionada.
4. Para **confirmar**, verifica o asigna la mesa y presiona **Confirmar**. El estado cambia a **Confirmada**.
5. Para **rechazar**, presiona **Rechazar**, confirma la acción e indica el motivo. El estado cambia a **Rechazada**.
6. Los indicadores del dashboard se actualizan.

**Validaciones:**

- La capacidad de la mesa asignada debe ser igual o mayor a la cantidad de personas.
- La mesa debe estar disponible en la fecha y franja horaria de la reserva.

---

## 5. Flujos del administrador

### FU-06 Administrar mesas y zonas

**Rol:** Administrador. Recepción solo en modo de consulta.
**Pantalla:** Gestión de mesas y zonas (`/mesas`).

**Pasos:**

1. El usuario consulta el listado de mesas y puede filtrar por zona o por estado.
2. Para registrar una mesa, presiona **Registrar mesa**.
3. Ingresa el código, la capacidad, la zona y el estado.
4. Presiona **Guardar**.
5. Para modificar una mesa existente, selecciona **Editar**, realiza los cambios y guarda.

**Validaciones:**

- El código de mesa debe ser único.
- La capacidad debe ser un número entero mayor a cero.
- La zona es obligatoria.
- Si se intenta desactivar una mesa con reservas futuras, se muestra una advertencia antes de continuar.

**Recepción:** visualiza el listado, pero no tiene acceso a los botones de registro ni de edición.

---

### FU-07 Configurar horarios y bloqueos

**Rol:** Administrador.
**Pantalla:** Horarios y disponibilidad (`/horarios`).

**Pasos para configurar horarios:**

1. El usuario selecciona el día de la semana.
2. Define la hora de apertura y de cierre.
3. Configura el intervalo entre franjas reservables.
4. Activa o desactiva el horario.
5. Presiona **Guardar**.

**Pasos para registrar un bloqueo:**

1. Selecciona la fecha y el rango de horas.
2. Indica si el bloqueo es general o para una mesa específica.
3. Escribe el motivo del bloqueo.
4. Presiona **Guardar**.

**Validaciones:**

- La hora de cierre debe ser posterior a la hora de apertura.
- El motivo del bloqueo es obligatorio.
- Si el bloqueo afecta reservas existentes, se muestra una advertencia antes de guardar.

---

### FU-08 Administrar el catálogo de platillos

**Rol:** Administrador. Cliente solo en modo de consulta.
**Pantalla:** Catálogo de platillos (`/platillos`).

**Pasos:**

1. El usuario busca o filtra los platillos por categoría o disponibilidad.
2. Para registrar un platillo, presiona **Registrar platillo**.
3. Ingresa el nombre, la categoría, el precio y el estado de disponibilidad.
4. Presiona **Guardar**.
5. Para modificar un platillo, selecciona **Editar**, realiza los cambios y guarda.

**Validaciones:**

- El nombre y la categoría son obligatorios.
- El precio debe ser un valor numérico mayor a cero.
- Los platillos marcados como no disponibles no aparecen para selección en la reserva del cliente.

---

### FU-09 Consultar reportes y bitácora

**Rol:** Administrador.
**Pantalla:** Reportes y auditoría (`/reportes` y `/bitacora`).

**Pasos para reportes:**

1. El usuario selecciona la fecha inicial, la fecha final y, opcionalmente, el estado.
2. Presiona **Consultar**.
3. La interfaz muestra los indicadores de reservas, cancelaciones y ocupación estimada, los gráficos y la tabla de resultados.
4. Opcionalmente, presiona **Exportar** para descargar el reporte.

**Pasos para la bitácora:**

1. El usuario filtra los registros por fecha, usuario o módulo.
2. La interfaz muestra el usuario, la acción realizada, la fecha y hora, y el registro afectado.

**Validaciones:**

- La fecha final no puede ser anterior a la fecha inicial.
- Si no existen resultados, se muestra un mensaje de ausencia de registros.

---

### FU-10 Administrar usuarios internos y roles

**Rol:** Administrador.
**Pantalla:** Usuarios y roles (`/usuarios`).

**Pasos:**

1. El usuario consulta el listado de usuarios internos.
2. Para registrar un usuario, presiona **Registrar usuario**.
3. Ingresa el nombre, el nombre de usuario y el rol (Recepción o Administrador).
4. Presiona **Guardar**.
5. Para modificar o desactivar un usuario, selecciona la acción correspondiente y confirma.

**Validaciones:**

- El nombre de usuario debe ser único.
- El rol es obligatorio.
- Se solicita confirmación antes de desactivar un usuario.
- Se recomienda impedir que un administrador desactive su propia cuenta.

La asignación y el restablecimiento de contraseñas seguirán el mecanismo definido por el Backend.

---

## 6. Reglas de validación de formularios

| Campo | Regla | Mensaje de error |
|---|---|---|
| Fecha de reserva | No puede ser anterior a la fecha actual. | Selecciona una fecha a partir de hoy. |
| Hora de reserva | Debe estar dentro de las franjas habilitadas. | La hora seleccionada no está disponible. |
| Cantidad de personas | Número entero mayor a cero. | Ingresa una cantidad válida de personas. |
| Nombre | Obligatorio. | Ingresa tu nombre. |
| Teléfono | Obligatorio, solo números, 8 dígitos. | Ingresa un número de teléfono válido de 8 dígitos. |
| Correo electrónico | Formato de correo válido. | Ingresa un correo electrónico válido. |
| Observaciones | Opcional, máximo 250 caracteres. | Las observaciones no pueden superar los 250 caracteres. |
| Capacidad de mesa | Número entero mayor a cero. | Ingresa una capacidad válida. |
| Precio del platillo | Valor numérico mayor a cero. | Ingresa un precio válido. |
| Hora de cierre | Posterior a la hora de apertura. | La hora de cierre debe ser posterior a la de apertura. |
| Fecha final (reportes) | No anterior a la fecha inicial. | La fecha final no puede ser anterior a la fecha inicial. |

**Lineamientos:**

- Los mensajes de error se mostrarán junto al campo correspondiente.
- La validación se realizará al salir de cada campo y nuevamente al enviar el formulario.
- Los datos ingresados no se borrarán cuando ocurra un error.
- El botón de envío se deshabilitará mientras se procesa la solicitud, para evitar registros duplicados.
- Los límites propuestos (como la cantidad de caracteres) se confirmarán con el equipo de Backend.
- Las validaciones del Frontend no reemplazan las validaciones del Backend.

---

## 7. Mensajes del sistema

| Tipo | Cuándo se muestra | Ejemplo |
|---|---|---|
| Éxito | Al completar una acción. | Tu solicitud fue enviada. Tu código de reserva es [código]. |
| Confirmación | Antes de una acción irreversible. | ¿Deseas cancelar esta reserva? Esta acción no se puede deshacer. |
| Validación | Cuando un campo no cumple una regla. | Ingresa un correo electrónico válido. |
| Sin resultados | Cuando una búsqueda no encuentra registros. | No se encontraron reservaciones con los filtros seleccionados. |
| Error de conexión | Cuando no se puede comunicar con el Backend. | No pudimos conectar con el sistema. Intenta de nuevo. |
| Acceso no autorizado | Cuando el rol no tiene permiso. | No tienes permisos para acceder a esta sección. |
| Sesión expirada | Cuando la sesión deja de ser válida. | Tu sesión expiró. Inicia sesión nuevamente. |

Los mensajes se redactarán en lenguaje sencillo y cordial, sin términos técnicos ni códigos de error visibles para el usuario.

---

## 8. Alcance

Este documento representa una propuesta inicial de los flujos de usuario del Frontend.

Los pasos, validaciones y mensajes podrán ajustarse durante el desarrollo y las pruebas, siempre que se mantengan alineados con los requerimientos del proyecto y las reglas de negocio acordadas con el equipo de Backend.

---

## 9. Referencia documental

Documento de Diseño Conceptual: Punto y Sal, Sistema Web de Reservas y Gestión de Mesas.

Versión 4.0, Ingeniería del Software II, III Período 2026.

Documentos complementarios del Frontend: Requerimientos del Frontend, Diseño Conceptual de la Interfaz y Arquitectura y Estructura del Frontend.
