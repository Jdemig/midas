"use strict";

var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');
var plaid = require('plaid');
var User = require('../models/user');
var GoldPrice = require('../models/goldPrice');
var Transaction = require('../models/transaction');
var app = require('../app');
var Promise = require('bluebird');

var plaidClient = new plaid.Client('57b8c32566710877408d0926', '3517a0ad2d25dd28df2b88be6c492e', plaid.environments.tartan);

var csrfProtection = csrf();
router.use(csrfProtection);

router.use(function(req, res, next) {
  res.locals.admin = function() {
    var admin = false;
    switch(req.user.email) {
      case 'jonathan.emig@gmail.com':
        admin = true;
        break;
      case 'john@vcn.com':
        admin = true;
        break;
      default:
        break;
    }
    return admin;
  }
  next();
});

router.get('/logout', isLoggedIn, function(req, res, next) {
  req.logout();
  res.redirect('/');
});

router.get('/account', isLoggedIn, function(req, res) {
  var accountsFromPlaid,
      transactionsFromPlaid,
      transactions,
      balanceInOunces,
      transactionIds,
      units,
      multiplier;

  var unitObj = {};

  var userId = req.user._id;

  plaidClient.getConnectUser(req.user.accessToken, {}, function(err, response) {
    if (response) {

      console.log('rendered from plaid');

      transactionsFromPlaid = response.transactions;
      accountsFromPlaid = [response.accounts[0]];

      matchAndUpdateTransactions(res, req, transactionsFromPlaid, accountsFromPlaid)
        .then(function(response) {
          return getTransactions(req, transactionsFromPlaid);
        })
        .then(function(response) {
          req.user.transactions = response;
          console.log(req.user);
          console.log('hello1');
          multiplier = getMultiplier(req);
          console.log('hello2');
          return updateBalance(req);
        })
        .then(function(response) {
          balanceInOunces = response;
          console.log('hello3');
          return transactionMultiplier(req, multiplier);
        })
        .then(function(response) {
          transactions = response;
          console.log('hello4');
          return getUnits(userId);
        })
        .then(function(response) {
          units = response;
          switch(units) {
            case "ounces":
              unitObj.ounces = "selected";
              break;
            case "milliounces":
              unitObj.milliounces = "selected";
              break;
            case "grams":
              unitObj.grams = "selected";
              break;
            default:
              break;
          }
          console.log('hello5');

          return sortTransactions(transactions);
        })
        .then(function(response) {
          transactions = response;

          res.render('user/account', {title: 'User Account', csrfToken: req.csrfToken(),
            accounts: accountsFromPlaid,
            transactions: transactions,
            balanceInOunces: fixPrecision(balanceInOunces * multiplier),
            units: units,
            unitObj: unitObj,
            isAdmin: res.locals.admin()
          });

        }); //updates database


    } else {

      console.log('rendered from database');

      User.findOne({'_id': userId}, function (err, user) {
        if (typeof user.userAccount[0] == "undefined") {
          res.render('user/account', {title: 'User Account'});
        } else {
          Transaction.find({'_account': user.userAccount[0]._id}, function(err, transactions) {

            var balanceInOunces = user.balanceInOunces;
            var accounts = user.userAccount;
            var transactions = transactions;

            getUnits(userId).then(function(response) {
              units = response;
              return getMultiplier(userId);
            }).then(function(response) {
              multiplier = response;
              return transactionMultiplier(req, multiplier);
            }).then(function(response) {
              transactions = response;
              balanceInOunces = roundNthDigUp(balanceInOunces, 1000000);
              res.render('user/account', {title: 'User Account',
                accounts: accounts,
                transactions: transactions,
                balanceInOunces: fixPrecision(balanceInOunces * multiplier),
                units: units,
                isAdmin: res.locals.admin()
              });
            });

          });
        }
      });
    }
  });
});

router.use('/', notLoggedIn, function(req, res, next) {
  next();
});

router.get('/entervault', function(req, res, next) {
  var messages = req.flash('error');
  res.render('user/entervault', {title: 'Vault', csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0});
});
router.post('/entervault', passport.authenticate('local.signin', {
  successRedirect: '/user/account',
  failureRedirect: '/user/entervault',
  failureFlash: true
}));

router.get('/signup', function(req, res) {
  var messages = req.flash('error');
  res.render('user/signup', {title: 'Sign Up', csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0});
});
router.post('/signup', passport.authenticate('local.signup', {
  successRedirect: '/user/account',
  failureRedirect: '/user/signup',
  failureFlash: true
}));

