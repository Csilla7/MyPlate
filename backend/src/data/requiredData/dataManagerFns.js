import Category from '../../models/Category';
import Label from '../../models/Label';
import categories from './categories';
import labels from './labels';
import logger from '../../logger';

const fillRequiredCollections = async () => {
  if (!await Category.countDocuments({})) {
    await Category.insertMany(categories);
  }

  if (!await Label.countDocuments({})) {
    await Label.insertMany(labels);
  }
};

const deleteRequiredCollections = async () => {
  try {
    await Category.deleteMany();
    await Label.deleteMany();
  } catch (err) {
    logger.error(err.message);
  }
};

export { fillRequiredCollections, deleteRequiredCollections };
