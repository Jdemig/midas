var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var transactionSchema = new Schema({
  _account: {type: String},
  _id: {type: String},
  number: {type: String},
  amount: {type: String},
  amountInOunces: {type: String},
  balanceAfterTransaction: {type: String},
  date: {type: String},
  name: {type: String},
  meta: {type: Object},
  pending: {type: Boolean},
  type: {type: Object},
  category: {type: Array},
  category_id: {type: String},
  score: {type: Object}
});

module.exports = mongoose.model('Transaction', transactionSchema);