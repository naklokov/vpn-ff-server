import { env } from "../../config/env";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getTelegramBotUrl(): string {
  return env.telegramBotUrl;
}

export function getEmailFooterText(): string {
  const botUrl = getTelegramBotUrl();
  const lines = ["", "—", `Telegram-бот: ${botUrl}`];

  if (env.uiBaseUrl) {
    lines.push(`Сайт: ${env.uiBaseUrl}`);
  }

  return lines.join("\n");
}

export function getEmailFooterHtml(): string {
  const botUrl = getTelegramBotUrl();
  const siteLine = env.uiBaseUrl
    ? `<br/>Сайт: <a href="${escapeHtml(env.uiBaseUrl)}">${escapeHtml(env.uiBaseUrl)}</a>`
    : "";

  return `<hr style="border:none;border-top:1px solid #ddd;margin:24px 0 12px"/>
<p style="color:#666;font-size:14px;line-height:1.5">
Telegram-бот: <a href="${escapeHtml(botUrl)}">${escapeHtml(botUrl)}</a>${siteLine}
</p>`;
}

export function appendEmailFooter(input: {
  text: string;
  html: string;
}): { text: string; html: string } {
  const footerText = getEmailFooterText();
  const footerHtml = getEmailFooterHtml();

  const text = `${input.text.trimEnd()}${footerText}`;

  let html = input.html;
  const bodyCloseIndex = html.toLowerCase().lastIndexOf("</body>");
  if (bodyCloseIndex >= 0) {
    html = `${html.slice(0, bodyCloseIndex)}${footerHtml}${html.slice(bodyCloseIndex)}`;
  } else {
    html = `${html}${footerHtml}`;
  }

  return { text, html };
}
