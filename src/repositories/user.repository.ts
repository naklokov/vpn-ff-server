import { UserModel, IUser } from "../models/user.model";
import { CreateUserDto, UpdateUserDto } from "../types/user.types";

export class UserRepository {
  async findByChatId(chatId: number): Promise<IUser | null> {
    return UserModel.findOne({ chatId });
  }

  async findByPhone(phone: string): Promise<IUser | null> {
    return UserModel.findOne({ phone });
  }

  async findByPhoneIn(phones: string[]): Promise<IUser | null> {
    return UserModel.findOne({ phone: { $in: phones } });
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email });
  }

  async create(data: CreateUserDto): Promise<IUser> {
    return UserModel.create(data);
  }

  async findAll(): Promise<IUser[]> {
    return UserModel.find({});
  }

  async updateByPhone(
    phone: string,
    data: UpdateUserDto,
  ): Promise<IUser | null> {
    return UserModel.findOneAndUpdate(
      { phone },
      { $set: data },
      { new: true, runValidators: true },
    );
  }

  async updateByPhoneIn(
    phones: string[],
    data: UpdateUserDto,
  ): Promise<IUser | null> {
    return UserModel.findOneAndUpdate(
      { phone: { $in: phones } },
      { $set: data },
      { new: true, runValidators: true },
    );
  }
}

export const userRepository = new UserRepository();
