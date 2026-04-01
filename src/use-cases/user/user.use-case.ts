import { userRepository } from "../../repositories/user.repository";
import { remnawaveClient } from "../../providers/remnawave/remnawave.client";
import { CreateUserDto, UpdateUserDto } from "../../types/user.types";
import { getExpiredDateIso } from "../../utils/date";

export class UserUseCase {
  async getAll() {
    return userRepository.findAll();
  }

  getUserByChatId(chatId: number) {
    return userRepository.findByChatId(chatId);
  }

  getUserByPhone(phone: string) {
    return userRepository.findByPhone(phone);
  }

  getUserByEmail(email: string) {
    return userRepository.findByEmail(email);
  }

  async update(phone: string, input: UpdateUserDto) {
    if (!Object.keys(input).length) {
      throw new Error("Тело запроса пустое");
    }

    // Синхронизация expireAt между Mongo и Remnawave.
    if (input.expiredDate) {
      await remnawaveClient.updateUserByPhone(phone, {
        expireAt: input.expiredDate,
      });
    }

    const updated = await userRepository.updateByPhone(phone, input);
    if (!updated) {
      throw new Error("Пользователь не найден");
    }

    return updated;
  }

  async add(input: CreateUserDto) {
    if (!input.email || !input.password) {
      throw new Error("Email и пароль обязательны");
    }

    const existingPhone = await userRepository.findByPhone(input.phone);
    if (existingPhone) {
      throw new Error("Пользователь с таким телефоном уже существует");
    }

    const existingEmail = await userRepository.findByEmail(input.email);

    if (existingEmail) {
      throw new Error("Пользователь с такой электронной почтой уже существует");
    }
    try {
      await remnawaveClient.addUser({
        username: input.phone,
        chatId: input.chatId,
        description: input.name,
        email: input.email,
        expireAt: input.expiredDate ?? getExpiredDateIso(),
      });
    } catch (error) {
      throw error;
    }
    return userRepository.create(input);
  }
}

export const userUseCase = new UserUseCase();
