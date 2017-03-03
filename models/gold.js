var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var goldSchema = new Schema({
  goldPrice: {type: Number},
  date: {type: String}
});

module.exports = mongoose.model('Gold', goldSchema);