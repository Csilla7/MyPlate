import { recipeService } from '../services';

export const recipeController = {
  async createRecipe(req, res, next) {
    const { recipe } = req.body;
    const { id } = req.user;
    const { mealImage } = req.files;

    try {
      const data = await recipeService.createRecipe(id, recipe, mealImage);
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  },

  async getSingleRecipe(req, res, next) {
    const { id } = req.params;

    try {
      const data = await recipeService.getSingleRecipe(id);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  },

  async getListOfRecipes(req, res, next) {
    try {
      const data = await recipeService.getListOfRecipes(req.query);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  },

  async updateRecipe(req, res, next) {
    const userId = req.user.id;
    const recipeId = req.params.id;
    const { recipe } = req.body;
    const { mealImage } = req.files;

    try {
      const data = await recipeService.updateRecipe(userId, recipeId, recipe, mealImage);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  },

  async deleteRecipe(req, res, next) {
    const userId = req.user.id;
    const recipeId = req.params.id;

    try {
      const data = await recipeService.deleteRecipe(userId, recipeId);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  },

  async getAllCategories(req, res, next) {
    const { category } = req.params;

    try {
      const data = await recipeService.getAllCategories(category);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  },
};
