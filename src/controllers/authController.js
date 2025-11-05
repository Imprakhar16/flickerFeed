import User from "../models/userModel.js";
import passport from "passport";
import bcrypt from "bcryptjs";

export const registerUser = async (req, res) => {
  const { userName, firstName, lastName, email, gender, password } = req.body;

  try {
   
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cloudinary profile photo URL
    const profilePhoto = req.file?.path || null;

    const newUser = new User({
      userName,
      firstName,
      lastName,
      email,
      gender,
      password: hashedPassword,
      profilePhoto,
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error logging in" });
  }
};

export const googleLogin = passport.authenticate("google", {
  scope: ["profile", "email"], // Request profile and email from Google
});

export const googleAuthenticate = passport.authenticate("google", {
  failureRedirect: "/login",
  successRedirect: "/dashboard",
});

export const logout = (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
};
