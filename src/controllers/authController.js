import User from "../models/userModel.js";
import passport from "passport";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import send_mail from "../utils/sendMail.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

const generateOtp = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
};

const generateOtpToken = (email, otp) => {
  return jwt.sign({ email, otp }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

export const registerUser = async (req, res) => {
  const { userName, firstName, lastName, email, gender, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    // Cloudinary profile photo URL
    const profilePhoto = req.file?.path || null;
    const otpToken = generateOtpToken(email, otp);
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
    const emailBody = `
    <div style="font-family: Arial, sans-serif; color: #333; text-align: center; padding: 20px;">
      <h2 style="color: #4CAF50;">Welcome to FlickerFeed, ${firstName}!</h2>
      <p>Thank you for registering. Please use the OTP below to verify your email address:</p>
      <h1 style="background: #f1f1f1; display: inline-block; padding: 10px 20px; border-radius: 5px;">${otp}</h1>
      <p style="font-size: 0.9em; color: #555;">This OTP is valid for 10 minutes.</p>
    </div>
  `;

    const mailResponse = await send_mail({
      email,
      subject: "FlickerFeed Email Verification OTP",
      body: emailBody,
    });

    if (!mailResponse.success) {
      return res.status(500).json({
        message: "Failed to send OTP email",
        error: mailResponse.error,
      });
    }
    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
      otpToken: otpToken,
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
      return res.status(400).json({ message: "Please register yourself First" });
    }

    if(!user.isVerified) return res.status(400).json({message:"You are not verified,Please verify yourself"})

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login successful", user:user,token:generateToken(user._id) });
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

export const verifyOtp = async (req, res) => {
  try {
    const { otpToken, otp } = req.body;

    if (!otpToken)
      return res.status(400).json({ message: "OTP Token is required" });
    if (!otp) return res.status(400).json({ message: "OTP is required" });
    let decoded;
    try {
      decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(400)
          .json({ message: "OTP has expired. Please request a new one" });
      }
      return res.status(400).json({ message: "Invalid OTP token" });
    }

    if (decoded.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    const user = await User.findOne({ email: decoded.email });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified)
      return res.status(400).json({ message: "User is already verified" });

    user.isVerified = true;
    await user.save();

    res.status(200).json({
      message: "Email verified successfully! You can now login",
      isVerified: true,
    });
  } catch (error) {
    res.status(500).json({ message: "server error during verification" });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) {
      return res.status(400).json({
        message: "Email already verified. You can login now.",
        isVerified: true,
      });
    }

    const otp = generateOtp();

    const emailbody = `<div style="font-family: Arial, sans-serif; color: #333; text-align: center; padding: 20px;">
     <h2 style="color: #4CAF50;">Hello ${user.firstName},</h2>
     <p>We received a request to resend your OTP for verifying your FlickerFeed account.</p>
     <h1 style="background: #f1f1f1; display: inline-block; padding: 10px 20px; border-radius: 5px;">${otp}</h1>
     <p style="font-size: 0.9em; color: #555;">This OTP is valid for 10 minutes. If you didn’t request this, please ignore this email.</p>
     <p style="margin-top: 20px; font-size: 0.9em; color: #888;">FlickerFeed Team</p>
   </div>`;

    const mailResponse = await send_mail({
      email,
      subject: "FlickerFeed: Here’s Your New OTP",
      body: emailbody,
    });
    if (!mailResponse.success) {
      return res.status(500).json({
        message: "Failed to send OTP email",
        error: mailResponse.error,
      });
    }

    const otpToken = generateOtpToken(user.email, otp);
    res.status(200).json({
      message: "New OTP sent to your email",
      otpToken: otpToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
