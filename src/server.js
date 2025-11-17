import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url"; // ✅ ADD THIS LINE

// Import route files
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";


dotenv.config();

const app = express();
const prisma = new PrismaClient();

// ✅ Define __filename and __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve static files (favicon, images, etc.)
app.use(express.static(path.join(__dirname, "public")));

// 🧩 Middleware
app.use(cors());
app.use(express.json());

// 🌐 Routes
app.use("/api/auth", authRoutes);       // Authentication
app.use("/api/courses", courseRoutes);  // Course CRUD
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/payments", paymentRoutes);

// 🧠 Test API
app.get("/", (req, res) => {
  res.send("🚀 Online Learning Backend is running successfully!");
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
