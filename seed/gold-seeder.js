var GoldPrice = require('../models/goldPrice');

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

mongoose.connect('localhost:29131/admin');

var goldPrice = new GoldPrice({
  goldPrice: 1145.90,
  marketCloseDate: "2016-12-29",
  actualDate: "2016-12-30"
});

goldPrice.save(function(err) {
  if (err) {
    console.log(err);
  } else {
    exit();
  }
});

function exit() {
  mongoose.disconnect();
}
