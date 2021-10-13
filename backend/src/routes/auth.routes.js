import express from 'express';
import { authController } from '../controllers';

const cors = require('cors');

const router = express.Router();

router.use(cors());
router.use(express.json());

router.post('/register', authController.register);
router.post('/login', authController.login);

export default router;
