import GeneralRepository from './GeneralRepository';
import Recipe from '../models/Recipe';
import userRepo from './UserRepository';

class RecipeRepo extends GeneralRepository {
  static async insert$ToQuery(reqQuery) {
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`);

    return queryStr;
  }

  static async reParseQuery(queryStr, reqQuery) {
    const reParsedQuery = JSON.parse(queryStr);
    if (reParsedQuery.name) {
      reParsedQuery.name = await this.generateRegexQuery(reqQuery.name);
    }
    if (reParsedQuery.ingredients) {
      reParsedQuery.ingredients = await this.generateRegexQuery(reqQuery.ingredients);
    }

    return reParsedQuery;
  }

  static async generateRegexQuery(str) {
    return {
      $regex: new RegExp(str),
      $options: 'i',
    };
  }

  static async chainingQuery(reParsedQuery, queryParams) {
    let query = this.model.find(reParsedQuery);
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
    const total = await this.model.countDocuments();

    query = query.skip(startIndex).limit(limit);

    const recipeList = await query;
    let message = '';
    if (recipeList.length === 0) {
      message = 'no results';
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
  }

  async createRecipe(recipeData) {
    const recipe = await this.model.create(recipeData);
    await userRepo.updateRecipeList(recipeData.creator, recipe._id, 'push');
    return recipe;
  }

  async deleteUserIdFromMarkedAsFavoriteBy(id) {
    await this.model.updateMany(
      { markedAsFavoriteBy: id },
      { $pull: { markedAsFavoriteBy: id } },
    );
  }

  async updateFavorites(recipeId, userId, action) {
    await this.model.updateOne({ _id: recipeId }, { [`$${action}`]: { markedAsFavoriteBy: userId } });
  }

  async getRecipeListByQuery(queryParams) {
    const reqQuery = { ...queryParams };

    const fieldsToRemove = ['select', 'sort', 'page', 'limit'];
    fieldsToRemove.forEach((param) => delete reqQuery[param]);

    const queryStr = await this.insert$ToQuery(reqQuery);
    const reParsedQuery = await this.reParseQuery(queryStr, reqQuery);
    const data = await this.chainingQuery(reParsedQuery, queryParams);

    return data;
  }
}

const recipeRepo = new RecipeRepo(Recipe);

export default recipeRepo;
