export const getRegistrationDateIso = (): string => new Date().toISOString();

export const getExpiredDateIso = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString();
};
