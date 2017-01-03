var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var goldPriceSchema = new Schema({
  goldPrice: {type: Number},
  marketCloseDate: {type: String},
  actualDate: {type: String}
});

module.exports = mongoose.model('GoldPrice', goldPriceSchema);