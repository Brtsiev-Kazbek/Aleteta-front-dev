/**
 * Проверка секретов исполнителя, не трогая очередь.
 *
 * Нужна затем, что секреты Edge Function нельзя прочитать снаружи: ни из
 * панели, ни запросом. Когда маршрутизатор отвечает 401, вопрос «а что там
 * вообще лежит» остаётся без ответа — и человек вписывает ключ второй раз
 * вслепую, тот же самый.
 *
 * Функция отвечает на него, ничего не разглашая: сам ключ наружу не выходит,
 * только его длина, начало на `sk-` и решение маршрутизатора. Этого хватает,
 * чтобы отличить «не задан» от «задан не тот» и от «прилип пробел».
 *
 * Очередь она не трогает и денег не тратит: обращается к служебному адресу
 * `/key`, а не к модели.
 *
 * Выкладка: supabase functions deploy check-key
 * Проверка: откройте /dashboard/settings или позовите из SQL-редактора —
 * порядок описан в docs/START-OCR.md.
 */

/** Секрет без того, что прилипает при вставке: пробелы и кавычки. */
function clean(name: string): string {
  const raw = Deno.env.get(name);
  if (!raw) return "";
  return raw.trim().replace(/^['"]|['"]$/g, "");
}

Deno.serve(async () => {
  const raw = Deno.env.get("LLM_API_KEY") ?? "";
  const key = clean("LLM_API_KEY");
  const base = (clean("LLM_BASE_URL") || "https://routerai.ru/api/v1").replace(/\/+$/, "");

  const report: Record<string, unknown> = {
    ключ: {
      задан: key.length > 0,
      длина: key.length,
      начинается_на_sk: key.startsWith("sk-"),
      были_лишние_знаки: raw !== key,
    },
    адрес: base,
    модель: clean("LLM_MODEL_VISION") || "не задана (берётся из задания)",
  };

  if (!key) {
    report.вывод = "LLM_API_KEY не задан в секретах исполнителя";
    return new Response(JSON.stringify(report, null, 2), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  try {
    const response = await fetch(`${base}/key`, {
      headers: { authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15000),
    });

    const body = await response.text();

    report.ответ_маршрутизатора = {
      код: response.status,
      тело: body.slice(0, 300),
    };

    report.вывод =
      response.status === 200
        ? "ключ принят"
        : response.status === 401
          ? "ключ не принят: неверный, отозванный или мастер-ключ"
          : `маршрутизатор ответил ${response.status}`;
  } catch (caught) {
    report.вывод = `не удалось связаться с маршрутизатором: ${
      caught instanceof Error ? caught.message : String(caught)
    }`;
  }

  return new Response(JSON.stringify(report, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
});
