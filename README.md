# Sistema de Gestión e Inventario - Tienda Inés

Este repositorio contiene el respaldo técnico de la arquitectura de la base de datos relacional y las expresiones lógicas utilizadas para el desarrollo del software integral multisucursal de la **Tienda Inés** en la plataforma AppSheet.

## Arquitectura de la Base de Datos 
El sistema opera sobre 4 tablas interconectadas mediante llaves primarias y foráneas de referencia (Ref):
* **Usuarios:** Control de accesos por códigos con roles específicos (Administrador, Dueña, Vendedor).
* **Productos:** Almacén central automatizado por sucursales independientes (Golosinas, Bebidas, Abarrotes, Snacks).
* **Ventas:** Registro transaccional en tiempo real que amarra el ID de usuario y el ID de producto.
* **Asistencia:** Registro diario de entradas del personal.

## 💻 Lógica y Fórmulas del Sistema (Código Back-end)
La automatización del negocio y el control de inventario se programó mediante las siguientes expresiones lógicas nativas:

* **Cálculo Automático de Caja:**
  `[Cantidad] * [ID Producto].[Precio de Venta]`

* **Descuento Automatizado de Almacén:**
  Regla física ejecutada mediante la acción nativa: `[Stock Actual] - [Cantidad]` tras la confirmación de la venta en la sucursal correspondiente.

* **Alerta Visual de Inventario Crítico:**
  `IF([Stock Actual] <= [Stock Mínimo], "FALTA STOCK", "OK")`

* **Seguridad y Restricción por Roles:**
  `USERROLE() = [ID Usuario].[Rol]` (Filtro a nivel de fila para ocultar el dinero y los gráficos de las sucursales a los vendedores).
