export type CreateUserDto = {
  chatId?: number;
  name?: string;
  email?: string;
  phone: string;
  password: string;
  referralUserLogin?: string;
  serverPrefix?: string;
  isActive?: boolean;
  isVless?: boolean;
  expiredDate?: string;
};

export type UpdateUserDto = Partial<CreateUserDto>;
