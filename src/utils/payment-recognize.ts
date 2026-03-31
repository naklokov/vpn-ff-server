import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";

const MIME_TYPES = {
  PDF: "application/pdf",
};

const checkRegexpAmount = (text: string, amount: number): boolean => {
  const amountRegExp = new RegExp(`(${amount})[\\s|.|,]{1}`);
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

const checkPaymentPdf = async (amount: number, fileBuffer: Buffer): Promise<boolean> => {
  try {
    const text = await getTextFromPdf(fileBuffer);
    return checkRegexpAmount(text, amount);
  } catch {
    return false;
  }
};

const checkPaymentPhoto = async (amount: number, fileBuffer: Buffer): Promise<boolean> => {
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
