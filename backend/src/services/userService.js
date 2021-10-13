import User from '../models/User';
import Recipe from '../models/Recipe';
import AuthorizationError from '../utils/AuthorizationError';
import {
  validateUsername, validateIntro, validatePassword, validateImage,
} from '../utils/validators';
import ValidationError from '../utils/ValidationError';
import { authErrors, userErrors } from '../utils/errorMessages';
import CloudinaryRepo from './CloudinaryRepository';

export const userService = {
  async getMe(id) {
    const user = await User.findById(id);

    await this.checkIsDeletedUser(user);

    return { user };
  },

  async getUser(id) {
    const user = await User.findById(id).select('username image intro');

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
      avatar,
    } = dataToBeUpdated;

    const user = await User.findById(id);

    await this.checkIsDeletedUser(user);

    if (username) {
      if (username !== user.username) {
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

    if (avatar) {
      await this.updateImage(user, avatar);
    }

    const updatedUser = await User.findById(id);
    return { user: updatedUser };
  },

  async deleteUser(id) {
    const user = await User.findById(id);

    await this.checkIsDeletedUser(user);

    const { DELETED_USER_EMAIL, DELETED_USER_PWD } = process.env;
    const { image } = user;

    await user.updateOne({
      username: 'unknown chef',
      isDeleted: true,
      email: DELETED_USER_EMAIL,
      password: DELETED_USER_PWD,
      intro: '',
      favorites: [],
      image: '',
    });

    const deletedUser = await User.findById(id);

    if (deletedUser.isDeleted === false) {
      throw new Error(userErrors.failedDeletion);
    }

    await Recipe.updateMany(
      { markedAsFavoriteBy: id },
      { $pull: { markedAsFavoriteBy: id } },
    );

    if (image) {
      await CloudinaryRepo.delete(image);
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
      'avatar',
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
    if (user.isDeleted) {
      throw new AuthorizationError(userErrors.deleted);
    }
  },

  async updatePassword(password, newPassword, id) {
    if (!password) {
      throw new ValidationError(userErrors.missingData);
    }

    await validatePassword(newPassword, true);

    const user = await User.findById(id).select('+password');
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new AuthorizationError(authErrors.invalidPwd);
    }

    user.password = newPassword;
    await user.save();
  },

  async updateFavorites(user, favorites) {
    const prevFavorites = user.favorites;

    if (prevFavorites.length < favorites.length) {
      const recipeToBePushed = favorites
        .filter((recipeId) => !prevFavorites.includes(recipeId));

      await Recipe.updateOne(
        { _id: recipeToBePushed[0] },
        { $push: { markedAsFavoriteBy: user._id } },
      );
    }

    if (prevFavorites.length > favorites.length) {
      const recipeToBePulled = prevFavorites
        .filter((recipeId) => !favorites.includes(recipeId.toString()));

      await Recipe.updateOne(
        { _id: recipeToBePulled[0] },
        { $pull: { markedAsFavoriteBy: user._id } },
      );
    }

    await user.updateOne({ favorites });
  },

  async updateImage(user, avatar) {
    // don't need to delete previous image, it will be overwritten if the public_id is the same
    await validateImage(avatar);

    const publicId = await CloudinaryRepo.save(avatar, 'users', user._id);

    await user.updateOne({ image: publicId });
  },
};
