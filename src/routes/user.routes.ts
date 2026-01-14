import { Router } from "express";
import * as userCtrl from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { fastVerificationLimiter } from "../middlewares/verificationLimiter.middleware";
import { createUploader } from "../config/multer.config";
import { checkInviteCodeValidation } from "../middlewares/isolateRegistrationForm";

const router = Router();

const upload = createUploader("users_pp");
// public
router.post("/register", checkInviteCodeValidation(), upload.single("image"), userCtrl.register);
router.post("/login", userCtrl.login);
router.post("/verify/token", userCtrl.verifyEmailToken);
router.post("/verify/code", userCtrl.verifyEmailCode);
router.post("/password/request", userCtrl.requestPasswordReset);
router.post("/password/reset", userCtrl.resetPassword);
router.post("/change-password", userCtrl.changePassword);
router.get("/profile/:identifier", authMiddleware(), userCtrl.getProfile);
router.get("/me", authMiddleware(), userCtrl.getMyProfile);
router.post("/logout", authMiddleware(), userCtrl.logout);

// protected user actions
router.post(
  "/request-fast-verification",
  authMiddleware(),
  fastVerificationLimiter,
  userCtrl.requestFastVerification
);

// -----------------------------------------------------
// 🚀 PATCH METHODS: API ENDPOINTS FOR UPDATES
// -----------------------------------------------------
router.patch(
  "/update/image/:id",
  authMiddleware(),
  upload.single("image"),
  userCtrl.updateUserImage
);
router.patch("/update/:id", authMiddleware(), userCtrl.updateUserDetails);

router.patch("/admin/update/:id", authMiddleware(["admin"]), userCtrl.updateUserRole);

export default router;
