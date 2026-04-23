import { userRepository } from "../../repositories/user.repository";
import { remnawaveClient } from "../../providers/remnawave/remnawave.client";
import { CreateUserDto, UpdateUserDto } from "../../types/user.types";
import { getExpiredDateIso } from "../../utils/date";
import {
  getRuPhoneVariants,
  normalizeRuPhoneToMsisdn,
} from "../../utils/phone";

export class UserUseCase {
  async getAll() {
    return userRepository.findAll();
  }

  getUserByChatId(chatId: number) {
    return userRepository.findByChatId(chatId);
  }

  getUserByPhone(phone: string) {
    const normalizedPhone = normalizeRuPhoneToMsisdn(phone);
    return userRepository.findByPhoneIn(getRuPhoneVariants(normalizedPhone));
  }

  getUserByEmail(email: string) {
    return userRepository.findByEmail(email);
  }

  async update(phone: string, input: UpdateUserDto) {
    if (!Object.keys(input).length) {
      throw new Error("Тело запроса пустое");
    }

    const normalizedCurrentPhone = normalizeRuPhoneToMsisdn(phone);
    const normalizedInputPhone = input.phone
      ? normalizeRuPhoneToMsisdn(input.phone)
      : undefined;
    const preparedInput: UpdateUserDto = normalizedInputPhone
      ? { ...input, phone: normalizedInputPhone }
      : input;

    // Синхронизация expireAt между Mongo и Remnawave.
    if (input.expiredDate) {
      await remnawaveClient.updateUserByPhone(normalizedCurrentPhone, {
        expireAt: input.expiredDate,
      });
    }

    const updated = await userRepository.updateByPhoneIn(
      getRuPhoneVariants(normalizedCurrentPhone),
      preparedInput,
    );
    if (!updated) {
      throw new Error("Пользователь не найден");
    }

    return updated;
  }

  async add(input: CreateUserDto) {
    if (!input.email || !input.password) {
      throw new Error("Email и пароль обязательны");
    }

    const normalizedPhone = normalizeRuPhoneToMsisdn(input.phone);
    const normalizedReferralUserLogin = input.referralUserLogin
      ? normalizeRuPhoneToMsisdn(input.referralUserLogin)
      : undefined;
    const preparedInput: CreateUserDto = {
      ...input,
      phone: normalizedPhone,
      ...(normalizedReferralUserLogin
        ? { referralUserLogin: normalizedReferralUserLogin }
        : {}),
    };

    const existingPhone = await userRepository.findByPhoneIn(
      getRuPhoneVariants(normalizedPhone),
    );
    if (existingPhone) {
      throw new Error("Пользователь с таким телефоном уже существует");
    }

    const existingEmail = await userRepository.findByEmail(
      preparedInput?.email ?? "",
    );

    if (existingEmail) {
      throw new Error("Пользователь с такой электронной почтой уже существует");
    }

    const createdUser = await userRepository.create(preparedInput);

    try {
      await remnawaveClient.addUser({
        username: preparedInput.phone,
        chatId: preparedInput?.chatId?.toString() ?? "",
        description: preparedInput.name,
        email: preparedInput.email,
        expireAt: preparedInput.expiredDate ?? getExpiredDateIso(),
      });
    } catch (error) {
      throw error;
    }
    return createdUser;
  }
}

export const userUseCase = new UserUseCase();
