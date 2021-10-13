import validator from 'validator';
import ValidationError from './ValidationError';
import Category from '../models/Category';
import User from '../models/User';
import { imageErrors } from './errorMessages';

async function validatePassword(password, isNew) {
  if (!password) {
    throw new ValidationError('Invalid password');
  }

  if (isNew) {
    if (validator.isLength(password, { min: 8 }) === false) {
      throw new ValidationError('The password must be at least 8 characters long');
    }

    if (password === password.toUpperCase()
                || password === password.toLowerCase()) {
      throw new ValidationError('Password must contain both uppercase and lowercase letters');
    }
  }
}

async function validateEmail(email, isReg) {
  if (!email) {
    throw new ValidationError('Missing email');
  }

  if (!validator.isEmail(email)) {
    throw new ValidationError('Invalid email format');
  }

  if (isReg) {
    if (await User.exists({ email })) {
      throw new ValidationError('Email is already registered', 409);
    }
  }
}

async function validateUsername(username) {
  const trimmedUsername = validator.trim(username);

  if (await User.exists({ username })) {
    throw new ValidationError('Username is already in use');
  }

  if (trimmedUsername === '') {
    throw new ValidationError('Invalid username');
  }

  if (validator.isLength(username, { min: 3, max: 20 }) === false) {
    throw new ValidationError('Username must be a minimum of 3 and a maximum of 20 characters.');
  }
}

async function validateIntro(intro) {
  const isValid = validator.isLength(intro, { min: 0, max: 300 });
  if (!isValid) {
    throw new ValidationError('Introduction can be up to 300 characters long');
  }
}

async function checkCalories(calories) {
  const isValid = validator.isInt(calories.toString(), { min: 0, max: 700 });

  if (!isValid) {
    throw new ValidationError(`Your recipe is too high in calories: ${calories} kcal. Maximum value: 700 kcal.`);
  }
}

async function isNotEmptyField(field, fieldName) {
  if (!validator.isNotEmptyField(field)) {
    throw new ValidationError(`${fieldName} is required`);
  }
}

async function validateRecipeName(name) {
  await isNotEmptyField(name, 'Name');

  const isValid = validator.isLength(name, { min: 3, max: 100 });
  if (!isValid) {
    throw new ValidationError('Name should be min 3, max 100 characters');
  }
}

async function validateIngredients(ingredients) {
  await isNotEmptyField(ingredients, 'Ingredients');

  if (Array.isArray(ingredients) === false) {
    throw new ValidationError('Invalid ingredients');
  }

  if (ingredients.every((ingredient) => typeof ingredient === 'string') === false) {
    throw new ValidationError('Invalid ingredient');
  }

  if (ingredients.every((ingredient) => ingredient.length > 0) === false) {
    throw new ValidationError('Invalid ingredient');
  }
}

async function validateDifficulty(difficulty) {
  await isNotEmptyField(difficulty, 'Difficulty');

  const isValid = validator.isIn(difficulty.toString(), [1, 2, 3]);

  if (!isValid) {
    throw new ValidationError('Invalid difficulty');
  }
}

async function validateCookingTime(cookingTime) {
  await isNotEmptyField(cookingTime, 'Cooking time');

  const isValid = validator.isInt(cookingTime.toString(), { min: 1, max: 120 });

  if (!isValid) {
    throw new ValidationError('Cooking time is too long');
  }
}

async function validateCategory(category) {
  await isNotEmptyField(category, 'Category');

  if (!validator.isMongoId(category)) {
    throw new ValidationError('Invalid id');
  }

  const isValidCategory = await Category.exists({ _id: category });
  if (!isValidCategory) {
    throw new ValidationError(`Id: ${category} is not found`);
  }
}

async function validateAllowedFields(recipe) {
  const allowedFields = ['name', 'ingredients', 'difficulty', 'cookingTime', 'category', 'steps', 'description'];
  const recipeFields = Object.keys(recipe);
  recipeFields.forEach((field) => {
    if (allowedFields.includes(field) === false) {
      throw new ValidationError(`Invalid field: ${field}`);
    }
  });
}

async function validateDescription(description) {
  const isValid = validator.isLength(description, { min: 0, max: 500 });
  if (!isValid) {
    throw new ValidationError('Description can be up to 500 characters.');
  }
}

async function validateSteps(steps) {
  await isNotEmptyField(steps, 'Steps');

  if (!Array.isArray(steps)) {
    throw new ValidationError('Invalid steps');
  }

  if (steps.every((step) => typeof step === 'string') === false) {
    throw new ValidationError('Invalid step');
  }

  if (steps.every((step) => step.length > 0) === false) {
    throw new ValidationError('Invalid step');
  }
}

async function validateRecipe(recipe) {
  const {
    name,
    ingredients,
    cookingTime,
    category,
    steps,
    difficulty,
    description,
  } = recipe;

  await validateAllowedFields(recipe);
  await validateRecipeName(name);
  await validateDifficulty(difficulty);
  await validateCookingTime(cookingTime);
  await validateSteps(steps);
  await validateIngredients(ingredients);
  await validateCategory(category);

  if (description) {
    await validateDescription(description);
  }
}

async function validateImage(file) {
  if (!file.mimetype.startsWith('image')) {
    throw new ValidationError(imageErrors.invalidFile);
  }

  if (file.size > (process.env.MAX_UPLOAD_IMG_SIZE || 1000000)) {
    throw new ValidationError(imageErrors.tooLarge);
  }
}

export {
  validateEmail,
  validatePassword,
  validateUsername,
  validateRecipe,
  validateIntro,
  checkCalories,
  validateImage,
};
