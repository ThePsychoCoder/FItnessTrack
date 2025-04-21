import jwt from "jsonwebtoken";
import { createError } from "../error.js";

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next(createError(401, "You are not authenticated!"));
    }

    const token = authHeader.split(" ")[1]; // Extract token from 'Bearer <token>'
    if (!token) {
      return next(createError(401, "You are not authenticated"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
      req.user = decoded; // Attach decoded user data to request
      return next(); // Proceed to next middleware or route
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(
          createError(401, "Token has expired. Please log in again.")
        );
      }
      return next(createError(401, "Invalid token. Please log in again."));
    }
  } catch (err) {
    return next(err); // Handle other errors
  }
};
