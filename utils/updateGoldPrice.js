var Quandl = require('quandl');
var GoldPrice = require('../models/goldPrice');
var mongoose = require('mongoose');

function updateGoldPrice() {
  return new Promise(function (resolve, reject) {
    var quandl = new Quandl({
      auth_token: '6G3TBFYgbfxf7ikCDhQ7',
      api_version: 3,
    });
    quandl.dataset({
      source: 'LBMA',
      table: 'GOLD'
    }, {
      order: 'asc',
      column_index: 2,
      exclude_column_names: true,
      rows: 1,
    }, function (err, response) {

      if (response) {
        var quandlDataSet = JSON.parse(response).dataset;
        console.log(quandlDataSet.data);

        // Check if most recent value in Quandl is in database
        GoldPrice.findOne({ 'date': quandlDataSet.data[0][0] }, function (err, goldPriceResult) {
          if (!goldPriceResult) {
            var goldPrice = new GoldPrice({
              _id: mongoose.Types.ObjectId(),
              amountUsdPerOunce: quandlDataSet.data[0][1],
              date: quandlDataSet.data[0][0],
            });

            goldPrice.save(function (gpErr, result) {
              if (err) {
                console.log(gpErr);
                reject(err);
              } else {
                resolve(result);
              }
            });
          } else {
            resolve(goldPriceResult);
          }
        });
      } else {
        reject(err);
      }
    });
  });
}

module.exports = updateGoldPrice;