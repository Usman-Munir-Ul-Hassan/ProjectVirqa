import { Router } from "express";
import { registerHandler, LoginHandler,forgetPassword,logoutHandler, verifyOTP, resetPassword, getProfile } from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/authMiddleware.js";

const router = Router();

router.post('/register', registerHandler);
router.post('/login', LoginHandler);
router.post("/logout",verifyJwt,logoutHandler)
router.post("/forget-password",forgetPassword)
router.post("/verify-otp", verifyOTP)
router.post("/reset-password", resetPassword)
router.get("/profile", verifyJwt, getProfile)

export default router;