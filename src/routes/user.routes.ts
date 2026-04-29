import { Router } from "express";
import {
  addUser,
  extendUserByPhone,
  getUserByChatId,
  getUserByEmail,
  getUserByPhone,
  getUsers,
  updateUserByPhone,
} from "../controllers/user.controller";

const userRouter = Router();

userRouter.post("/", addUser);
userRouter.get("/", getUsers);
userRouter.get("/chat/:chatId", getUserByChatId);
userRouter.get("/email/:email", getUserByEmail);
userRouter.get("/phone/:phone", getUserByPhone);
userRouter.patch("/:phone", updateUserByPhone);
userRouter.post("/:phone/extend", extendUserByPhone);

export { userRouter };
