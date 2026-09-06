import { redirect } from "next/navigation";

/**
 * El catálogo se fusionó con el panel principal («/alumno»), que ahora
 * muestra todos los cursos de la academia, no solo los matriculados. Esta
 * ruta se conserva para no romper enlaces existentes.
 */
export default function CatalogoRedirect() {
  redirect("/alumno");
}
