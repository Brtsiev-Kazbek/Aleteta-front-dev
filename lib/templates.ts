import { FREEFORM_TEMPLATES } from "@/data/mock-data";
import type { TemplateMatch } from "@/types";

/**
 * Ищет готовую форму под свободный запрос. Совпадения нет — это не ошибка:
 * документ в таком случае составляется с нуля, и пользователю об этом
 * сообщается прямо.
 */
export function matchFreeformTemplate(prompt: string): TemplateMatch {
  const lower = prompt.toLowerCase();
  const found = FREEFORM_TEMPLATES.find((template) =>
    template.keywords.some((keyword) => lower.includes(keyword))
  );

  return found ? { found: true, name: found.name } : { found: false, name: "" };
}
