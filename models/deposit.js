var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var depositSchema = new Schema({
  _id: { type: Schema.Types.ObjectId },
  amountUsd: { type: Number },
  date: { type: String },
  note: { type: String },
  userAccount: { type: String }
});

module.exports = mongoose.model('Deposit', depositSchema);