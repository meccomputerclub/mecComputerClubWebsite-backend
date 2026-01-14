import { Request, Response, NextFunction } from "express";
export const checkInviteCodeValidation = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.cookies.invitation_validated === "358") {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "No permission to access this form",
    });
  };
};
