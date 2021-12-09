import mongoose from 'mongoose';
import User from './User';
import CloudinaryRepo from '../repositories/CloudinaryRepository';

const RecipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  ingredients: {
    type: [String],
    required: true,
  },
  steps: {
    type: [String],
    required: true,
  },
  calories: {
    type: Number,
    required: true,
  },
  nutrients: {
    fat: {
      label: String,
      quantity: Number,
      unit: String,
    },
    carbs: {
      label: String,
      quantity: Number,
      unit: String,
    },
    fiber: {
      label: String,
      quantity: Number,
      unit: String,
    },
    protein: {
      label: String,
      quantity: Number,
      unit: String,
    },
  },
  creator: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: true,
  },
  labels: {
    type: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Label',
      },
    ],
  },
  markedAsFavoriteBy: {
    type: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  cookingTime: {
    type: Number,
    required: true,
  },
  difficulty: {
    type: Number,
    required: true,
    enum: [1, 2, 3],
  },
});

RecipeSchema.post('deleteOne', { document: true, query: false }, async function () {
  await User.updateOne({ recipes: this._id }, { $pull: { recipes: this._id } });
  await User.updateMany({ favorites: this._id }, { $pull: { favorites: this._id } });

  if (this.image) {
    await CloudinaryRepo.delete(this.image);
  }
});

RecipeSchema.pre('find', function (next) {
  this.populate({
    path: 'creator',
    select: 'username image',
  });
  this.populate('labels');
  this.populate('category');
  next();
});

RecipeSchema.methods.isCreator = function (userId) {
  return this.creator.toString() === userId;
};

const Recipe = mongoose.model('Recipe', RecipeSchema);

export default Recipe;
