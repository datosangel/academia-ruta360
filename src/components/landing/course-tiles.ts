/**
 * Áreas de preparación para el ENCAPS–SERUMS que se muestran en las piezas
 * visuales de la landing (marquee, destacados y el rastro del cursor).
 *
 * Las fotos vienen de Unsplash, cuya licencia permite uso comercial gratuito
 * sin atribución obligatoria. Para producción conviene descargarlas y servirlas
 * desde el propio hosting en lugar de enlazar al CDN de Unsplash.
 */
export type CourseTile = {
  title: string;
  category: string;
  /** ID de la foto en Unsplash (parte «photo-...» de la URL). */
  photoId: string;
  alt: string;
};

/** Construye la URL de una foto de Unsplash con el recorte y peso indicados. */
export function unsplashUrl(photoId: string, width: number, height: number) {
  return `https://images.unsplash.com/${photoId}?w=${width}&h=${height}&q=70&auto=format&fit=crop`;
}

export const COURSE_TILES: CourseTile[] = [
  {
    title: "Salud Pública",
    category: "Área común",
    photoId: "photo-1631815590058-860e4f83c1e8",
    alt: "Personal de salud atendiendo a un paciente en la comunidad",
  },
  {
    title: "Gestión de Servicios",
    category: "Área común",
    photoId: "photo-1516841273335-e39b37888115",
    alt: "Equipo médico recorriendo un pasillo de hospital",
  },
  {
    title: "Cuidado Integral",
    category: "Área común",
    photoId: "photo-1584432810601-6c7f27d2362b",
    alt: "Profesional de salud con estetoscopio",
  },
  {
    title: "Investigación",
    category: "Área común",
    photoId: "photo-1731357266501-fc8594f84707",
    alt: "Estudiantes de salud revisando material de estudio",
  },
  {
    title: "Ética e Interculturalidad",
    category: "Área común",
    photoId: "photo-1621353880594-70b5fd44ecb3",
    alt: "Reunión de trabajo comunitario en salud",
  },
  {
    title: "Simulacros ENCAPS",
    category: "Evaluación",
    photoId: "photo-1560361635-9d6b6befc49b",
    alt: "Persona resolviendo un examen escrito",
  },
  {
    title: "Banco de preguntas",
    category: "Práctica",
    photoId: "photo-1547567667-1aa64e6f58dc",
    alt: "Estudiante repasando apuntes",
  },
  {
    title: "Asesoría de adjudicación",
    category: "Acompañamiento",
    photoId: "photo-1666886573553-6548db92db79",
    alt: "Profesional de salud orientando con una tableta",
  },
];
