var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var userSchema = new Schema({
  email: {type: String, required: true},
  password: {type: String, required: true},
  resetPasswordToken: {type: String, required: false},
  resetPasswordExpires: {type: Date, required: false},
  accessToken: {type: String, required: false},
  userAccount: {type: Array, required: false},
  balanceInOunces: {type: Number, required: false},
  transactionIds: {type: Array, required: false},
  conversionSelector: {type: Number, require: false}
});

userSchema.methods.encryptPassword = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);
};

userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);