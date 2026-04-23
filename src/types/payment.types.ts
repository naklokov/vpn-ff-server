export type CreatePaymentDto = {
  chatId?: number;
  period: number;
  amount: number;
  phone: string;
  date: string;
};

export type UpdatePaymentDto = Partial<CreatePaymentDto>;

export type CheckPaymentDto = {
  amount: number;
  fileBase64: string;
  mimeType?: string;
};

export type CheckPaymentResponseDto = {
  isPayCorrect: boolean;
};
