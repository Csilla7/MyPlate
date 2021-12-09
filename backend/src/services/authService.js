import { validatePassword, validateEmail } from '../utils/validators';
import userRepo from '../repositories/UserRepository';

export const authService = {

  async register(email, password) {
    await validateEmail(email, true);
    await validatePassword(password, true);

    const token = await userRepo.createUser(email, password);
    return { token };
  },

  async login(email, password) {
    await validateEmail(email, false);
    await validatePassword(password, false);

    const token = await userRepo.checkUser(email, password);

    return { token };
  },

};
