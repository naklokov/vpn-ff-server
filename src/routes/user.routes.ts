import { Router } from "express";
import {
  addUser,
  getUsers,
  updateUserByPhone,
} from "../controllers/user.controller";

const userRouter = Router();

userRouter.post("/", addUser);
userRouter.get("/", getUsers);
userRouter.patch("/:phone", updateUserByPhone);

export { userRouter };
