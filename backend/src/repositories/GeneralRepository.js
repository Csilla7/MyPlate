import CloudinaryRepo from './CloudinaryRepository';

export default class GenerealRepository {
  constructor(model) {
    this.model = model;
  }

  async getOneById(id) {
    const result = await this.model.findById(id);
    return result;
  }

  async getOneByIdWithSelectedFields(id, fields) {
    const result = await this.model.findById(id).select(fields);
    return result;
  }

  async saveImage(image, folder, id) {
    // image is a file
    // eslint-disable-next-line camelcase
    const public_id = await CloudinaryRepo.save(image, folder, id);
    const updatedDoc = await this.model.findByIdAndUpdate({ id }, { image: public_id });
    return updatedDoc;
  }

  async deleteImage(imageId, id) {
    await CloudinaryRepo.delete(imageId);
    await this.model.updateOne({ id }, { image: '' });
  }

  async getAll() {
    const list = await this.model.find();
    return list;
  }
}
