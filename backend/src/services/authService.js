import User from '../models/User';
import AuthenticationError from '../utils/AuthenticationError';
import { validatePassword, validateEmail } from '../utils/validators';
import { authErrors } from '../utils/errorMessages';

export const authService = {

  async register(email, password) {
    await validateEmail(email, true);
    await validatePassword(password, true);

    const newUser = await User.create({ email, password });
    const token = newUser.createToken();
    return { token };
  },

  async login(email, password) {
    await validateEmail(email, false);
    await validatePassword(password, false);

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new AuthenticationError(authErrors.notRegisteredEmail);
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      throw new AuthenticationError(authErrors.invalidPwd);
    }

    const token = await user.createToken();

    return { token };
  },

};
