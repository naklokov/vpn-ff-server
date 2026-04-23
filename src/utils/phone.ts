export function normalizeRuPhoneToMsisdn(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  let normalized: string;
  if (digits.length === 10) {
    normalized = `7${digits}`;
  } else if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    normalized = digits.startsWith("8") ? `7${digits.slice(1)}` : digits;
  } else {
    throw new Error("Некорректный формат телефона");
  }

  if (!/^79\d{9}$/.test(normalized)) {
    throw new Error("Телефон должен быть мобильным номером РФ");
  }

  return normalized;
}

export function getRuPhoneVariants(msisdn: string): string[] {
  return [msisdn, `+${msisdn}`, `8${msisdn.slice(1)}`];
}
