import mongooe from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const connectDB = async () => {
  try {
    await mongooe.connect(process.env.MONGO_URI);
  } catch (error) {
    console.log(error);
  }
};

export default connectDB;
