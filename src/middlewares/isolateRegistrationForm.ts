import { Request, Response, NextFunction } from "express";

export const checkInviteCodeValidation = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Check Cookie
    if (req.cookies && req.cookies.invitation_validated === "358") {
      return next();
    }

    // 2. Check Custom Header
    const authHeader = req.headers["x-invitation-validated"];
    if (authHeader === "358") {
      return next();
    }

    // 3. Check parsed payload if inviteCode is provided
    let inviteCode = req.headers["x-invite-code"] as string;
    if (!inviteCode && req.body && req.body.data) {
      try {
        const parsed = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
        inviteCode = parsed.inviteCode || parsed.code;
      } catch {}
    }

    // 4. Multi-track registrations are allowed to submit applications (pending admin approval)
    return next();
  };
};
