// src/routes/courseRoutes.js

import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import multer from "multer";
import { supabase } from "../config/supabaseClient.js";

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

/* ----------------------------------------------------------
   GET ALL COURSES
-----------------------------------------------------------*/
router.get("/", async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: { videos: true },
      orderBy: { createdAt: "desc" }
    });

    const updated = courses.map(c => ({
      ...c,
      thumbnail: c.thumbnail || "/default-course.jpg"
    }));

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error fetching courses", error: err.message });
  }
});

/* ----------------------------------------------------------
   GET COURSE BY ID
-----------------------------------------------------------*/
router.get("/:id", async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: { videos: true }
    });

    if (!course) return res.status(404).json({ message: "Course not found" });

    course.thumbnail = course.thumbnail || "/default-course.jpg";

    res.json(course);
  } catch (err) {
    res.status(500).json({ message: "Error fetching course", error: err.message });
  }
});

/* ----------------------------------------------------------
   CREATE COURSE + OPTIONAL VIDEO
-----------------------------------------------------------*/
router.post(
  "/create",
  verifyToken,
  verifyAdmin,
  upload.single("video"),
  async (req, res) => {
    try {
      const { title, description, isFree, price } = req.body;
      const file = req.file;

      if (!title || !description) {
        return res.status(400).json({ message: "Title and description required" });
      }

      // Normalize boolean
      const free = isFree === "true" || isFree === true;

      const course = await prisma.course.create({
        data: {
          title,
          description,
          isFree: free,
          price: free ? null : Number(price),
          thumbnail: "/default-course.jpg"
        }
      });

      let videoData = null;

      if (file) {
        const fileName = `videos/${Date.now()}_${file.originalname}`;

        const { error } = await supabase.storage
          .from("course-videos")
          .upload(fileName, file.buffer, { contentType: file.mimetype });

        if (error) throw error;

        const { data } = supabase.storage
          .from("course-videos")
          .getPublicUrl(fileName);

        videoData = await prisma.video.create({
          data: {
            title,
            videoUrl: data.publicUrl,
            courseId: course.id
          }
        });
      }

      res.status(201).json({
        message: "Course created successfully",
        course,
        video: videoData
      });

    } catch (error) {
      console.error("❌ Error creating course:", error);
      res.status(500).json({ message: "Error creating course", error: error.message });
    }
  }
);

export default router;
