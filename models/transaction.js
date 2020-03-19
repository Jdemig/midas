var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var transactionSchema = new Schema({
  // Not used but there for consistency
  _id: { type: Schema.Types.ObjectId, required: true },
  // All transactions are associated with an account therefore...
  _accountId: { type: Schema.Types.ObjectId, required: true },
  // Every transaction in the database should have an associated gold price
  _goldPriceId: { type: Schema.Types.ObjectId, required: true },
  number: { type: String },
  amountUsd: { type: Number, required: true },
  amountGoldOunces: { type: Number, required: true },
  date: { type: String, required: true },
  name: { type: String, required: true },
});

module.exports = mongoose.model('Transaction', transactionSchema);