module.exports = router;

//check if logged in middleware
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/user/entervault');
  }
}

function notLoggedIn(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/');
  }
}

function transactionUpdate(j, transactionsFromPlaid) {
  var transactions = transactionsFromPlaid;
  Transaction.update({'_id': transactions[j]._id}, 
    {
      $set: {
        _account: transactions[j]._account,
        _id: transactions[j]._id,
        amount: transactions[j].amount,
        amountInOunces: transactions[j].amountInOunces || "Unknown",
        date: transactions[j].date,
        name: transactions[j].name,
        meta: transactions[j].meta,
        pending: transactions[j].pending,
        type: transactions[j].type,
        category: transactions[j].category,
        category_id: transactions[j].category_id,
        score: transactions[j].score
      }
    }, {
      upsert: true
    }, function(err, result) {
      if (err) {
        console.log(err);
      } 
    }
  );
}

function updateBalanceAfterTransaction(req, j, resolve) {
  var transactions = req.user.transactions;
  console.log(req.user.balanceInOunces);
  Transaction.update({'_id': transactions[j]._id}, 
    {
      $set: {
        balanceAfterTransaction: req.user.balanceInOunces
      }
    }, {
      upsert: true
    }, function(err, result) {
      if (err) {
        console.log(err);
      } 
      updateUser(req, j, resolve);
    }
  );
}

function transactionMultiplier(req, multiplier) {

  var transactions = req.user.transactions;

  return new Promise(function(resolve, reject) {

    function nextTransaction(i) {
      if (i < (transactions.length) ) {
        if (transactions[i].amountInOunces != "Unknown") {
          transactions[i].amountInOunces = fixPrecision(transactions[i].amountInOunces * multiplier);
          transactions[i].balanceAfterTransaction = fixPrecision(transactions[i].balanceAfterTransaction * multiplier);
          if (req.user.conversionSelector != 1) {
            transactions[i].amountInOunces = trailingZeros(transactions[i].amountInOunces, 6);
            transactions[i].balanceAfterTransaction = trailingZeros(transactions[i].balanceAfterTransaction, 6);
          } else {
            transactions[i].amountInOunces = trailingZeros(transactions[i].amountInOunces, 3);
            transactions[i].balanceAfterTransaction = trailingZeros(transactions[i].balanceAfterTransaction, 3);
          }
          i++;
          nextTransaction(i);
        } else {
          i++;
          nextTransaction(i);
        }
      } else {
        resolve(transactions);
      }
    }
    nextTransaction(0);

  });

}

function matchAndUpdateTransactions(res, req, transactionsFromPlaid, accountsFromPlaid) {

  return new Promise(function(resolve, reject) {

    User.update({'_id': req.user._id},
      {
        $set: {
          userAccount: accountsFromPlaid
        }
      }, function(err, result) {
        findDate(0);
      }
    );

    function findDate(i) {
      var date = transactionsFromPlaid[i].date;
      //runs through all transaction dates to find a matching date in the GoldPrice collection
      //if there is a match it will calculate the amountInOunces
      User.findOne({'_id': req.user._id}, function (err, user) {

        //ensure there are two decimal places on amount
        if (decimalPlaces(transactionsFromPlaid[i].amount) == 1) {
          transactionsFromPlaid[i].amount = transactionsFromPlaid[i].amount + "0";
        }

        //find a matching date in gold database
        GoldPrice.find({'actualDate': date}, function (err, gold) {
          if (gold.length == 0) {
            transactionUpdate(i, transactionsFromPlaid);
            if (i < (transactionsFromPlaid.length - 1)) {
              i++;
              findDate(i);
            } else {
              resolve();
            }
          } else {
            var ounces = ( transactionsFromPlaid[i].amount / gold[0].goldPrice );
            transactionsFromPlaid[i].amountInOunces = roundNthDigUp(ounces, 1000000);
            transactionUpdate(i, transactionsFromPlaid);
            if (i < (transactionsFromPlaid.length - 1)) {
              i++;
              findDate(i);
            } else {
              resolve();
            }
          }
        });
      });
    }
  });
}

function updateBalance(req) {
  return new Promise(function(resolve, reject) {
    goThroughTransactions(req, 0, resolve);
  });
}


