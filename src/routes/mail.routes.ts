import { Router } from "express";
import { sendMail } from "../controllers/mail.controller";

const mailRouter = Router();

mailRouter.post("/send", sendMail);

export { mailRouter };
