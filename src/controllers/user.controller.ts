import { Request, Response } from "express";
import { userUseCase } from "../use-cases/user/user.use-case";
import { CreateUserDto, UpdateUserDto } from "../types/user.types";

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
      message === "phone и password обязательны"
        ? 400
        : message === "Пользователь с таким телефоном уже существует"
          ? 409
          : 500;
    res.status(statusCode).json({ message });
  }
};

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await userUseCase.getAll();
    res.status(200).json(users);
  } catch {
    res.status(500).json({ message: "Ошибка при получении пользователей" });
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
    res.status(statusCode).json({ message });
  }
};
