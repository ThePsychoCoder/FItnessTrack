import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createError } from "../error.js";
import User from "../models/User.js";
import Workout from "../models/Workout.js";

dotenv.config();

export const UserRegister = async (req, res, next) => {
  try {
    const { email, password, name, img } = req.body;

    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      return next(createError(409, "Email is already in use."));
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const user = new User({ name, email, password: hashedPassword, img });
    const createdUser = await user.save();

    const token = jwt.sign({ id: createdUser._id }, process.env.JWT_SECRET, {
      expiresIn: "9999 years",
    });

    return res.status(200).json({ token, user });
  } catch (error) {
    return next(error);
  }
};

export const UserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return next(createError(404, "User not found"));

    const isPasswordCorrect = bcrypt.compareSync(password, user.password);
    if (!isPasswordCorrect) return next(createError(403, "Incorrect password"));

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "9999 years",
    });

    return res.status(200).json({ token, user });
  } catch (error) {
    return next(error);
  }
};

export const getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) return next(createError(404, "User not found"));

    const today = new Date();
    const startToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    const totalCaloriesBurnt = await Workout.aggregate([
      { $match: { user: user._id, date: { $gte: startToday, $lt: endToday } } },
      {
        $group: {
          _id: null,
          totalCaloriesBurnt: { $sum: "$caloriesBurned" },
        },
      },
    ]);

    const totalWorkouts = await Workout.countDocuments({
      user: userId,
      date: { $gte: startToday, $lt: endToday },
    });

    const avgCaloriesBurntPerWorkout =
      totalCaloriesBurnt.length > 0
        ? totalCaloriesBurnt[0].totalCaloriesBurnt / totalWorkouts
        : 0;

    const categoryCalories = await Workout.aggregate([
      { $match: { user: user._id, date: { $gte: startToday, $lt: endToday } } },
      {
        $group: {
          _id: "$category",
          totalCaloriesBurnt: { $sum: "$caloriesBurned" },
        },
      },
    ]);

    const pieChartData = categoryCalories.map((category, index) => ({
      id: index,
      value: category.totalCaloriesBurnt,
      label: category._id,
    }));

    const weeks = [];
    const caloriesBurnt = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      weeks.push(`${date.getDate()}th`);

      const startOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const endOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 1
      );

      const weekData = await Workout.aggregate([
        {
          $match: {
            user: user._id,
            date: { $gte: startOfDay, $lt: endOfDay },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            totalCaloriesBurnt: { $sum: "$caloriesBurned" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      caloriesBurnt.push(weekData[0]?.totalCaloriesBurnt || 0);
    }

    return res.status(200).json({
      totalCaloriesBurnt: totalCaloriesBurnt[0]?.totalCaloriesBurnt || 0,
      totalWorkouts,
      avgCaloriesBurntPerWorkout,
      totalWeeksCaloriesBurnt: {
        weeks,
        caloriesBurned: caloriesBurnt,
      },
      pieChartData,
    });
  } catch (err) {
    next(err);
  }
};

export const getWorkoutsByDate = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    const date = req.query.date ? new Date(req.query.date) : new Date();

    if (!user) return next(createError(404, "User not found"));

    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1
    );

    const todaysWorkouts = await Workout.find({
      userId,
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    const totalCaloriesBurnt = todaysWorkouts.reduce(
      (total, workout) => total + workout.caloriesBurned,
      0
    );

    return res.status(200).json({ todaysWorkouts, totalCaloriesBurnt });
  } catch (err) {
    next(err);
  }
};

// ✅ Updated addWorkout Controller
export const addWorkout = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { workoutString } = req.body;

    if (!workoutString) {
      return next(createError(400, "Workout string is missing"));
    }

    const eachworkout = workoutString.split(";").map((block) => block.trim());

    const parsedWorkouts = [];
    let currentCategory = "";

    for (let count = 0; count < eachworkout.length; count++) {
      const block = eachworkout[count];

      if (block.startsWith("#")) {
        const parts = block.split("\n").map((part) => part.trim());

        if (parts.length < 5) {
          return next(
            createError(400, `Workout string is missing for entry ${count + 1}`)
          );
        }

        currentCategory = parts[0].substring(1).trim();
        const workoutDetails = parseWorkoutLine(parts);

        if (!workoutDetails) {
          return next(
            createError(400, "Please enter workout in the proper format.")
          );
        }

        workoutDetails.category = currentCategory;
        parsedWorkouts.push(workoutDetails);
      } else {
        return next(
          createError(400, `Workout format error at entry ${count + 1}`)
        );
      }
    }

    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    const addedWorkouts = [];

    for (const workout of parsedWorkouts) {
      const exists = await Workout.findOne({
        user: userId,
        workoutName: workout.workoutName,
        category: workout.category,
        date: { $gte: startOfDay, $lt: endOfDay },
      });

      if (exists) {
        return next(createError(400, "Workout already exists for today."));
      }

      workout.caloriesBurned = parseFloat(calculateCaloriesBurnt(workout));

      const savedWorkout = await Workout.create({
        ...workout,
        user: userId,
        date: new Date(),
      });

      addedWorkouts.push(savedWorkout);
    }

    return res.status(201).json({
      message: "Workouts added successfully",
      workouts: addedWorkouts,
    });
  } catch (err) {
    console.error("Add Workout Error:", err);
    return next(createError(500, "Failed to add workout."));
  }
};

// 🔧 Helpers
const parseWorkoutLine = (parts) => {
  const details = {};
  if (parts.length >= 5) {
    try {
      details.workoutName = parts[1].substring(1).trim();
      details.sets = parseInt(parts[2].split("sets")[0].substring(1).trim());
      details.reps = parseInt(
        parts[2].split("sets")[1].split("reps")[0].substring(1).trim()
      );
      details.weight = parseFloat(parts[3].split("kg")[0].substring(1).trim());
      details.duration = parseFloat(
        parts[4].split("min")[0].substring(1).trim()
      );
      return details;
    } catch (e) {
      return null;
    }
  }
  return null;
};

const calculateCaloriesBurnt = (workoutDetails) => {
  const durationInMinutes = parseFloat(workoutDetails.duration);
  const weightInKg = parseFloat(workoutDetails.weight);
  const caloriesBurntPerMinute = 5; // You can fine-tune this
  return durationInMinutes * caloriesBurntPerMinute * (weightInKg / 70);
};
