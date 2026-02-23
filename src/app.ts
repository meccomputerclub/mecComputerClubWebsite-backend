import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes";
import uploadRoutes from "./routes/upload.routes";
import inviteRoutes from "./routes/invite.routes";
import eventRoutes from "./routes/event.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import formRoutes from "./routes/form.routes";
import pageRoutes from "./routes/page.routes";
import cors, { CorsOptions } from "cors";
import globalErrorHandler from "./middlewares/errorMiddleware";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.config";
import path from "path";

dotenv.config();

const app = express();
app.use("/public", express.static(path.join(__dirname, "..", "public")));
const frontendUrl = process.env.FRONTEND_URL;

const allowedOrigins = ["http://localhost:3000/", "http://127.0.0.1:3000/", frontendUrl];

const corsOptions: CorsOptions = {
  origin: (requestOrigin: string | undefined, callback: any) => {
    if (!requestOrigin) return callback(null, true);
    if (allowedOrigins.indexOf(requestOrigin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS policy for origin: ${requestOrigin}`));
    }
  },
  credentials: true,
  methods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// parse before routes
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// serve uploads folder publicly
app.use("/uploads", express.static("uploads"));

// routes
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/invite", inviteRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/page", pageRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the API! Visit /api/docs for documentation.");
});
app.get("/health", (req, res) => res.json({ ok: true }));
app.use(globalErrorHandler);

// health

export default app;
