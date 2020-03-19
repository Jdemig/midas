var User = require('../models/user');
var Transaction = require('../models/transaction');
var Account = require('../models/account');
var plaid = require('plaid');

var plaidClient = new plaid.Client('57b8c32566710877408d0926', '3517a0ad2d25dd28df2b88be6c492e', 'd943a8cb8eac322a16a27de2e02a8d', plaid.environments.sandbox);

var updateGoldPrice = require('../utils/updateGoldPrice');

var mongoose = require('mongoose');

mongoose.Promise = require('bluebird');


mongoose.connect('localhost:27017/midas', function () {
  var userId = mongoose.Types.ObjectId();
  var accountId = mongoose.Types.ObjectId();
  var transactionId = mongoose.Types.ObjectId();

  mongoose.connection.db.dropDatabase();


  var todaysDate = new Date().toJSON().slice(0, 10);
  console.log(todaysDate);
  plaidClient.sandboxPublicTokenCreate('ins_109511', ['transactions'], function (err, createResponse) {
    var publicToken = createResponse.public_token;
    plaidClient.exchangePublicToken(publicToken, function (err, exchangeResponse) {
      var accessToken = exchangeResponse.access_token;
      var transactionCount = 10;
      plaidClient.getTransactions(accessToken, '2018-01-01', todaysDate, { count: transactionCount, offset: 0 }, function (err, transactionResult) {

        // updateGoldPrice retrieves the latest gold price from Quandl database and puts it in our database then returns the latest goldPrice object
        updateGoldPrice().then(function (goldPrice) {
          console.log(goldPrice);

          var user = new User({
            _id: userId,
            email: "test.user@gmail.com",
          });
          user.password = user.encryptPassword('asdf1234');

          var account = new Account({
            _id: accountId,
            _userId: userId,
            // The ID of the last transaction that updated the account balance. This way we know if the account balance is current
            _lastUpdatedTransactionId: transactionId,
            name: transactionResult.accounts[0].name,
            balance: {
              available: transactionResult.accounts[0].balances.available / goldPrice.amountUsdPerOunce,
              current: transactionResult.accounts[0].balances.current / goldPrice.amountUsdPerOunce,
            },
          })

          console.log(25.0 / goldPrice.amountUsdPerOunce);

          var transactions = [];
          for (var i = 0; i < transactionCount; i++) {
            transactions.push(
              new Transaction({
                _id: i === 0 ? transactionId : mongoose.Types.ObjectId(),
                _accountId: accountId,
                _goldPriceId: goldPrice._id,
                amountUsd: transactionResult.transactions[i].amount,
                amountGoldOunces: transactionResult.transactions[i].amount / goldPrice.amountUsdPerOunce,
                name: transactionResult.transactions[i].name,
                date: transactionResult.transactions[i].date,
              })
            )
          }
          /*
          var transactions = [
            new Transaction({
              _id: transactionId,
              _accountId: accountId,
              _goldPriceId: goldPrice._id,
              amountUsd: transactionResult.transactions[0].amount,
              amountGoldOunces: transactionResult.transactions[0].amount / goldPrice.amountUsdPerOunce,
              name: transactionResult.transactions[0].name,
              date: transactionResult.transactions[0].date,
            }),
            new Transaction({
              _id: mongoose.Types.ObjectId(),
              _accountId: accountId,
              _goldPriceId: goldPrice._id,
              amountUsd: transactionResult.transactions[1].amount,
              amountGoldOunces: transactionResult.transactions[1].amount / goldPrice.amountUsdPerOunce,
              name: transactionResult.transactions[1].name,
              date: transactionResult.transactions[1].date,
            }),
            new Transaction({
              _id: mongoose.Types.ObjectId(),
              _accountId: accountId,
              _goldPriceId: goldPrice._id,
              amountUsd: transactionResult.transactions[2].amount,
              amountGoldOunces: transactionResult.transactions[2].amount / goldPrice.amountUsdPerOunce,
              name: transactionResult.transactions[2].name,
              date: transactionResult.transactions[2].date,
            }),
          ];
          */


          user.save(function (err, userResult) {
            if (err) {
              console.log(err);
            } else {
              console.log(userResult);
              account.save(function (err, accountResult) {
                if (err) {
                  console.log(err);
                } else {
                  console.log(accountResult);
                  Transaction.collection.insert(transactions, function (err, transactionsResult) {
                    if (err) {
                      console.log(err)
                    } else {
                      console.log(transactionsResult);
                      mongoose.disconnect();
                    }
                  });
                }
              })
            }
          });
        });
      })
    });
  });
});