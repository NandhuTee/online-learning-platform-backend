import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import route files
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Define __filename and __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files (favicon, images, etc.)
app.use(express.static(path.join(__dirname, "public")));

// 🧩 Middleware
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      /^https:\/\/.*\.vercel\.app$/  // Allow all Vercel deployments
    ];
    
    if (!origin || allowedOrigins.some(allowed => 
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// 🔍 Request logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 🧪 Diagnostic endpoint
app.get("/api/health", async (req, res) => {
  try {
    // Test database connection
    await prisma.$connect();
    const userCount = await prisma.user.count();
    
    res.json({
      status: "✅ OK",
      database: "✅ Connected",
      prisma: "✅ Working",
      userCount: userCount,
      timestamp: new Date().toISOString(),
      env: {
        NODE_ENV: process.env.NODE_ENV || "development",
        DATABASE_URL: process.env.DATABASE_URL ? "✅ Set" : "❌ Missing",
        JWT_SECRET: process.env.JWT_SECRET ? "✅ Set" : "❌ Missing",
      }
    });
  } catch (error) {
    console.error("❌ Health check failed:", error);
    res.status(500).json({
      status: "❌ ERROR",
      error: error.message,
      details: error.name
    });
  }
});

// 🧪 Test user creation endpoint
app.post("/api/test/create-user", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const bcrypt = await import("bcryptjs");
    
    const hashedPassword = await bcrypt.default.hash(password || "test123", 10);
    
    const user = await prisma.user.create({
      data: {
        email: email || "test@example.com",
        password: hashedPassword,
        name: name || "Test User",
        role: "student"
      }
    });
    
    res.json({ 
      message: "✅ Test user created", 
      user: { id: user.id, email: user.email, name: user.name } 
    });
  } catch (error) {
    console.error("❌ Create user error:", error);
    res.status(500).json({ 
      error: error.message,
      code: error.code 
    });
  }
});

// 🌐 Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/payments", paymentRoutes);

// 🧠 Test API
app.get("/", (req, res) => {
  res.send("🚀 Online Learning Backend is running successfully!");
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Test database connection on startup
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
    
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});