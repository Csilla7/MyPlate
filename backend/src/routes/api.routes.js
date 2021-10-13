import express from 'express';
import fileUpload from 'express-fileupload';
import { checkToken } from '../middlewares/checkToken';
import {
  recipeController,
  userController,
} from '../controllers';

const cors = require('cors');

const router = express.Router();

router.use(cors());
router.use(express.json());

router.get('/recipes/categories/:category', recipeController.getAllCategories);
router.get('/recipes/:id', recipeController.getSingleRecipe);
router.get('/recipes', recipeController.getListOfRecipes);
router.post('/recipes', fileUpload({ useTempFiles: true }), checkToken, recipeController.createRecipe);
router.put('/recipes/:id', fileUpload({ useTempFiles: true }), checkToken, recipeController.updateRecipe);
router.delete('/recipes/:id', checkToken, recipeController.deleteRecipe);

router.get('/users/me', checkToken, userController.getMe);
router.get('/users/:id', userController.getUser);
router.delete('/users', checkToken, userController.deleteUser);
router.put('/users', fileUpload({ useTempFiles: true }), checkToken, userController.updateUser);

export default router;
