import AuthorizationError from '../utils/AuthorizationError';
import {
  validateUsername,
  validateIntro,
  validatePassword,
  validateImage,
} from '../utils/validators';
import ValidationError from '../utils/ValidationError';
import { authErrors, userErrors } from '../utils/errorMessages';
import userRepo from '../repositories/UserRepository';
import recipeRepo from '../repositories/RecipeRepository';
import deletedUserData from '../utils/deletedUserData';

export const userService = {
  async getMe(id) {
    const user = await userRepo.getOneById(id);

    await this.checkIsDeletedUser(user);

    return { user };
  },

  async getUser(id) {
    const user = await userRepo.getOneByIdWithSelectedFields(
      id,
      'username image intro',
    );

    if (!user) {
      throw new ValidationError(`${userErrors.notFound} (id: ${id})`);
    }

    return { user };
  },

  async updateUser(id, dataToBeUpdated) {
    await this.checkFields(dataToBeUpdated);

    const {
      username,
      password,
      newPassword,
      favorites,
      intro,
      image,
    } = dataToBeUpdated;

    const user = await userRepo.getOneById(id);

    await this.checkIsDeletedUser(user);

    if (username) {
      if (username !== user.getUsername()) {
        await validateUsername(username);
        username.trim(' ');
        await user.updateOne({ username });
      }
    }

    if (intro) {
      await validateIntro(intro);
      await user.updateOne({ intro });
    }

    if (favorites) {
      await this.updateFavorites(user, favorites);
    }

    if (password || newPassword) {
      await this.updatePassword(password, newPassword, id);
    }

    if (image) {
      await this.updateImage(user._id, image);
    }

    // const updatedUser = await User.findById(id);
    const updatedUser = await userRepo.getOneById(id);
    return { user: updatedUser };
  },

  async deleteUser(id) {
    const user = await userRepo.getOneById(id);
    await this.checkIsDeletedUser(user);

    const { image } = user;

    await user.updateOne(deletedUserData);

    const deletedUser = await userRepo.getOneById(id);
    if (!deletedUser.isDeletedUser()) {
      throw new Error(userErrors.failedDeletion);
    }

    await recipeRepo.deleteUserIdFromMarkedAsFavoriteBy(id);

    if (image) {
      await userRepo.deleteImage(image, id);
    }

    return { user };
  },

  async checkFields(dataToBeUpdated) {
    const allowedToBeUpdatedFields = [
      'username',
      'password',
      'newPassword',
      'favorites',
      'intro',
      'image',
    ];

    const fieldsToBeUpdated = Object.keys(dataToBeUpdated);
    if (!fieldsToBeUpdated.length) {
      throw new ValidationError(userErrors.missingData);
    }
    fieldsToBeUpdated.forEach((field) => {
      if (!allowedToBeUpdatedFields.includes(field)) {
        throw new AuthorizationError(`${userErrors.cannotUpdate} "${field}"`);
      }
    });
  },

  async checkIsDeletedUser(user) {
    if (user.isDeletedUser()) {
      throw new AuthorizationError(userErrors.deleted);
    }
  },

  async updatePassword(password, newPassword, id) {
    if (!password) {
      throw new ValidationError(userErrors.missingData);
    }

    await validatePassword(newPassword, true);

    const user = await userRepo.getOneByIdWithSelectedFields(id, '+password');
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new AuthorizationError(authErrors.invalidPwd);
    }

    user.password = newPassword;
    await user.save();
  },

  async updateFavorites(user, favorites) {
    const prevFavorites = user.getFavorites();

    if (prevFavorites.length < favorites.length) {
      const recipeToBePushed = favorites.filter(
        (recipeId) => !prevFavorites.includes(recipeId),
      );

      await recipeRepo.updateFavorites(recipeToBePushed[0], user._id, 'push');
    }

    if (prevFavorites.length > favorites.length) {
      const recipeToBePulled = prevFavorites.filter(
        (recipeId) => !favorites.includes(recipeId.toString()),
      );

      await recipeRepo.updateFavorites(recipeToBePulled[0], user._id, 'pull');
    }

    await user.updateOne({ favorites });
  },

  async updateImage(userId, image) {
    await validateImage(image);

    await userRepo.saveImage(image, 'users', userId);
  },
};
