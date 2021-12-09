import GeneralRepository from './GeneralRepository';
import Category from '../models/Category';
import Label from '../models/Label';

const categoryRepo = new GeneralRepository(Category);
const labelRepo = new GeneralRepository(Label);

export { categoryRepo, labelRepo };
