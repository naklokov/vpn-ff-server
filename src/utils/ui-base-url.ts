const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

/**
 * Один базовый URL веб-UI (без завершающего слэша).
 * Поддерживает старый формат, когда в env было полностью `…/register`.
 */
export function normalizeUiBaseUrl(raw: string | undefined | null): string {
  if (!raw?.trim()) {
    return "";
  }
  let s = trimTrailingSlash(raw.trim());
  s = s.replace(/\/register\/?$/i, "");
  s = trimTrailingSlash(s);
  return s;
}
