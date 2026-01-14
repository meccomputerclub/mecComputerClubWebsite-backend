import { Request, Response, NextFunction } from "express";
import User from "../models/User.model";

export const fastVerificationLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    const last = user.lastFastVerificationRequest;
    // if last request not today -> reset count
    if (!last || last.toDateString() !== now.toDateString()) {
      user.requestedFastVerificationCount = 0;
    }

    if (user.requestedFastVerificationCount >= 2) {
      return res
        .status(429)
        .json({ message: "Maximum fast verification requests reached for today" });
    }

    if (last) {
      const diff = now.getTime() - last.getTime();
      if (diff < 30 * 60 * 1000) {
        return res
          .status(429)
          .json({ message: "Wait 30 minutes between fast verification requests" });
      }
    }
    // allow and controller will increment/save
    next();
  } catch (err: any) {
    next(err);
  }
};
