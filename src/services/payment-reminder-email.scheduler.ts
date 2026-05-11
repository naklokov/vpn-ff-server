import dayjs from "dayjs";
import { validate, schedule } from "node-cron";
import { env } from "../config/env";
import {
  brevoMailClient,
  isBrevoConfigured,
} from "../providers/mail/brevo-mail.client";
import { userRepository } from "../repositories/user.repository";
import { logger } from "../utils/logger";
import { normalizeRuPhoneToMsisdn } from "../utils/phone";
import {
  getDaysLeftUntilExpiry,
  shouldSendPaymentReminder,
} from "../utils/payment-reminder-eligibility";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPhoneForEmail(phone: string): string {
  try {
    const msisdn = normalizeRuPhoneToMsisdn(phone);
    const d = msisdn.slice(1);
    return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8)}`;
  } catch {
    const cleaned = String(phone).replace(/\D/g, "");
    return cleaned || String(phone).trim() || "—";
  }
}

function buildPaymentPageUrl(phone: string): string | null {
  if (!env.uiBaseUrl) {
    return null;
  }
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) {
    return null;
  }
  const url = new URL(`${env.uiBaseUrl}/payment`);
  url.searchParams.set("phone", digits);
  return url.toString();
}

function buildReminderEmail(
  expiredDate: string,
  phone: string,
  paymentUrl: string | null,
) {
  const payBy = dayjs(expiredDate).endOf("day").format("DD.MM.YYYY");
  const phoneDisplay = formatPhoneForEmail(phone);
  const subject = "Напоминание: продление подписки VPN FF";

  const text = [
    "Здравствуйте!",
    "",
    "Оплаченный период использования VPN подходит к концу.",
    "Если вы хотите продолжить пользоваться сервисом, внесите оплату.",
    "",
    `Подписка оформлена на номер телефона: ${phoneDisplay}`,
    "",
    `Оплату необходимо произвести до ${payBy}.`,
    "",
    ...(paymentUrl
      ? ["Ссылка на страницу оплаты:", paymentUrl]
      : ["Оплату можно произвести на сайте"]),
    "",
    "С уважением,",
    "команда VPN FF",
  ].join("\n");

  const paymentBlock = paymentUrl
    ? `<p><strong>Ваша ссылка на оплату</strong>
    <br/>
  <a href="${escapeHtml(paymentUrl)}">${escapeHtml(paymentUrl)}</a></p>`
    : `<p>Оплату можно произвести на сайте сервиса или через Telegram-бота.<br/>
  Укажите при оплате номер: <strong>${escapeHtml(phoneDisplay)}</strong></p>`;

  const html = `<!DOCTYPE html><html><body>
  <p>Здравствуйте!</p>
  <p>Оплаченный период использования VPN подходит к концу.</p>
  <p>Если вы хотите продолжить пользоваться сервисом, внесите оплату.</p>
  <br/>
  <p><strong>Подписка оформлена на номер телефона:</strong> ${escapeHtml(phoneDisplay)}</p>
  <p><strong>Оплату необходимо произвести до ${escapeHtml(payBy)} включительно.</strong></p>
  ${paymentBlock}
  <p>С уважением,<br/>команда VPN FF</p>
  </body></html>`;

  return { subject, text, html };
}

async function runPaymentReminderEmailJob(): Promise<void> {
  if (!env.paymentReminderEmailEnabled) {
    return;
  }
  if (!isBrevoConfigured()) {
    logger.warn(
      "Напоминания об оплате по email: пропуск — Brevo не настроен (BREVO_API_KEY / BREVO_SENDER_EMAIL)",
    );
    return;
  }

  const users = await userRepository.findAll();
  let sent = 0;
  let eligible = 0;

  for (const user of users) {
    if (!user.isActive) {
      continue;
    }
    const email = user.email?.trim();
    if (!email || !email.includes("@")) {
      continue;
    }
    if (!shouldSendPaymentReminder(user.expiredDate)) {
      continue;
    }

    eligible += 1;
    const daysLeft = getDaysLeftUntilExpiry(user.expiredDate);
    const paymentUrl = buildPaymentPageUrl(user.phone);

    try {
      const { subject, text, html } = buildReminderEmail(
        user.expiredDate,
        user.phone,
        paymentUrl,
      );
      await brevoMailClient.sendTransactionalEmail({
        to: email,
        subject,
        text,
        html,
      });
      sent += 1;
      logger.info("Отправлено email-напоминание об оплате", {
        to: email,
        phone: user.phone,
        daysLeft,
      });
      await sleep(250);
    } catch (error) {
      logger.error("Не удалось отправить email-напоминание об оплате", error, {
        to: email,
        phone: user.phone,
      });
    }
  }

  logger.info("Завершён проход напоминаний об оплате по email", {
    sent,
    eligible,
    totalUsers: users.length,
  });
}

export function startPaymentReminderEmailScheduler(): void {
  if (!env.paymentReminderEmailEnabled) {
    logger.info(
      "Планировщик email-напоминаний об оплате выключен (PAYMENT_REMINDER_EMAIL_ENABLED=false)",
    );
    return;
  }
  if (!isBrevoConfigured()) {
    logger.warn(
      "Планировщик email-напоминаний об оплате не запущен: не настроен Brevo",
    );
    return;
  }

  const expression = env.paymentReminderEmailCron;
  if (!validate(expression)) {
    logger.error("Некорректное выражение cron для email-напоминаний", {
      expression,
    });
    return;
  }

  schedule(
    expression,
    () => {
      void runPaymentReminderEmailJob();
    },
    {
      timezone: env.paymentReminderEmailTimezone,
      name: "payment-reminder-email",
    },
  );

  logger.info("Запущен планировщик email-напоминаний об оплате", {
    cron: expression,
    timezone: env.paymentReminderEmailTimezone,
  });
}
