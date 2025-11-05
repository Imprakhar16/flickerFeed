import express from "express"
import dotenv from "dotenv"
import connectDB from "./config/db.js";
import passport from 'passport';
import session from 'express-session';
import authRoutes from "../src/routes/authRoutes.js";
import "./config/passport.js"

const app = express()
dotenv.config();
connectDB();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));


app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);

app.listen(process.env.PORT,()=>console.log(`server is up and running on ${process.env.PORT} port`)) 