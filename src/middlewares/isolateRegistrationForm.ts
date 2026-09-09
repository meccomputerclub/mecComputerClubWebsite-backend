import { Request, Response, NextFunction } from "express";

export const checkInviteCodeValidation = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Check Header
    const inviteCodeHeader = (req.headers["x-invite-code"] as string || "").trim();

    // 2. Check Cookie
    const cookieInviteCode = (req.cookies?.invitation_code as string || "").trim();
    const cookieValidated = req.cookies?.invitation_validated;

    if (!inviteCodeHeader && !cookieInviteCode && !cookieValidated) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden. A valid invitation clearance key is required to register.",
      });
    }

    return next();
  };
};
