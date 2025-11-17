import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// ✅ Enroll in a course (Learner only)
router.post("/enroll", verifyToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id; // From token

    // Check if already enrolled
    const existing = await prisma.enrollment.findFirst({
      where: { userId, courseId },
    });
    if (existing)
      return res.status(400).json({ message: "Already enrolled in this course" });

    const enrollment = await prisma.enrollment.create({
      data: { userId, courseId },
    });

    res.json({ message: "Enrollment successful", enrollment });
  } catch (error) {
    res.status(500).json({ message: "Error enrolling", error: error.message });
  }
});

// ✅ Get my enrolled courses
router.get("/my-courses", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const courses = await prisma.enrollment.findMany({
      where: { userId },
      include: { course: true },
    });

    res.json({ enrolledCourses: courses.map(e => e.course) });
  } catch (error) {
    res.status(500).json({ message: "Error fetching enrolled courses", error: error.message });
  }
});

export default router;
