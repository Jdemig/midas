"use strict"

var express = require('express');
var router = express.Router();
var csrf = require('csurf');

var csrfProtection = csrf();
router.use(csrfProtection);

/* GET home page. */
router.get('/', notLoggedIn, function(req, res, next) {
  var messages = req.flash('error');
  res.render('user/entervault', {title: 'Vault', csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0});
});
router.get('/intro', function(req, res) {
  res.render('content/intro', { title: 'Midas Gold' });
});
router.get('/sign-up', function(req, res) {
  res.render('user/signup', { title: 'Midas Gold' });
});
router.get('/blog', function(req, res) {
  res.render('content/blog', { title: 'Midas Gold' });
});



module.exports = router;


//check if logged in middleware
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/user/signup');
  }
}

function notLoggedIn(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/user/account');
  }
}