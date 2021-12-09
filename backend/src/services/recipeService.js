import fetch from 'node-fetch';
import ValidationError from '../utils/ValidationError';
import AuthorizationError from '../utils/AuthorizationError';
import { validateRecipe, checkCalories, validateImage } from '../utils/validators';
import logger from '../logger';
import { recipeErrors } from '../utils/errorMessages';
import recipeRepo from '../repositories/RecipeRepository';
import { categoryRepo, labelRepo } from '../repositories/CategoriesRepository';

export const recipeService = {
  async createRecipe(id, recipe, mealImage) {
    await validateRecipe(recipe);
    const { ingredients } = recipe;

    const {
      nutrients,
      labels,
    } = await this.getNutritionalInfoFromRecipeIngredients(ingredients);

    let newRecipe = await recipeRepo.createRecipe({
      ...recipe,
      creator: id,
      nutrients,
      labels,
    });

    if (mealImage) {
      newRecipe = await this.updateImage(newRecipe._id, mealImage);
    }

    return { recipe: newRecipe };
  },

  async getSingleRecipe(recipeId) {
    const recipe = await recipeRepo.getOneById(recipeId);

    if (!recipe) {
      throw new Error(recipeErrors.notFound);
    }

    return { recipe };
  },

  async getListOfRecipes(queryParams) {
    const data = await recipeRepo.getRecipeListByQuery(queryParams);

    return data;
  },

  async updateRecipe(userId, recipeId, dataToBeUpdated, mealImage) {
    await validateRecipe(dataToBeUpdated);

    const recipe = await recipeRepo.getOneById(recipeId);

    if (!recipe) {
      throw new Error(`${recipeErrors.notFound} (id: ${recipeId})`);
    }

    if (!recipe.isCreator(userId)) {
      throw new AuthorizationError(recipeErrors.cannotUpdate);
    }

    if (mealImage) {
      await this.updateImage(recipeId, mealImage);
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

    const updatedRecipe = await recipeRepo.getOneById(recipeId);

    return { recipe: updatedRecipe };
  },

  async deleteRecipe(userId, recipeId) {
    const recipe = await recipeRepo.getOneById(recipeId);

    if (!recipe) {
      throw new Error(`${recipeErrors.notFound} (id: ${recipeId})`);
    }

    if (!recipe.isCreator(userId)) {
      throw new AuthorizationError(recipeErrors.cannotUpdate);
    }

    const deletedRecipe = await recipe.deleteOne();

    if (!deletedRecipe) {
      throw new Error(recipeErrors.failedDeletion);
    }

    return { recipe: deletedRecipe };
  },

  async getAllCategories(category) {
    let categories = [];

    if (category === 'categories') {
      categories = await categoryRepo.getAll();
    } else if (category === 'labels') {
      categories = await labelRepo.getAll();
    }

    return categories;
  },

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
    const labels = await labelRepo.getAll();
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

  async updateImage(recipeId, image) {
    await validateImage(image);

    const updatedRecipe = await recipeRepo.saveImage(image, 'meals', recipeId);
    return updatedRecipe;
  },
};
