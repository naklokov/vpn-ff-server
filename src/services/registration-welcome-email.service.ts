import { env } from "../config/env";
import {
  brevoMailClient,
  isBrevoConfigured,
} from "../providers/mail/brevo-mail.client";
import { remnawaveClient } from "../providers/remnawave/remnawave.client";
import { userRepository } from "../repositories/user.repository";
import { logger } from "../utils/logger";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function fetchSubscriptionUrlWithRetry(
  phone: string,
  attempts = 4,
  delayMs = 750,
): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    const url = await remnawaveClient.getSubscriptionUrlByUsername(phone);
    if (url) {
      return url;
    }
    if (i < attempts - 1) {
      await sleep(delayMs);
    }
  }
  return null;
}

function buildWelcomeEmail(params: {
  name?: string;
  email: string;
  password: string;
  phone: string;
  expiredDate: string;
  subscriptionUrl: string | null;
  shouldAddBindEmailInstruction: boolean;
}) {
  const greetingName = params.name?.trim() || "пользователь";
  const subject = "Успешная регистрация в сервисе VPN FF";

  const loginLines: string[] = [
    "Ваши данные",
    `Email для входа: ${params.email}`,
    `Пароль для входа: ${params.email}`,
  ];
  if (env.uiBaseUrl) {
    loginLines.push(`Страница входа: ${env.uiBaseUrl}/login`);
  }

  const subscriptionLines: string[] = [];
  if (params.subscriptionUrl) {
    subscriptionLines.push(
      "Ссылка на подписку (импортируйте её в приложение-клиент VPN, например v2rayN, Streisand, Happ и т.п.):",
      params.subscriptionUrl,
    );
  } else {
    subscriptionLines.push(
      "Ссылку на подписку можно получить в личном кабинете после входа (если она там отображается) или через поддержку.",
    );
  }

  const instructionLines: string[] = [];
  if (env.vpnInstructionsUrl) {
    instructionLines.push(
      "Инструкции по настройке на разных устройствах:",
      env.vpnInstructionsUrl,
    );
  }

  const text = [
    `Здравствуйте, уважаемый ${greetingName}!`,
    "",
    "Регистрация прошла успешно. Ниже данные для работы с сервисом.",
    "",
    ...loginLines,
    "",
    ...subscriptionLines,
    "",
    `Дата окончания текущего периода подписки: ${params.expiredDate}`,
    "",
    ...instructionLines,
    ...(params.shouldAddBindEmailInstruction
      ? [
          "",
          "После настройки VPN перейдите в бота https://t.me/friendly_vpn_ff_bot и выберите там пункт «Привязать email к боту», затем введите email, с которым вы регистрировались. Бот может принимать оплату и уведомлять вас о необходимости оплаты.",
        ]
      : []),
    "",
    "С уважением,",
    "команда сервиса",
  ]
    .filter((line) => line !== "")
    .join("\n");

  const loginHtml = [
    "<p>Ваши данные</p>",
    `<p><strong>Email:</strong> ${escapeHtml(params.email)}</p>`,
    `<p><strong>Пароль:</strong> ${escapeHtml(params.password)}</p>`,
  ];
  if (env.uiBaseUrl) {
    const loginUrl = `${env.uiBaseUrl}/login`;
    loginHtml.push(
      `<p><a href="${escapeHtml(loginUrl)}">Открыть страницу входа</a></p>`,
    );
  }

  let subscriptionHtml = "";
  if (params.subscriptionUrl) {
    subscriptionHtml = `<p>
    <strong>Ссылка с вашей уникальной подпиской</strong></p>
    <p><a href="${escapeHtml(params.subscriptionUrl)}">${escapeHtml(params.subscriptionUrl)}</a></p>
    <p>Вам доступен бесплатный период использования VPN - 3 дня`;
  } else {
    subscriptionHtml =
      "<p>Ссылку на подписку можно получить в личном кабинете после входа или через поддержку.</p>";
  }

  const instructionsHtml = `<p><strong>Инструкция по настройке VPN</strong>
    <ol>
      <li>Перейдите по ссылке с вашей уникальной подпиской: ${escapeHtml(params?.subscriptionUrl ?? "")}</li>
      <li>По ссылке скачайте и установите приложение для использования VPN</li>
      <li>После скачивания приложения ещё раз откройте ссылку с вашей уникальной подпиской и нажмите там кнопку «+ Добавить подписку»</li>
      <li>Выберите в приложении любой сервер из списка и нажмите кнопку «Подключиться»</li>
      <li>Готово, ВПН подключен и работает!</li>
    </ol></p>`;

  const bindEmailInstructionHtml = params.shouldAddBindEmailInstruction
    ? `<br/><p>После настройки VPN перейдите в бота <a href="https://t.me/friendly_vpn_ff_bot">https://t.me/friendly_vpn_ff_bot</a> и выберите там пункт «Привязать email к боту», затем введите email, с которым вы регистрировались. Бот может принимать оплату и уведомлять вас о необходимости оплаты.</p>`
    : "";

  const html = `<!DOCTYPE html><html><body>
  <p>Здравствуйте, ${escapeHtml(greetingName)}!</p>
  <p>Регистрация прошла успешно.</p>
  <br/>
  ${loginHtml.join("\n")}
  <br/>
  ${subscriptionHtml}
  <br/>
  ${instructionsHtml}
  ${bindEmailInstructionHtml}
  <br/>
  <p>С уважением,<br/>команда сервиса VPN-FF</p>
  <p>tg: https://t.me/friendly_vpn_ff_bot</p>
  </body></html>`;

  return { subject, text, html };
}

/**
 * Отправляет письмо в фоне; ошибки только в лог, не бросает наружу.
 */
export function sendRegistrationWelcomeEmailFireAndForget(params: {
  email: string;
  name?: string;
  phone: string;
  password: string;
  expiredDate: string;
}): void {
  if (!isBrevoConfigured()) {
    logger.warn(
      "Письмо после регистрации не отправлено: не заданы BREVO_API_KEY и/или BREVO_SENDER_EMAIL",
    );
    return;
  }

  void (async () => {
    try {
      const subscriptionUrl = await fetchSubscriptionUrlWithRetry(params.phone);
      const dbUser = await userRepository.findByEmail(params.email);
      const { subject, text, html } = buildWelcomeEmail({
        name: params.name,
        email: params.email,
        password: params.password,
        phone: params.phone,
        expiredDate: params.expiredDate,
        subscriptionUrl,
        shouldAddBindEmailInstruction: !dbUser?.chatId,
      });
      await brevoMailClient.sendTransactionalEmail({
        to: params.email,
        subject,
        text,
        html,
      });
      logger.info("Отправлено приветственное письмо после регистрации", {
        to: params.email,
      });
    } catch (error) {
      logger.error(
        "Не удалось отправить приветственное письмо после регистрации",
        error,
        { to: params.email },
      );
    }
  })();
}
