"use strict";

var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');
var Account = require('../models/account');
var Transaction = require('../models/transaction');

// var plaidClient = new plaid.Client('57b8c32566710877408d0926', '3517a0ad2d25dd28df2b88be6c492e', plaid.environments.tartan);

var csrfProtection = csrf();
router.use(csrfProtection);

router.use(function (req, res, next) {
  res.locals.admin = function () {
    var admin = false;
    switch (req.user.email) {
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

router.get('/logout', isLoggedIn, function (req, res) {
  req.logout();
  res.redirect('/');
});

router.get('/account', isLoggedIn, function (req, res) {
  var userId = req.user._id;
  Account.findOne({ '_userId': userId }, function (err, account) {
    Transaction.find({ '_accountId': account._id }, function (err, transactions) {
      var accounts = [account];

      res.render('user/account', {
        title: 'User Account',
        accounts: accounts,
        transactions: transactions,
        isAdmin: res.locals.admin(),
      });
    });
  });
});


router.get('/entervault', notLoggedIn, function (req, res) {
  var messages = req.flash('error');
  res.render('user/entervault', { title: 'Vault', csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0 });
});
router.post('/entervault', notLoggedIn, passport.authenticate('local.signin', {
  successRedirect: '/user/account',
  failureRedirect: '/user/entervault',
  failureFlash: true,
}));

router.get('/signup', notLoggedIn, function (req, res) {
  var messages = req.flash('error');
  res.render('user/signup', { title: 'Sign Up', csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0 });
});
router.post('/signup', notLoggedIn, passport.authenticate('local.signup', {
  successRedirect: '/user/account',
  failureRedirect: '/user/signup',
  failureFlash: true,
}));

module.exports = router;

// check if logged in middleware
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