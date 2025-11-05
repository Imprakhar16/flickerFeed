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

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const port = process.env.PORT || 10000; 
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
