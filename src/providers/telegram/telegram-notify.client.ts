import axios, { isAxiosError } from "axios";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";

const formatBonusDays = (days: number): string => {
  const mod10 = days % 10;
  const mod100 = days % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return "бонусный день";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "бонусных дня";
  }
  return "бонусных дней";
};

const formatFriendPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  return digits ? `+${digits}` : phone;
};

export const notifyReferralBonus = async (input: {
  chatId?: number;
  days: number;
  friendPhone: string;
}): Promise<void> => {
  if (!env.telegramBotToken) {
    logger.warn("Уведомление о реферальном бонусе не отправлено: BOT_TOKEN не задан");
    return;
  }
  if (!input.chatId) {
    logger.warn("Уведомление о реферальном бонусе не отправлено: у пригласившего нет chatId", {
      friendPhone: input.friendPhone,
    });
    return;
  }

  const text =
    `🎁 Вам начислено ${input.days} ${formatBonusDays(input.days)} ` +
    `за оплату приглашённого друга ${formatFriendPhone(input.friendPhone)}.`;

  try {
    await axios.post(
      `https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`,
      {
        chat_id: input.chatId,
        text,
      },
      { timeout: 10_000 },
    );
  } catch (error: unknown) {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    logger.warn("Не удалось отправить уведомление о реферальном бонусе", {
      chatId: input.chatId,
      status,
    });
  }
};