function goThroughTransactions(req, i, resolve) {
  var match = false;
  var transactions = req.user.transactions;
  var balanceInOunces = req.user.balanceInOunces;
  for (var j = 0; j < (req.user.transactionIds.length); j++) {
    if (req.user.transactionIds[j] == req.user.transactions[i]._id) {
      match = true;
    }
  }
  if (match == false) {
    if (req.user.transactions[i].amountInOunces != "Unknown") {
      balanceInOunces = balanceInOunces - transactions[i].amountInOunces;
      req.user.balanceInOunces = roundNthDigUp(balanceInOunces, 1000000);
      req.user.transactionIds.push(transactions[i]._id);
      updateBalanceAfterTransaction(req, i, resolve);
    } else {
      updateUser(req, i, resolve);
    }
  } else {
    if (i < (transactions.length - 1)) {
      i++
      goThroughTransactions(req, i, resolve);
    } else {
      console.log(balanceInOunces);
      resolve(balanceInOunces);
    }
  }
}

function updateUser(req, i, resolve) {
  var balanceInOunces = req.user.balanceInOunces;
  var transactions = req.user.transactions;
  User.update({'_id': req.user._id},
    {
      $set: {
        balanceInOunces: balanceInOunces,
        transactionIds: req.user.transactionIds
      }
    }, function(err, result) {
      if (err) {
        console.log(err);
      } else {
        if (i < (transactions.length - 1)) {
          i++
          goThroughTransactions(req, i, resolve);
        } else {
          console.log(balanceInOunces);
          resolve(balanceInOunces);
        }
      }
    }
  );
}

function trailingZeros(num, digits) {
  var number = Number(num);
  var zeroes = digits - decimalPlaces(number);
  function addZeroes(num, zeroes) {
    for (var j = 0; j < zeroes; j++) {
      num = num + "0";
    }
    return num;
  }
  return addZeroes(num, zeroes);
}


function roundNthDigUp(num, nth) {
  num = num * nth;
  num = Math.ceil(num);
  num = num / nth;
  return num;
}

function fixPrecision(num) {
  num = num * 1000000;
  num = Math.round(num);
  num = num / 1000000;
  return num;
}

function sortTransactions(transactions) {
  return new Promise(function(resolve, reject) {
    function howToSort(a, b) {
      a = dateToNum(a.date);
      b = dateToNum(b.date);
      if (b < a) {
        return -1;
      } else if (b > a) {
        return 1;
      } else {
        return 0;
      }
    };
    resolve(transactions.sort(howToSort));

  });
}

function getMultiplier(req) {
  var multiplier;
  switch(req.user.conversionSelector) {
    case 0:
      multiplier = 1;
      break;
    case 1:
      multiplier = 1000;
      break;
    case 2:
      multiplier = 31.1034768;
      break;
    default:
      break;
  }
  return multiplier;
}

function getUnits(userId) {
  return new Promise(function(resolve, reject) {
    User.findOne({'_id': userId}, function (err, user) {
      var units;
      switch(user.conversionSelector) {
        case 0:
          units = "ounces";
          break;
        case 1:
          units = "milliounces";
          break;
        case 2:
          units = "grams";
          break;
        default:
          break;
      }
      resolve(units);
    });
  });
}

function getTransactions(req, transactionsFromPlaid) {
  return new Promise(function(resolve, reject) {
    User.findOne({'_id': req.user._id}, function (err, user) {
      if (typeof user.userAccount[0] == "undefined") {
        resolve(transactionsFromPlaid);
      } else {
        Transaction.find({'_account': user.userAccount[0]._id}, function(err, transactions) {
          resolve(transactions);
        });
      }
    });
  });
}

//this function returns the number of digits after the decimal place
function decimalPlaces(num) {
  var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  if (!match) { return 0; }
  return Math.max(
       0,
       // Number of digits right of decimal point.
       (match[1] ? match[1].length : 0)
       // Adjust for scientific notation.
       - (match[2] ? +match[2] : 0));
}

function dateToNum(date) {
  var year = parseInt(date.slice(0,4));
  var month = parseInt(date.slice(5,7));
  var day = parseInt(date.slice(8,10));
  year = (year - 1970) * 365 * 24 * 60 * 60 * 1000;
  month = parseInt((month - 1) * 30.42 * 24 * 60 * 60 * 1000);
  day = day * 24 * 60 * 60 * 1000;
  return (day + month + year);
}