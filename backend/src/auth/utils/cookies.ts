export function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((cookies, part) => {
      const separatorIndex = part.indexOf('=');

      if (separatorIndex === -1) {
        return cookies;
      }

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();

      if (!key) {
        return cookies;
      }

      cookies[key] = decodeURIComponent(value);
      return cookies;
    }, {});
}

export function getCookieValue(
  cookieHeader: string | undefined,
  cookieName: string,
): string | undefined {
  return parseCookieHeader(cookieHeader)[cookieName];
}
