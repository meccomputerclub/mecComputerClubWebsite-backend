import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import UserModel from "../models/User.model";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const authMiddleware = (roles?: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token1 = req.cookies.auth_token;
    console.log("Token from cookie-parser:", token1);
    const authHeader = req.headers.cookie?.split("auth_token=")[1];
    console.log("auth_token: ", authHeader);
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
    const token = authHeader.split(" ")[0].replace(/;/, "");
    console.log("token: ", token);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      //crosscheck with database for role
      const user = await UserModel.findById(payload.id).select("role");
      if (!user) return res.status(404).json({ message: "User does not exist" });
      if (user.role !== payload.role) {
        (req as any).user = { id: payload.id, role: user.role };
        res.clearCookie("auth_token");
        res.clearCookie("role");
        const token = jwt.sign({ id: payload.id, role: user.role }, JWT_SECRET, {
          expiresIn: "7d",
        });
        res.cookie("auth_token", token, {
          maxAge: 7 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          secure: true,
          sameSite: "none",
        });
        res.cookie("role", user.role, {
          maxAge: 7 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          secure: true,
          sameSite: "none",
        });
      } else {
        (req as any).user = { id: payload.id, role: payload.role };
      }
      if (roles && roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    } catch (err) {
      console.log("error: ", err);
      return res.status(401).json({ message: "Invalid token" });
    }
  };
};
