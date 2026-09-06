type LiveClassLike = { scheduledAt: Date };

/**
 * Separa las clases en próximas y pasadas. Se hace en el servidor (donde
 * consultar la hora actual es válido) para no depender de `Date.now()` en un
 * componente de cliente durante el render.
 */
export function splitLiveClasses<T extends LiveClassLike>(classes: T[]) {
  const ahora = Date.now();
  return {
    proximas: classes.filter((c) => c.scheduledAt.getTime() >= ahora),
    pasadas: classes.filter((c) => c.scheduledAt.getTime() < ahora),
  };
}
