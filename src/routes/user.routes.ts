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
router.get("/profile/active", userCtrl.getPublicMembers);
router.get("/public/members", userCtrl.getPublicMembers);
router.get("/profile/:identifier", userCtrl.getProfile);
router.get("/me", authMiddleware(), userCtrl.getMyProfile);
router.post("/logout", authMiddleware(), userCtrl.logout);

// Update own profile (any authenticated user)
router.patch("/me", authMiddleware(), userCtrl.updateMyProfile);

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
router.post(
  "/update/image/:id",
  authMiddleware(),
  upload.single("image"),
  userCtrl.updateUserImage
);
router.patch(
  "/update/image",
  authMiddleware(),
  upload.single("image"),
  userCtrl.updateUserImage
);
router.post(
  "/update/image",
  authMiddleware(),
  upload.single("image"),
  userCtrl.updateUserImage
);
router.patch(
  "/me/image",
  authMiddleware(),
  upload.single("image"),
  userCtrl.updateUserImage
);
router.post(
  "/me/image",
  authMiddleware(),
  upload.single("image"),
  userCtrl.updateUserImage
);

const uploadCover = createUploader("users_cover");

router.patch(
  "/update/cover/:id",
  authMiddleware(),
  uploadCover.single("cover"),
  userCtrl.updateUserCover
);
router.post(
  "/update/cover/:id",
  authMiddleware(),
  uploadCover.single("cover"),
  userCtrl.updateUserCover
);
router.patch(
  "/update/cover",
  authMiddleware(),
  uploadCover.single("cover"),
  userCtrl.updateUserCover
);
router.post(
  "/update/cover",
  authMiddleware(),
  uploadCover.single("cover"),
  userCtrl.updateUserCover
);
router.patch(
  "/me/cover",
  authMiddleware(),
  uploadCover.single("cover"),
  userCtrl.updateUserCover
);
router.post(
  "/me/cover",
  authMiddleware(),
  uploadCover.single("cover"),
  userCtrl.updateUserCover
);

router.patch("/update/:id", authMiddleware(), userCtrl.updateUserDetails);

router.patch("/admin/update/:id", authMiddleware(["admin", "moderator", "executive"]), userCtrl.updateUserRole);

router.post("/admin/create-member", authMiddleware(["admin", "moderator", "executive"]), upload.single("image"), userCtrl.adminCreateMember);

export default router;
