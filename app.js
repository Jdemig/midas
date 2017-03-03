var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressHbs = require('express-handlebars');
var mongoose = require('mongoose');
var session = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');
var validator = require('express-validator');
var MongoStore = require('connect-mongo')(session);
var crypto = require('crypto');
var Quandl = require('quandl');
var CronJob = require('cron').CronJob;
var GoldPrice = require('./models/goldPrice');

var routes = require('./routes/routes');
var user = require('./routes/user');
var admin = require('./routes/admin');
var sendmail = require('./routes/sendmail');

mongoose.Promise = require('bluebird');
mongoose.connect('mongodb://localhost:29131/admin', {server: {poolSize: 12}, user: 'johnwiltbank', pass: 'ForTestingPurposes2016#' } );
require('./config/passport');

var count = 0;

function callCron(time) {
  var job = new CronJob(time, getGoldPrice , null, true, 'America/Los_Angeles');
  job.start();
}
callCron("0 0 9-23 * * *");
callCron("0 30 9,10 * * *");

var app = express();

// view engine setup
app.engine('hbs', expressHbs({defaultLayout: 'layout', extname: 'hbs', layoutDir: __dirname + '/views/layouts'}));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(validator());
app.use(cookieParser());
app.use(session({
  secret: 'mysupersecret',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection}),
  cookie: { maxAge: 6 * 60 * 60 * 1000 }
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {

  var today = new Date();
  var currentTry = 0;
  var count = 0;

  function checkDatabase2(currentTry) {

    var yesterday = new Date().setDate(today.getDate() - currentTry);
    var date = new Date(yesterday).toJSON().slice(0,10);
    //gets the gold price by actual date to display in top right corner of site
    GoldPrice.find({'actualDate': date}, function (err, gold) {
      if (gold.length == 0) {
        if (currentTry > 15) {
          next();
        } else {
          currentTry = currentTry + 1;
          checkDatabase2(currentTry);
        }
      } else {
        app.locals.goldData = gold[0].goldPrice;
        if (decimalPlaces(app.locals.goldData) == 1) {
          app.locals.goldData = app.locals.goldData + "0";
        } else if (decimalPlaces(app.locals.goldData) == 0) {
          app.locals.goldData = app.locals.goldData + ".00";
        }
        next();
      }
    });
  }
  checkDatabase2(currentTry);
});


app.use(function(req, res, next) {
  if (req.isAuthenticated()) {
    app.locals.admin = function() {
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
  }
  res.locals.login = req.isAuthenticated();
  res.locals.session = req.session;
  next();
});

app.use('/', routes);
app.use('/user', user);
app.use('/contact', sendmail);
app.use('/admin', admin);
app.use('/error', function(req, res, next) {
  res.render('error', {footerclass: 'pindown'});
});
app.use(function(req, res, next) {
  res.render('404', {footerclass: 'pindown'});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

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

function newGoldDocument(goldPrice, marketCloseDate, actualDate) {
  GoldPrice.update({ actualDate: actualDate }, 
    {
      $set: {
        goldPrice: goldPrice, 
        marketCloseDate: marketCloseDate,
        actualDate: actualDate
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

function getGoldPrice() {
  var quandl = new Quandl({
    auth_token: '6G3TBFYgbfxf7ikCDhQ7',
    api_version: 3
  });
  quandl.dataset({
      source: 'LBMA',
      table: 'GOLD'
  }, {
    order: 'asc',
    column_index: 2,
    exclude_column_names: true,
    rows: 3
  }, function(err, response) {
    if (response) {
      var actualDate = new Date().toJSON().slice(0, 10);
      var test = JSON.parse(response);

      console.log(test.dataset);
      console.log(actualDate);

      if (test.dataset.end_date == actualDate) {

        console.log('new date');
        if ( typeof test.dataset.data[3] != "undefined") {
          console.log('3');
          newGoldDocument( test.dataset.data[3][1], test.dataset.data[3][0], actualDate );
        } else if ( typeof test.dataset.data[2] != "undefined" ) {
          console.log('2');
          newGoldDocument( test.dataset.data[2][1], test.dataset.data[2][0], actualDate );
        } else if ( typeof test.dataset.data[1] != "undefined" ) {
          console.log('1');
          newGoldDocument( test.dataset.data[1][1], test.dataset.data[1][0], actualDate );
        } else {
          console.log('0');
          newGoldDocument( test.dataset.data[0][1], test.dataset.data[0][0], actualDate );
        }
      
      } else {

        var today = new Date();
        var currentTry = 0;
            count = 0;
        function checkDatabase(currentTry) {

          var yesterday = new Date().setDate(today.getDate() - currentTry);
          var date = new Date(yesterday).toJSON().slice(0,10);
          //gets the gold price by actual date to display in top right corner of site
          GoldPrice.findOne({'actualDate': date}, function (err, gold) {
            console.log(err);
            console.log(gold);
            if (gold == null) {
              if (currentTry > 15) {
                console.log(err);
              } else {
                currentTry = currentTry + 1;
                checkDatabase(currentTry);
              }
            } else {
              console.log(actualDate);
              var goldPrice = gold.goldPrice;
              var marketCloseDate = gold.marketCloseDate;
              newGoldDocument(goldPrice, marketCloseDate, actualDate);
            }
          });
        }
        checkDatabase(currentTry);
      }
    }
  });
}