
# Diseño Conceptual de la Interfaz — Punto y Sal

## 1. Introducción

Este documento describe la propuesta visual y estructural de la interfaz web del sistema de reservas y gestión de mesas del restaurante Punto y Sal.

El diseño busca ofrecer una experiencia intuitiva, organizada y adaptable a diferentes dispositivos, considerando las necesidades de los tres roles principales: cliente, recepción y administrador.

La propuesta se basa en los wireframes y lineamientos visuales establecidos en el Documento de Diseño Conceptual del proyecto.

## 2. Identidad visual

La interfaz conservará una línea visual funcional y sencilla, modernizando la presentación del sistema mediante una distribución clara de los elementos, navegación directa y componentes visuales consistentes.

### 2.1 Paleta de colores

Se establece como propuesta inicial la siguiente paleta:

| Color | Código hexadecimal | Aplicación |
|---|---|---|
| Azul petróleo | #183044 | Elementos principales y navegación. |
| Azul medio | #2D5D7B | Botones secundarios y elementos interactivos. |
| Fondo claro | #F4F7FA | Fondo general de las pantallas. |
| Acento cálido | #E9A15B | Elementos destacados y llamadas de atención. |

### 2.2 Tipografía

Se utilizará una tipografía de fácil lectura, manteniendo una jerarquía visual entre:

- Títulos principales.
- Subtítulos y encabezados de sección.
- Texto descriptivo.
- Etiquetas de formularios.
- Información complementaria.

La familia tipográfica definitiva se seleccionará durante la etapa de implementación visual.

## 3. Estructura general de la interfaz

La organización de las pantallas dependerá del rol del usuario.

### 3.1 Área de navegación

Las interfaces administrativas y de recepción deberán contar con una navegación que permita acceder directamente a los módulos correspondientes.

Se contemplan los siguientes elementos:

- Identificación del sistema Punto y Sal.
- Menú de navegación.
- Acceso a las funciones correspondientes al rol.
- Opción para cerrar sesión.
- Área principal para mostrar el contenido del módulo seleccionado.

### 3.2 Organización del contenido

Se propone utilizar:

- Paneles informativos para presentar datos relevantes.
- Tablas para consultar y administrar registros.
- Formularios para ingresar o modificar información.
- Filtros para facilitar las búsquedas.
- Botones de acción claramente identificados.

## 4. Diseño conceptual de las pantallas

Se contemplan ocho pantallas principales:

### 4.1 Pantalla de inicio de sesión

**Rol:** Administrador y recepción.

**Objetivo:** Permitir el acceso seguro a las funciones internas del sistema.

Elementos principales:
- Identificación de Punto y Sal.
- Campo de usuario.
- Campo de contraseña.
- Botón para iniciar sesión.
- Información de contacto para solicitar ayuda.

### 4.2 Dashboard de recepción

**Rol:** Recepción.

**Objetivo:** Visualizar la agenda diaria y acceder rápidamente a las operaciones frecuentes.

Elementos principales:
- Fecha actual.
- Buscador por código de reserva o cliente.
- Indicadores de reservas pendientes, confirmadas y canceladas.
- Tabla de reservaciones.
- Acceso para registrar una nueva reserva.

### 4.3 Pantalla de reserva del cliente

**Rol:** Cliente.

**Objetivo:** Consultar disponibilidad y enviar una solicitud de reservación.

Elementos principales:
- Selección de fecha.
- Selección de hora.
- Cantidad de personas.
- Consulta de disponibilidad.
- Opciones de mesas disponibles.
- Datos de contacto.
- Campo de observaciones.
- Selección opcional de platillos.
- Botón para solicitar la reserva.

### 4.4 Pantalla de gestión de reservas

**Rol:** Recepción y administrador.

**Objetivo:** Consultar y administrar las reservaciones registradas.

Elementos principales:
- Filtros por fecha y estado.
- Buscador de reservaciones.
- Tabla con código, cliente, fecha, hora, cantidad de personas y estado.
- Acciones para consultar, confirmar, rechazar, modificar y cancelar.
- Vista del detalle de la reserva, incluyendo contacto, mesa, platillos e historial.

