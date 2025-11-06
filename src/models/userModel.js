import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    password: { type: String},
    profilePhoto: { type: String,sparse: true, },
    googleId: { type: String, unique: true, sparse: true, },
    isVerified:{type:Boolean,default:false}
  },
  { timestamps: true }
);
const User = mongoose.model('User', userSchema);
export default User
