var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var goldPriceSchema = new Schema({
  // _id is not always used but there for consistency sake
  _id: { type: Schema.Types.ObjectId, required: true },
  amountUsdPerOunce: { type: Number, required: true },
  date: { type: String, required: true },
});

module.exports = mongoose.model('GoldPrice', goldPriceSchema);