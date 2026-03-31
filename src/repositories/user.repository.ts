import { UserModel, IUser } from "../models/user.model";
import { CreateUserDto, UpdateUserDto } from "../types/user.types";

export class UserRepository {
  async findByPhone(phone: string): Promise<IUser | null> {
    return UserModel.findOne({ phone });
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
}

export const userRepository = new UserRepository();
