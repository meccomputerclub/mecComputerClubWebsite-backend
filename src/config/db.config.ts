import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mec_computer_club";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Mongo connected");
  } catch (err) {
    console.error("Mongo connection failed:", err);
    process.exit(1);
  }
};
