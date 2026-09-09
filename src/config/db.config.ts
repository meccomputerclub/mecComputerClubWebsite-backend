import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mec_computer_club";

let cachedConnection: typeof mongoose | null = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }
  if (cachedConnection) {
    return cachedConnection;
  }
  try {
    cachedConnection = await mongoose.connect(MONGO_URI);
    console.log("Mongo connected");
    return cachedConnection;
  } catch (err) {
    console.error("Mongo connection failed:", err);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw err;
  }
};
