import fetch from 'node-fetch';
import Recipe from '../models/Recipe';
import Label from '../models/Label';
import User from '../models/User';
import Category from '../models/Category';
import ValidationError from '../utils/ValidationError';
import AuthorizationError from '../utils/AuthorizationError';
import { validateRecipe, checkCalories, validateImage } from '../utils/validators';
import logger from '../logger';
import { recipeErrors } from '../utils/errorMessages';
import CloudinaryRepo from './CloudinaryRepository';

export const recipeService = {
  async createRecipe(id, recipe, mealImage) {
    await validateRecipe(recipe);
    const { ingredients } = recipe;

    const {
      nutrients,
      labels,
    } = await this.getNutritionalInfoFromRecipeIngredients(ingredients);

    const user = await User.findById(id);
    const newRecipe = await Recipe.create({
      ...recipe,
      creator: user._id,
      nutrients,
      labels,
    });

    if (mealImage) {
      await validateImage(mealImage);
      const publicId = await CloudinaryRepo.save(mealImage, 'meals', newRecipe._id);

      await newRecipe.updateOne({ image: publicId });
    }

    user.recipes.push(newRecipe._id);
    await user.save();

    const savedRecipe = await Recipe.findById(newRecipe._id);

    return { recipe: savedRecipe };
  },

  async getSingleRecipe(recipeId) {
    const recipe = await Recipe.findById(recipeId)
      .populate({
        path: 'creator',
        select: 'username image',
      })
      .populate('labels')
      .populate('category')
      .catch((err) => {
        logger.error(err.message);
        throw new Error(recipeErrors.notFound);
      });

    // why is it here?
    if (!recipe) {
      throw new Error(recipeErrors.notFound);
    }

    return { recipe };
  },

  async getListOfRecipes(queryParams) {
    const reqQuery = { ...queryParams };

    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach((param) => delete reqQuery[param]);

    const queryStr = await this.insert$ToQuery(reqQuery);

    const reParsedQuery = await this.reParseQuery(queryStr, reqQuery);

    const data = await this.chainingQuery(reParsedQuery, queryParams);

    return data;
  },

  async updateRecipe(userId, recipeId, dataToBeUpdated, mealImage) {
    await validateRecipe(dataToBeUpdated);

    const recipe = await Recipe.findById(recipeId).catch((err) => {
      logger.error(err.message);
      throw new Error(`${recipeErrors.notFound} (id: ${recipeId})`);
    });

    if (recipe.creator.toString() !== userId) {
      throw new AuthorizationError(recipeErrors.cannotUpdate);
    }

    if (mealImage) {
      await validateImage(mealImage);
      const publicId = await CloudinaryRepo.save(mealImage, 'meals', recipeId);

      recipe.image = publicId;
    }

    const recipeIngredients = JSON.stringify(recipe.ingredients);
    const ingredientsToBeUpdated = JSON.stringify(dataToBeUpdated.ingredients);

    if (recipeIngredients !== ingredientsToBeUpdated) {
      const {
        nutrients,
        labels,
      } = await this.getNutritionalInfoFromRecipeIngredients(dataToBeUpdated.ingredients);

      recipe.labels = labels;
      recipe.nutrients = nutrients;
    }

    const fieldsOfDataToBeUpdated = Object.keys(dataToBeUpdated);
    fieldsOfDataToBeUpdated.forEach((field) => { recipe[field] = dataToBeUpdated[field]; });

    await recipe.save();

    const updatedRecipe = await Recipe.findById(recipeId);

    return { recipe: updatedRecipe };
  },

  async deleteRecipe(userId, recipeId) {
    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      throw new Error(`${recipeErrors.notFound} (id: ${recipeId})`);
    }

    if (recipe.creator.toString() !== userId) {
      throw new AuthorizationError(recipeErrors.cannotDelete);
    }

    const deletedRecipe = await recipe.deleteOne();

    if (!deletedRecipe) {
      throw new Error(recipeErrors.failedDeletion);
    }

    await CloudinaryRepo.delete(deletedRecipe.image);

    return { recipe: deletedRecipe };
  },

  async getAllCategories(category) {
    let categories = [];

    if (category === 'categories') {
      categories = await Category.find();
    } else if (category === 'labels') {
      categories = await Label.find();
    }

    return categories;
  },

  // stay here
  async getRecipeInfo(ingredients) {
    const nutritionApiUrl = new URL(process.env.EDAMAM_APP_URL);
    const params = new URLSearchParams({
      app_id: process.env.EDAMAM_APP_ID,
      app_key: process.env.EDAMAM_APP_KEY,
    });
    nutritionApiUrl.search = params.toString();
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ingr: ingredients }),
    };

    const result = await fetch(nutritionApiUrl, requestOptions)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw Error(response.error);
        }

        return data;
      })
      .catch((err) => {
        logger.error(`Edamam API error: ${err.message}`);
        throw new ValidationError(recipeErrors.edamam);
      });

    return result;
  },

  async processRecipeInfo(data) {
    const {
      calories, totalNutrients, dietLabels, healthLabels,
    } = data;
    await checkCalories(calories);
    const nutrients = {
      protein: {
        ...totalNutrients.PROCNT,
      },
      carb: {
        ...totalNutrients.CHOCDF,
      },
      fat: {
        ...totalNutrients.FAT,
      },
      fiber: {
        ...totalNutrients.FIBER,
      },
    };

    const labels = await this.getLabelsToSave(dietLabels, healthLabels);

    return { nutrients, labels };
  },

  async getLabelsToSave(dietLabels, healthLabels) {
    const labels = await Label.find();
    const labelsToSave = [];
    labels.forEach((doc) => {
      if (dietLabels.includes(doc.name) || healthLabels.includes(doc.name)) {
        labelsToSave.push(doc._id);
      }
    });

    return labelsToSave;
  },

  async getNutritionalInfoFromRecipeIngredients(ingredients) {
    const recipeInfo = await this.getRecipeInfo(ingredients);
    const result = await this.processRecipeInfo(recipeInfo);
    return result;
  },

  async generateRegexQuery(str) {
    return {
      $regex: new RegExp(str),
      $options: 'i',
    };
  },

  async insert$ToQuery(reqQuery) {
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`);

    return queryStr;
  },

  async reParseQuery(queryStr, reqQuery) {
    const reParsedQuery = JSON.parse(queryStr);
    if (reParsedQuery.name) {
      reParsedQuery.name = await this.generateRegexQuery(reqQuery.name);
    }
    if (reParsedQuery.ingredients) {
      reParsedQuery.ingredients = await this.generateRegexQuery(reqQuery.ingredients);
    }

    return reParsedQuery;
  },

  async chainingQuery(reParsedQuery, queryParams) {
    let query = Recipe.find(reParsedQuery);
    // select('field otherfield')
    if (queryParams.select) {
      const fields = queryParams.select.split(',').join(' ');
      query = query.select(fields);
    }

    if (queryParams.sort) {
      const sortBy = queryParams.sort.split(',').join(' ');
      query = query.sort(sortBy);
    }

    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 12;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Recipe.countDocuments();

    query = query.skip(startIndex).limit(limit);

    query = query
      .populate({
        path: 'creator',
        select: 'username avatar',
        populate: { path: 'avatar', select: 'url' },
      })
      .populate({
        path: 'image',
        select: 'url',
      });

    const recipeList = await query;
    let message = '';
    if (recipeList.length === 0) {
      message = 'Nincs találat.';
    }

    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
      };
    }

    pagination.limit = limit;

    return { pagination, recipeList, message };
  },
};
