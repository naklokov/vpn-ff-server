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
