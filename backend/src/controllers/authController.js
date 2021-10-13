import { authService } from '../services';

export const authController = {
  async register(req, res, next) {
    const { email, password } = req.body;
    try {
      const data = await authService.register(email, password);
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    const { email, password } = req.body;
    try {
      const data = await authService.login(email, password);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  },
};
