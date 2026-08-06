/**
 * Человеческие формулировки вместо англоязычных сообщений Supabase.
 *
 * Показывать пользователю «Invalid login credentials» — значит перекладывать на
 * него перевод. Сообщения службы аутентификации приходят строками, поэтому
 * разбираем их по подстрокам; неизвестное отдаём как есть, чтобы не потерять
 * подробность при разборе жалобы.
 */
export function describeAuthError(message: string): string {
  const text = message.toLowerCase();

  if (text.includes("invalid login credentials")) {
    return "Неверная почта или пароль.";
  }
  if (text.includes("email not confirmed")) {
    return "Почта не подтверждена — откройте письмо со ссылкой.";
  }
  if (text.includes("user already registered") || text.includes("already been registered")) {
    return "Такой пользователь уже есть. Войдите вместо регистрации.";
  }
  if (text.includes("password should be at least")) {
    return "Пароль слишком короткий.";
  }
  if (text.includes("new password should be different")) {
    return "Новый пароль совпадает со старым.";
  }
  if (text.includes("rate limit") || text.includes("too many") || text.includes("for security purposes")) {
    return "Слишком много попыток. Подождите минуту и повторите.";
  }
  if (text.includes("token has expired") || text.includes("expired")) {
    return "Ссылка устарела. Запросите новую.";
  }
  if (text.includes("invalid token") || text.includes("token not found")) {
    return "Ссылка недействительна. Запросите новую.";
  }
  if (text.includes("email address") && text.includes("invalid")) {
    return "Проверьте адрес: похоже, в нём опечатка.";
  }
  if (text.includes("signups not allowed") || text.includes("signup is disabled")) {
    return "Регистрация закрыта. Обратитесь к администратору.";
  }
  if (text.includes("fetch failed") || text.includes("network")) {
    return "Не удалось связаться с сервером. Проверьте соединение.";
  }

  return message;
}

/** Причины неудачного перехода по ссылке из письма — в понятных словах. */
export function describeCallbackError(code: string): string {
  switch (code) {
    case "missing_code":
      return "Ссылка неполная. Откройте её из письма целиком.";
    case "exchange_failed":
      return "Ссылка устарела или уже использована. Запросите новую.";
    case "access_denied":
      return "Подтверждение отменено.";
    default:
      return "Не удалось подтвердить ссылку. Запросите новую.";
  }
}