### 4.5 Pantalla de gestión de mesas y zonas

**Rol:** Administrador; recepción con acceso de consulta.

**Objetivo:** Administrar la capacidad, zona y estado de las mesas.

Elementos principales:
- Listado de mesas.
- Filtro por zona.
- Filtro por estado.
- Código de mesa.
- Capacidad.
- Zona asignada.
- Estado de la mesa.
- Acción para registrar o editar mesas.

### 4.6 Pantalla de horarios y disponibilidad

**Rol:** Administrador.

**Objetivo:** Configurar las franjas reservables y los bloqueos de disponibilidad.

Elementos principales:
- Selección del día.
- Hora de apertura y cierre.
- Configuración de intervalos.
- Activación o desactivación de horarios.
- Registro de bloqueos por fecha y hora.
- Selección de mesa específica o bloqueo general.
- Campo para indicar el motivo del bloqueo.

### 4.7 Pantalla de catálogo de platillos

**Rol:** Administrador; cliente en modo de consulta.

**Objetivo:** Mantener actualizado el menú y permitir consultar los platillos disponibles.

Elementos principales:
- Listado de platillos.
- Buscador.
- Filtro por categoría.
- Filtro de disponibilidad.
- Nombre del platillo.
- Categoría.
- Precio.
- Estado de disponibilidad.
- Opciones para registrar, editar y guardar cambios.

### 4.8 Pantalla de reportes y auditoría

**Rol:** Administrador.

**Objetivo:** Consultar indicadores operativos y revisar los cambios realizados en el sistema.

Elementos principales:
- Filtros por fecha inicial y final.
- Filtro por estado.
- Indicadores de reservas, cancelaciones y ocupación estimada.
- Gráficos de reservas por día o franja horaria.
- Tabla de resultados.
- Opción para exportar reportes.
- Acceso a la bitácora de actividad.

## 5. Lineamientos de usabilidad

La interfaz deberá seguir los siguientes criterios:

- Mantener una navegación principal sencilla y consistente.
- Utilizar nombres claros para identificar los módulos.
- Mostrar los estados de las reservaciones mediante texto, además de indicadores de color.
- Solicitar confirmación antes de cancelar una reserva o ejecutar acciones irreversibles.
- Presentar mensajes claros cuando existan errores de validación.
- Mantener visibles los filtros y las herramientas de búsqueda en las pantallas administrativas.
- Organizar los formularios de reserva en pasos cortos cuando se utilicen dispositivos móviles.

## 6. Diseño adaptable (Responsive Design)

La interfaz deberá adaptarse a diferentes tamaños de pantalla.

### Escritorio
- Aprovechar el espacio disponible para mostrar tablas y paneles.
- Mantener visibles los elementos principales de navegación.
- Facilitar la consulta simultánea de información.

### Dispositivos móviles
- Organizar los formularios en pasos cortos.
- Adaptar los elementos de navegación al espacio disponible.
- Facilitar la interacción con botones y campos de entrada.
- Evitar que las tablas y los formularios requieran desplazamientos horizontales innecesarios cuando sea posible.

## 7. Consideraciones de implementación

- La propuesta visual se implementará utilizando React, JavaScript y CSS.
- Los elementos visuales deberán mantener consistencia entre los diferentes módulos.
- La interfaz deberá respetar los permisos definidos para cada rol.
- Los componentes deberán facilitar su reutilización.
- La presentación de información deberá contemplar estados de carga, ausencia de resultados y errores.
- La integración con el Backend se realizará mediante las APIs REST definidas para el proyecto.

## 8. Alcance del diseño

Este documento representa una propuesta conceptual de interfaz basada en wireframes de baja fidelidad.

No constituye todavía un diseño gráfico definitivo ni una implementación funcional.

Los diseños podrán evolucionar durante el desarrollo, siempre que se mantengan alineados con los requerimientos y las necesidades del proyecto.

## 9. Referencia documental

Documento de Diseño Conceptual — Punto y Sal: Sistema Web de Reservas y Gestión de Mesas.

Versión 4.0 — Ingeniería del Software II, III Período 2026.

Sección 8: Diseño de las pantallas.
