import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import { logger } from "./logger";

const MIME_TYPES = {
  PDF: "application/pdf",
};

const escapeRegex = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const amountFormatRu = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Сумма в чеках часто пишется с разделителем тысяч: «1 300», «1\u202f300».
 * Группировка берётся из {@link Intl.NumberFormat} (локаль ru-RU), затем любые пробелы
 * в шаблоне заменяются на «ноль или больше» пробельных символов — так совпадают и «1300», и «1 300».
 */
const buildAmountPattern = (amount: number): string => {
  const n = Math.trunc(Math.abs(amount));
  const formatted = amountFormatRu.format(n);
  return escapeRegex(formatted).replace(/\s+/g, "[\\s\\u00a0\\u202f]*");
};

const checkRegexpAmount = (text: string, amount: number): boolean => {
  const inner = buildAmountPattern(amount);
  const amountRegExp = new RegExp(`(${inner})[\\s|.,]{1}`);
  return amountRegExp.test(text);
};

const parseBase64 = (fileBase64: string): Buffer => {
  const base64Body = fileBase64.includes(",")
    ? fileBase64.slice(fileBase64.indexOf(",") + 1)
    : fileBase64;

  return Buffer.from(base64Body, "base64");
};

const getTextFromPdf = async (fileBuffer: Buffer): Promise<string> => {
  const pdfData = new Uint8Array(fileBuffer);
  const doc = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const page = await doc.getPage(1);
  const content = await page.getTextContent();
  return content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
};

const checkPaymentPdf = async (
  amount: number,
  fileBuffer: Buffer,
): Promise<boolean> => {
  try {
    const text = await getTextFromPdf(fileBuffer);
    return checkRegexpAmount(text, amount);
  } catch (error) {
    logger.error("checkPaymentPdf failed", error, { amount });
    return false;
  }
};

const checkPaymentPhoto = async (
  amount: number,
  fileBuffer: Buffer,
): Promise<boolean> => {
  try {
    const recognizedRus = await Tesseract.recognize(fileBuffer, "rus");
    return checkRegexpAmount(recognizedRus?.data?.text ?? "", amount);
  } catch {
    return false;
  }
};

export const checkPaymentByFile = async (
  amount: number,
  fileBase64: string,
  mimeType?: string,
): Promise<boolean> => {
  const fileBuffer = parseBase64(fileBase64);
  if (mimeType === MIME_TYPES.PDF) {
    return checkPaymentPdf(amount, fileBuffer);
  }

  return checkPaymentPhoto(amount, fileBuffer);
};
