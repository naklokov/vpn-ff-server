import dayjs from "dayjs";

/**
 * Совпадает с логикой `vpn-ff-telegram-bot/utils/shedulers/paymentNotification.js`:
 * календарные дни от начала «сегодня» до дня окончания подписки.
 */
export function getDaysLeftUntilExpiry(
  expiredDate: string | undefined,
): number | null {
  if (!expiredDate) {
    return null;
  }
  const expiry = dayjs(expiredDate);
  if (!expiry.isValid()) {
    return null;
  }
  const today = dayjs().startOf("day");
  const expiryDay = expiry.startOf("day");
  return expiryDay.diff(today, "day");
}

/** Последние 3 календарных дня включая день окончания: daysLeft 0, 1, 2 */
export function shouldSendPaymentReminder(
  expiredDate: string | undefined,
): boolean {
  const daysLeft = getDaysLeftUntilExpiry(expiredDate);
  if (daysLeft === null) {
    return false;
  }
  return daysLeft >= 0 && daysLeft <= 2;
}
