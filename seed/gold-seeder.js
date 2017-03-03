var GoldPrice = require('../models/goldPrice');

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

mongoose.connect('localhost:29131/admin');

var goldPrice = new GoldPrice({
  goldPrice: 1151.00,
  marketCloseDate: "2017-01-03",
  actualDate: "2017-01-03"
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
