import User from '../models/User';
import AuthenticationError from '../utils/AuthenticationError';
import { authErrors } from '../utils/errorMessages';
import GeneralRepository from './GeneralRepository';

class UserRepo extends GeneralRepository {
  async createUser(email, password) {
    const newUser = await this.model.create({ email, password });
    const token = newUser.createToken();

    return token;
  }

  async checkUser(email, password) {
    const user = await this.model.findOne({ email }).select('+password');

    if (!user) {
      throw new AuthenticationError(authErrors.notRegisteredEmail);
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      throw new AuthenticationError(authErrors.invalidPwd);
    }

    const token = await user.createToken();

    return token;
  }

  async updateRecipeList(userId, recipeId, action) {
    await this.model.updateOne({ _id: userId }, { [`$${action}`]: { recipes: recipeId } });
  }
}

const userRepo = new UserRepo(User);

export default userRepo;
