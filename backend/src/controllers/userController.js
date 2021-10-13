import { userService } from '../services/userService';

export const userController = {
  async getUser(req, res, next) {
    const { id } = req.params;

    try {
      const data = await userService.getUser(id);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  },

  async getMe(req, res, next) {
    const { id } = req.user;

    try {
      const data = await userService.getMe(id);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  },

  async deleteUser(req, res, next) {
    const { id } = req.user;

    try {
      const data = await userService.deleteUser(id);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  },

  async updateUser(req, res, next) {
    const { id } = req.user;
    const { avatar } = req.files;

    const dataToBeUpdated = {
      ...req.body,
      avatar,
    };

    try {
      const data = await userService.updateUser(id, dataToBeUpdated);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  },
};
