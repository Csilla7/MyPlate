import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  username: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  intro: {
    type: String,
    required: false,
  },
  recipes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Recipe',
  }],
  favorites: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Recipe',
  }],
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.createToken = function () {
  return jwt.sign({
    id: this._id,
    username: this?.username,
    favorites: this?.favorites,
    recipes: this?.recipes,
  },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRE });
};

UserSchema.methods.matchPassword = async function (enteredPassword) {
  const isMatch = await bcrypt.compare(enteredPassword, this.password);
  return isMatch;
};

UserSchema.methods.isDeletedUser = function () {
  return this.isDeleted;
};

UserSchema.methods.getUsername = function () {
  return this.username;
};

UserSchema.methods.getFavorites = function () {
  return this.favorites;
};

const User = mongoose.model('User', UserSchema);

export default User;
