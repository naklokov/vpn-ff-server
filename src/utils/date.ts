export const getRegistrationDateIso = (): string => new Date().toISOString();

export const getExpiredDateIso = (): string => {
  const date = new Date();
  date.setDate(date.getDay() + 2);
  return date.toISOString();
};
