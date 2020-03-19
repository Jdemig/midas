var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var User = require('../models/user');
var Deposit = require('../models/deposit');
var Transaction = require('../models/transaction');
var GoldPrice = require('../models/goldPrice');
var mongoose = require('mongoose');

var csrfProtection = csrf();
router.use(csrfProtection);

router.get('/admin', isAdmin, function (req, res) {
  res.render('admin/admin', { title: 'Admin', csrfToken: req.csrfToken() });
});

router.get('/overview', isAdmin, function (req, res) {
  res.render('admin/overview', { title: 'Overview', csrfToken: req.csrfToken() });
});

router.post('/deposit', isAdmin, function (req, res) {
  var email = req.body.email;
  var depositAmount = parseFloat(req.body.depositAmount);
  var note = req.body.note;
  var date = req.body.date;

  console.log(email);
  console.log(depositAmount);
  console.log(date);

  User.findOne({ 'email': email }, function (err, user) {
    if (!err) {
      GoldPrice.findOne({ 'actualDate': date }, function (err, gold) {
        var depositAmountInOunces = roundNthDigUp((depositAmount / gold.goldPrice), 1000000);
        var deposit = new Deposit({
          amount: depositAmountInOunces,
          date: date,
          note: note
        });
        deposit.save(function (err) {
          if (err) {
            console.log(err);
          } else {
            var transaction = new Transaction({
              _id: mongoose.Types.ObjectId(),
              _account: user.userAccount[0]._id,
              amountInOunces: -depositAmountInOunces,
              amount: -depositAmount,
              date: date,
              name: "DEPOSIT"
            });
            transaction.save(function (err) {
              if (err) {
                console.log(err);
              } else {
                res.redirect('/user/account');
              }
            });
          }
        });
      });
    }
  });
});

router.post('/ounceConversion', function (req, res) {
  var userId = req.user._id;
  var selector = parseInt(req.body.selector);
  console.log(typeof selector);

  User.update({ '_id': userId },
    {
      $set: {
        conversionSelector: selector
      }
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        if (result.nModified == 1) {
          res.redirect('/user/account');
        } else {
          res.redirect('/user/account');
        }
      }
    }
  );
});


module.exports = router;

function isAdmin(req, res, next) {
  if (req.isAuthenticated()) {
    switch (req.user.email) {
      case 'jonathan.emig@gmail.com':
        return next();
        break;
      case 'john@vcn.com':
        return next();
        break;
      default:
        res.redirect('/');
        break;
    }
  } else {
    res.redirect('/');
  }
}

function roundNthDigUp(num, nth) {
  num = num * nth;
  num = Math.ceil(num);
  num = num / nth;
  return num;
}