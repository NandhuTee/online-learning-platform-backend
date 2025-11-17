// src/routes/videoRoutes.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// get videos for a course (we check enrollment)
router.get("/:courseId", async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ message: "Course not found" });

    // If free, return videos
    if (course.isFree) {
      const videos = await prisma.video.findMany({ where: { courseId } });
      return res.json({ videos });
    }

    // For paid courses, require a valid JWT (enrolled)
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Auth token required" });

    // verify token via existing middleware logic is simpler:
    // we'll re-use verifyToken by temporarily calling it:
    // but Express middlewares run differently; simpler: require verifyToken before route.
    // For now, if you want middleware:
    res.status(400).json({ message: "Use /api/videos/enrolled/:courseId with token" });
  } catch (err) {
    res.status(500).json({ message: "Error fetching videos", error: err.message });
  }
});

// secure endpoint that checks token + enrollment
router.get("/enrolled/:courseId", verifyToken, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user.id;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ message: "Course not found" });

    // free -> OK
    if (course.isFree) {
      const videos = await prisma.video.findMany({ where: { courseId } });
      return res.json({ videos });
    }

    // check enrollment
    const enrolled = await prisma.enrollment.findFirst({
      where: { courseId, userId },
    });
    if (!enrolled) return res.status(403).json({ message: "Access denied. Enroll or purchase course." });

    const videos = await prisma.video.findMany({ where: { courseId } });
    res.json({ videos });
  } catch (err) {
    res.status(500).json({ message: "Error fetching videos", error: err.message });
  }
});

export default router;
