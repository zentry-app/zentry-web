# Incidente: Morosidad por casa incompleta

Fecha: 2026-03-15
Sistema: Zentry WEB
Pantalla afectada: `dashboard/usuarios`
Impacto: Alto

## Resumen

Se reportó que al marcar una casa como morosa no siempre se actualizaba a todos los usuarios de esa casa, y que al quitar morosidad a veces persistía el estado en algunos residentes.

## Síntomas observados

- La acción por casa funcionaba en algunas pruebas manuales, pero fallaba de forma intermitente.
- El problema era más visible cuando la vista tenía filtros, búsqueda o agrupaciones activas.
- La consola mostraba muchos logs de depuración, lo que hacía más difícil distinguir el flujo real.

## Causa raíz

La acción de morosidad por casa en la web usaba `casa.usuarios`, una lista construida desde los usuarios visibles/filtrados en pantalla, en lugar de consultar Firestore para obtener todos los usuarios reales de la casa.

Eso generaba dos efectos:

1. Si la casa estaba incompleta en la vista actual, solo se actualizaba un subconjunto de usuarios.
2. El switch de casa podía aparentar persistencia de morosidad porque la actualización local y la visualización no siempre representaban el estado completo de la casa.

## Corrección aplicada

Se realizaron cambios en:

- `app/dashboard/usuarios/page.tsx`
- `src/lib/firebase/firestore.ts`

### Ajustes realizados

- La acción por casa ahora usa `cambiarMorosidadPorCasa(...)` contra Firestore en lugar de iterar solo los usuarios visibles en la tabla.
- La resolución de usuarios por casa se reforzó para cubrir:
  - `houseID`
  - `houseId`
  - fallback por `calle + houseNumber`
- La actualización local posterior se hace sobre todos los usuarios cargados que coinciden con la casa, no solo sobre `casa.usuarios`.
- Se removió ruido de logs de depuración para dejar la consola más limpia.

## Validación

Se validó localmente que:

- el build de producción compila correctamente;
- al marcar una casa como morosa se actualizan todos los usuarios encontrados en Firestore;
- al quitar morosidad el cambio se refleja correctamente;
- `npm run lint` pasa sin errores.

## Riesgo residual

- Si existieran datos históricos con identificadores de casa inconsistentes fuera de `houseID`, `houseId`, `calle` y `houseNumber`, podrían requerir normalización de datos.
- La lógica corregida depende de que Firestore tenga datos de casa suficientes para resolver correctamente la agrupación.

## Nota operativa

Durante el intento de despliegue se detectó que la CLI de Vercel estaba autenticada con otro usuario/equipo, por lo que la carpeta `.vercel` local no correspondía al proyecto accesible desde esa sesión.

El despliegue a producción se completó correctamente después de usar la cuenta correcta de Vercel.

## Recomendación

- Mantener este fix versionado en Git con un commit explícito.
- Evitar depender de listas filtradas de UI para acciones masivas críticas.
- Si se vuelve a tocar este flujo, agregar pruebas enfocadas en:
  - casa con múltiples usuarios;
  - mezcla de `houseID` y `houseId`;
  - vista filtrada versus datos completos;
  - marcar y desmarcar morosidad.
