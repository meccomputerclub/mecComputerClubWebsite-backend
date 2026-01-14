import app from "./app";
import { connectDB } from "./config/db.config";
import dotenv from "dotenv";
dotenv.config();

const PORT = Number(process.env.PORT || 4000);

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
