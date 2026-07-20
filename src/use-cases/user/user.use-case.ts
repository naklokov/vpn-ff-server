import { userRepository } from "../../repositories/user.repository";
import { remnawaveClient } from "../../providers/remnawave/remnawave.client";
import {
  fetchSubscriptionUrlWithRetry,
  sendRegistrationWelcomeEmailFireAndForget,
} from "../../services/registration-welcome-email.service";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import {
  CreateUserDto,
  ExtendUserDto,
  UpdateUserDto,
} from "../../types/user.types";
import { getExpiredDateIso } from "../../utils/date";
import {
  getRuPhoneVariants,
  normalizeRuPhoneToMsisdn,
} from "../../utils/phone";

export class UserUseCase {
  private readonly remnawavePrefix = env.serverPrefix || "REMNAWAVE";

  private isRemnawaveUserNotFoundError(error: unknown): boolean {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      return true;
    }
    const message = (
      (error as { response?: { data?: { message?: unknown } } })?.response?.data
        ?.message ??
      (error as Error)?.message ??
      ""
    )
      .toString()
      .toLowerCase();
    return message.includes("not found") || message.includes("не найден");
  }

  private async syncRemnawaveUserAfterPayment(params: {
    phone: string;
    expireAt: string;
    name?: string;
    email?: string;
    chatId?: number;
    serverPrefix?: string;
  }): Promise<boolean> {
    const { phone, expireAt, name, email, chatId, serverPrefix } = params;
    try {
      await remnawaveClient.updateUserByPhone(phone, { expireAt });
      return false;
    } catch (error) {
      if (!this.isRemnawaveUserNotFoundError(error)) {
        throw error;
      }

      logger.warn(
        "Remnawave user was not found during payment extension. Creating user.",
        {
          phone,
          serverPrefix,
        },
      );

      await remnawaveClient.addUser({
        username: phone,
        chatId: chatId ? String(chatId) : undefined,
        description: name,
        email,
        expireAt,
      });
      return true;
    }
  }

  private getBaseExpiryDate(dateIso?: string): Date {
    const now = new Date();
    const parsed = dateIso ? new Date(dateIso) : null;
    const base =
      parsed && !Number.isNaN(parsed.getTime()) && parsed > now ? parsed : now;
    const endOfDay = new Date(base);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }

  private addMonths(date: Date, months: number): Date {
    const copy = new Date(date);
    copy.setMonth(copy.getMonth() + months);
    return copy;
  }

  private shouldApplyReferralBonus(user: {
    registrationDate?: string;
    expiredDate?: string;
  }): boolean {
    if (!user.registrationDate || !user.expiredDate) {
      return false;
    }
    const registrationDate = new Date(user.registrationDate);
    const expiredDate = new Date(user.expiredDate);
    if (
      Number.isNaN(registrationDate.getTime()) ||
      Number.isNaN(expiredDate.getTime())
    ) {
      return false;
    }
    const threshold = new Date(expiredDate);
    threshold.setMonth(threshold.getMonth() - 1);
    threshold.setDate(threshold.getDate() - 2);
    return registrationDate > threshold;
  }

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

  async extendByPhone(phone: string, input: ExtendUserDto) {
    const months = Number(input.months);
    if (!Number.isInteger(months) || months <= 0) {
      throw new Error("Некорректное количество месяцев");
    }

    const normalizedPhone = normalizeRuPhoneToMsisdn(phone);
    const phoneVariants = getRuPhoneVariants(normalizedPhone);
    const user = await userRepository.findByPhoneIn(phoneVariants);
    if (!user) {
      throw new Error("Пользователь не найден");
    }

    const userNewExpiredDate = this.addMonths(
      this.getBaseExpiryDate(user.expiredDate),
      months,
    ).toISOString();

    await userRepository.updateByPhoneIn(phoneVariants, {
      expiredDate: userNewExpiredDate,
      // После оплаты/продления пользователь снова должен считаться активным в боте (кроны, напоминания).
      isActive: true,
    });

    const remnawaveUserCreated = await this.syncRemnawaveUserAfterPayment({
      phone: normalizedPhone,
      expireAt: userNewExpiredDate,
      name: user.name,
      email: user.email,
      chatId: user.chatId,
      serverPrefix: user.serverPrefix,
    });

    if (user.serverPrefix !== this.remnawavePrefix) {
      await userRepository.updateByPhoneIn(phoneVariants, {
        serverPrefix: this.remnawavePrefix,
      });
    }

    // Referral bonus: only for referrer users on REMNAWAVE.
    if (user.referralUserLogin && this.shouldApplyReferralBonus(user)) {
      const normalizedReferrerPhone = normalizeRuPhoneToMsisdn(
        user.referralUserLogin,
      );
      const referrerVariants = getRuPhoneVariants(normalizedReferrerPhone);
      const referralUser = await userRepository.findByPhoneIn(referrerVariants);
      if (referralUser?.serverPrefix === this.remnawavePrefix) {
        const referrerExpiredDate = this.addMonths(
          this.getBaseExpiryDate(referralUser.expiredDate),
          1,
        ).toISOString();
        await userRepository.updateByPhoneIn(referrerVariants, {
          expiredDate: referrerExpiredDate,
        });
        await remnawaveClient.updateUserByPhone(normalizedReferrerPhone, {
          expireAt: referrerExpiredDate,
        });
      }
    }

    const updated = await userRepository.findByPhoneIn(phoneVariants);
    if (!updated) {
      return updated;
    }
    return {
      ...updated.toObject(),
      remnawaveUserCreated,
    };
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
    const expiredDate = preparedInput.expiredDate ?? getExpiredDateIso();

    // Все проверки до любых побочных эффектов (БД / панель).
    const [existingPhone, existingEmail, existsInPanel] = await Promise.all([
      userRepository.findByPhoneIn(getRuPhoneVariants(normalizedPhone)),
      userRepository.findByEmail(preparedInput.email ?? ""),
      remnawaveClient.existsByUsername(preparedInput.phone),
    ]);

    const conflicts: string[] = [];
    if (existingPhone) {
      conflicts.push("Пользователь с таким телефоном уже существует");
    }
    if (existingEmail) {
      conflicts.push(
        "Пользователь с такой электронной почтой уже существует",
      );
    }
    if (existsInPanel) {
      conflicts.push("Пользователь с таким username уже существует");
    }
    if (conflicts.length) {
      throw new Error(conflicts.join(". "));
    }

    // Сначала панель: если запись в БД упадёт, в Mongo не останется «пустого» пользователя
    // без доступа. Обратный порядок раньше оставлял orphan в БД при ошибке Remnawave.
    await remnawaveClient.addUser({
      username: preparedInput.phone,
      chatId: preparedInput?.chatId?.toString() ?? "",
      description: preparedInput.name,
      email: preparedInput.email,
      expireAt: expiredDate,
    });

    let createdUser;
    try {
      createdUser = await userRepository.create({
        ...preparedInput,
        expiredDate,
      });
    } catch (error) {
      logger.error(
        "Пользователь создан в Remnawave, но не сохранён в БД",
        error,
        { phone: preparedInput.phone, email: preparedInput.email },
      );
      throw new Error(
        "Не удалось сохранить пользователя. Обратитесь в поддержку",
      );
    }

    sendRegistrationWelcomeEmailFireAndForget({
      email: preparedInput.email as string,
      password: preparedInput.password,
      name: preparedInput.name,
      phone: preparedInput.phone,
      expiredDate,
    });

    const subscriptionUrl = await fetchSubscriptionUrlWithRetry(
      preparedInput.phone,
    );
    const userPayload =
      typeof (createdUser as { toObject?: () => unknown }).toObject ===
      "function"
        ? (createdUser as { toObject: () => Record<string, unknown> }).toObject()
        : createdUser;

    return {
      ...userPayload,
      subscriptionUrl,
    };
  }
}

export const userUseCase = new UserUseCase();
