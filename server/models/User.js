import mongoose from "mongoose";
import bcrypt from "bcrypt";

// Schema for user
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/.+@.+\..+/, "Please enter a valid email address"], // email format validation
    },
    img: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      min: 18, // age should be 18 or older
      max: 120, // max age
    },
  },
  { timestamps: true }
);

// Pre-save middleware to hash password before saving the user
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // if password is not modified, skip hashing
  try {
    const salt = await bcrypt.genSalt(10); // generate salt
    this.password = await bcrypt.hash(this.password, salt); // hash password
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare password during login
UserSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password); // compare plain password with hashed password
};

export default mongoose.model("User", UserSchema);
