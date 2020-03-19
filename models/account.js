var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var accountSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  _userId: { type: Schema.Types.ObjectId, required: true },
  _lastUpdatedTransactionId: { type: Schema.Types.ObjectId, required: true },
  meta: { type: Object },
  name: { type: String, required: true },
  balance: {
    available: { type: Number },
    current: { type: Number },
  },
});


module.exports = mongoose.model('Account', accountSchema);