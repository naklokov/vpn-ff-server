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

const parseReceipt = (
  fileBase64: string,
): { buffer: Buffer; mimeFromDataUrl?: string } => {
  const dataUrlMatch = fileBase64.match(/^data:([^;]+);base64,(.*)$/s);
  const mimeFromDataUrl = dataUrlMatch?.[1];
  const body = dataUrlMatch ? dataUrlMatch[2] : fileBase64;
  return { buffer: Buffer.from(body, "base64"), mimeFromDataUrl };
};

const receiptFileName = (
  mime: string,
  originalName?: string,
): string => {
  const safe = originalName?.replace(/[^\w.\-()+\s]/g, "").trim();
  if (safe) {
    return safe.slice(0, 120);
  }
  if (mime === "application/pdf") {
    return "receipt.pdf";
  }
  if (mime === "image/png") {
    return "receipt.png";
  }
  if (mime === "image/webp") {
    return "receipt.webp";
  }
  if (mime === "image/gif") {
    return "receipt.gif";
  }
  return "receipt.jpg";
};

const sendTelegram = async (
  method: string,
  body: FormData | Record<string, unknown>,
): Promise<void> => {
  await axios.post(
    `https://api.telegram.org/bot${env.telegramBotToken}/${method}`,
    body,
    { timeout: 30_000 },
  );
};

export const notifyAdminSitePayment = async (input: {
  phone: string;
  period: number;
  receiptBase64?: string;
  receiptMimeType?: string;
  receiptFileName?: string;
}): Promise<void> => {
  if (!input.receiptBase64) {
    return;
  }
  if (!env.telegramBotToken) {
    logger.warn("Уведомление админу об оплате с сайта не отправлено: BOT_TOKEN не задан");
    return;
  }

  const text =
    "Оплата прошла\n" +
    "Платёж с сайта\n" +
    `\`${input.phone}\` ${input.period} мес`;

  const { buffer, mimeFromDataUrl } = parseReceipt(input.receiptBase64);
  const mime = input.receiptMimeType || mimeFromDataUrl || "application/octet-stream";
  const isPhoto = mime === "image/jpeg" || mime === "image/png";
  const method = isPhoto ? "sendPhoto" : "sendDocument";
  const field = isPhoto ? "photo" : "document";
  const filename = receiptFileName(mime, input.receiptFileName);

  try {
    const form = new FormData();
    form.append("chat_id", String(env.adminChatId));
    form.append(
      field,
      new Blob([new Uint8Array(buffer)], { type: mime }),
      filename,
    );
    await sendTelegram(method, form);
  } catch (error: unknown) {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    logger.warn("Не удалось отправить квитанцию с сайта админу", {
      phone: input.phone,
      status,
    });
  }

  try {
    await sendTelegram("sendMessage", {
      chat_id: env.adminChatId,
      text,
      parse_mode: "MarkdownV2",
    });
  } catch (error: unknown) {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    logger.warn("Не удалось отправить админу текст об оплате с сайта", {
      phone: input.phone,
      status,
    });
  }
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
