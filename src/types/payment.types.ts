export type CreatePaymentDto = {
  chatId?: number;
  period: number;
  amount: number;
  phone: string;
  date: string;
  /** Квитанция с сайта: только для уведомления админа, в БД не сохраняется. */
  receiptBase64?: string;
  receiptMimeType?: string;
  receiptFileName?: string;
};

export type UpdatePaymentDto = Partial<CreatePaymentDto>;

export type CheckPaymentDto = {
  amount: number;
  fileBase64: string;
  mimeType?: string;
};

export type CheckPaymentResponseDto = {
  result: boolean;
};

export type CreatePaymentResponseDto = {
  _id: string;
  chatId?: number;
  period: number;
  amount: number;
  phone: string;
  date: string;
  isMigratedToRemnawave?: boolean;
  subscriptionUrl?: string | null;
};
