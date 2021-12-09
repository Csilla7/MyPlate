/* eslint-disable camelcase */

import fs from 'fs';
import cloudinary from '../utils/cloudinary';
import { imageErrors } from '../utils/errorMessages';
import logger from '../logger';

export default class CloudinaryRepo {
  static folders = {
    users: process.env.CLOUDINARY_USERS_IMG_FOLDER,
    meals: process.env.CLOUDINARY_MEALS_IMG_FOLDER,
  }

  static async save(image, folder, id) {
    const { public_id } = await cloudinary.uploader.upload(image.tempFilePath,
      {
        folder: this.folders[folder],
        public_id: id,
      },
      (error) => {
        if (error) {
          throw new Error(imageErrors.failedUpload);
        }
      });

    this.deleteTempImage(image);

    return public_id;
  }

  static async delete(image) {
    await cloudinary.uploader.destroy(image, (error, result) => {
      // console.log(result);
      if (error) {
        logger.error(error.message);
      }

      if (result) {
        logger.info(`Image was deleted from cloudinary (${result.public_id})`);
      }
    });
  }

  static deleteTempImage(image) {
    fs.unlink(image.tempFilePath, (err) => {
      if (err) logger.error('Temp image deletion failed');
    });
  }
}
