var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var depositSchema = new Schema({
  amount: {type: Number},
  date: {type: String},
  note: {type: String},
  userAccount: {type: String}
});

module.exports = mongoose.model('Deposit', depositSchema);