import monti4 from "@/public/medaglie/Monti 4.png";
import montiWinter3 from "@/public/medaglie/Monti Winter 3.png";

// Static imports give corrected local images a new URL when their content changes.
export function getBadgeImage(badge?: {
  titolo?: string | null;
  immagine_url?: string | null;
} | null): string | undefined {
  const title = badge?.titolo?.trim().replace(/\s+/g, " ").toLowerCase();

  switch (title) {
    case "monti 4":
      return monti4.src;
    case "monti winter 3":
      return montiWinter3.src;
    default:
      return badge?.immagine_url || undefined;
  }
}
