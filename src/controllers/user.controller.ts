import { Request, Response } from "express";
import { userUseCase } from "../use-cases/user/user.use-case";
import { CreateUserDto, ExtendUserDto, UpdateUserDto } from "../types/user.types";
import { logger } from "../utils/logger";

const getPhoneErrorStatus = (error: unknown): number => {
  const message = error instanceof Error ? error.message : "";
  if (
    message === "Некорректный формат телефона" ||
    message === "Телефон должен быть мобильным номером РФ"
  ) {
    return 400;
  }
  return 500;
};

export const addUser = async (
  req: Request<unknown, unknown, CreateUserDto>,
  res: Response,
): Promise<void> => {
  try {
    const user = await userUseCase.add(req.body);
    res.status(201).json(user);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Ошибка при добавлении пользователя";

    const statusCode =
      message === "Email и пароль обязательны" ||
      message === "Некорректный формат телефона" ||
      message === "Телефон должен быть мобильным номером РФ"
        ? 400
        : message === "Пользователь с таким username уже существует" ||
            message === "Пользователь с таким телефоном уже существует" ||
            message === "Пользователь с такой электронной почтой уже существует"
          ? 409
          : 500;
    if (statusCode >= 500) {
      logger.error("addUser failed", error, {
        path: "/api/users",
      });
    }
    res.status(statusCode).json({ message });
  }
};

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await userUseCase.getAll();
    res.status(200).json(users);
  } catch (error: unknown) {
    logger.error("getUsers failed", error, {
      path: "/api/users",
    });
    res.status(500).json({ message: "Ошибка при получении пользователей" });
  }
};

export const getUserByChatId = async (
  req: Request<{ chatId: string }>,
  res: Response,
): Promise<void> => {
  try {
    const chatId = Number(req.params.chatId);
    if (!Number.isFinite(chatId)) {
      res.status(400).json({ message: "Некорректный chatId" });
      return;
    }

    const user = await userUseCase.getUserByChatId(chatId);
    if (!user) {
      res.status(404).json({ message: "Пользователь не найден" });
      return;
    }

    res.status(200).json(user);
  } catch (error: unknown) {
    logger.error("getUserByChatId failed", error, {
      path: "/api/users/chat/:chatId",
      chatId: req.params.chatId,
    });
    res.status(500).json({ message: "Ошибка при получении пользователя" });
  }
};

export const getUserByPhone = async (
  req: Request<{ phone: string }>,
  res: Response,
): Promise<void> => {
  try {
    const { phone } = req.params;
    if (!phone) {
      res.status(400).json({ message: "Некорректный phone" });
      return;
    }

    const user = await userUseCase.getUserByPhone(phone);
    if (!user) {
      res.status(404).json({ message: "Пользователь не найден" });
      return;
    }

    res.status(200).json(user);
  } catch (error: unknown) {
    const statusCode = getPhoneErrorStatus(error);
    if (statusCode >= 500) {
      logger.error("getUserByPhone failed", error, {
        path: "/api/users/phone/:phone",
        phone: req.params.phone,
      });
    }
    res
      .status(statusCode)
      .json({
        message:
          statusCode === 400
            ? error instanceof Error
              ? error.message
              : "Некорректный phone"
            : "Ошибка при получении пользователя",
      });
  }
};

export const getUserByEmail = async (
  req: Request<{ email: string }>,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.params;
    if (!email) {
      res.status(400).json({ message: "Некорректный email" });
      return;
    }

    const user = await userUseCase.getUserByEmail(email);
    if (!user) {
      res.status(404).json({ message: "Пользователь не найден" });
      return;
    }

    res.status(200).json(user);
  } catch (error: unknown) {
    logger.error("getUserByEmail failed", error, {
      path: "/api/users/email/:email",
      email: req.params.email,
    });
    res.status(500).json({ message: "Ошибка при получении пользователя" });
  }
};

export const updateUserByPhone = async (
  req: Request<{ phone: string }, unknown, UpdateUserDto>,
  res: Response,
): Promise<void> => {
  try {
    const { phone } = req.params;
    const updatedUser = await userUseCase.update(phone, req.body);
    res.status(200).json(updatedUser);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Ошибка при обновлении пользователя";
    const statusCode =
      message === "Тело запроса пустое"
        ? 400
        : message === "Пользователь не найден"
          ? 404
          : 500;
    if (statusCode >= 500) {
      logger.error("updateUserByPhone failed", error, {
        path: "/api/users/:phone",
        phone: req.params.phone,
      });
    }
    res.status(statusCode).json({ message });
  }
};

export const extendUserByPhone = async (
  req: Request<{ phone: string }, unknown, ExtendUserDto>,
  res: Response,
): Promise<void> => {
  try {
    const { phone } = req.params;
    const updatedUser = await userUseCase.extendByPhone(phone, req.body);
    res.status(200).json(updatedUser);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Ошибка при продлении пользователя";
    const statusCode =
      message === "Некорректное количество месяцев"
        ? 400
        : message === "Пользователь не найден"
          ? 404
          : 500;
    if (statusCode >= 500) {
      logger.error("extendUserByPhone failed", error, {
        path: "/api/users/:phone/extend",
        phone: req.params.phone,
      });
    }
    res.status(statusCode).json({ message });
  }
};
