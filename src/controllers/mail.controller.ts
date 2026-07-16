import { Request, Response } from "express";
import {
  brevoMailClient,
  isBrevoConfigured,
} from "../providers/mail/brevo-mail.client";
import { logger } from "../utils/logger";

const EMAIL_REGEXP =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;

const DEFAULT_SUBJECT = "Сообщение от VPN FF";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textToHtml(text: string): string {
  const paragraphs = escapeHtml(text)
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return `<!DOCTYPE html><html><body>${paragraphs}</body></html>`;
}

type SendMailBody = {
  to?: string;
  subject?: string;
  text?: string;
};

export const sendMail = async (
  req: Request<unknown, unknown, SendMailBody>,
  res: Response,
): Promise<void> => {
  try {
    if (!isBrevoConfigured()) {
      res.status(503).json({
        message: "Почтовый сервис не настроен (Brevo)",
      });
      return;
    }

    const to = req.body.to?.trim().toLowerCase() ?? "";
    const text = req.body.text?.trim() ?? "";
    const subject = req.body.subject?.trim() || DEFAULT_SUBJECT;

    if (!to || !EMAIL_REGEXP.test(to)) {
      res.status(400).json({ message: "Некорректный email получателя" });
      return;
    }

    if (!text) {
      res.status(400).json({ message: "Текст письма не может быть пустым" });
      return;
    }

    await brevoMailClient.sendTransactionalEmail({
      to,
      subject,
      text,
      html: textToHtml(text),
    });

    res.status(200).json({ ok: true });
  } catch (error: unknown) {
    logger.error("sendMail failed", error, { path: "/api/mail/send" });
    const message =
      error instanceof Error ? error.message : "Ошибка при отправке письма";
    const isAuthError = /unrecognised IP|unauthorized|api.?key/i.test(message);
    res.status(isAuthError ? 502 : 500).json({ message });
  }
};

