import { Router } from "express";
import {
  loginController,
  registerController,
  googleLoginController,
  microsoftLoginController,
} from "../controllers/auth.controller";

const authRoutes = Router();

authRoutes.post("/register", registerController);
authRoutes.post("/login", loginController);
authRoutes.post("/google", googleLoginController);
authRoutes.post("/microsoft", microsoftLoginController);

export default authRoutes;
