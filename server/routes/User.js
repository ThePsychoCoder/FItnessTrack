import express from "express";
import {
  UserLogin,
  UserRegister,
  addWorkout,
  getUserDashboard,
  getWorkoutsByDate, // Corrected the import for workouts
} from "../controllers/User.js";
import { verifyToken } from "../middleware/verifyToken.js"; // Correctly import the middleware

const router = express.Router();

router.post("/signup", UserRegister); // User registration route
router.post("/signin", UserLogin); // User login route

// Protecting these routes with the `verifyToken` middleware
router.get("/dashboard", verifyToken, getUserDashboard); // Dashboard route
router.get("/workout", verifyToken, getWorkoutsByDate); // Fetch workouts by date route
router.post("/workout", verifyToken, addWorkout); // Add workout route

export default router;
