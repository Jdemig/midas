var Deposit = require('../models/deposit');

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

mongoose.connect('localhost:29131/admin');



var deposit = new Deposit({
  amount: 1.067823,
  date: "2016-12-09",
  note: "Write any string here"
});


deposit.save(function(err) {
  if (err) {
    console.log(err);
  } else {
    exit();
  }
});



function exit() {
  mongoose.disconnect();
}