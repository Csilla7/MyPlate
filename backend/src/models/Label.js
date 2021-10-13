import mongoose from 'mongoose';

const LabelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['diet', 'health'],
  },
  description: {
    type: String,
    required: true,
  },
});

const Label = mongoose.model('Label', LabelSchema);

export default Label;
