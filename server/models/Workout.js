import mongoose from "mongoose";

const WorkoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true, // Assuming category should always be provided
    },
    workoutName: {
      type: String,
      required: true, // Workout name should always be provided
      // Removing 'unique' so users can have the same workout name across different workouts
    },
    sets: {
      type: Number,
      required: true, // Ensuring sets is always required
    },
    reps: {
      type: Number,
      required: true, // Ensuring reps is always required
    },
    weight: {
      type: Number,
      required: true, // Ensuring weight is always required
    },
    duration: {
      type: Number,
      required: true, // Ensuring duration is always required
    },
    caloriesBurned: {
      type: Number,
      required: true, // Ensuring caloriesBurned is always required
    },
    date: {
      type: Date,
      default: Date.now, // Default value as current date/time
    },
  },
  { timestamps: true }
);

export default mongoose.model("Workout", WorkoutSchema);
