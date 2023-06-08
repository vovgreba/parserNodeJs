import mongoose from 'mongoose';


      
const cottageSchema = new mongoose.Schema({
  title: String,
  location: String,
  pricePerDay: String,
  imagesLinks: [String],
  cottage: {
    type: String,
    required: false
  },
  food: {
    type: String,
    required: false
  },
  serviceIncluded: {
    type: String,
    required: false
  },
  activities: {
    type: String,
    required: false
  },
  mobileCoverage: String,
  foreignLanguages: {
    type: String,
    required: false
  },
  karpatyInfo: {
    type: String,
    required: false
  },
  contacts: String,
  gps: String,
  reviews: {
    type: String,
    required: false
  },
  description: String
});

const Cottage = mongoose.model('Cottage', cottageSchema);

export default Cottage;