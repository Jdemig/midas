var express = require('express');
var path = require('path');
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
var CronJob = require('cron').CronJob;

var updateGoldPrice = require('./utils/updateGoldPrice');
var GoldPrice = require('./models/goldPrice');
var routes = require('./routes/routes');
var user = require('./routes/user');
var admin = require('./routes/admin');
var sendmail = require('./routes/sendmail');

mongoose.Promise = require('bluebird');
mongoose.connect('localhost:27017/midas');
require('./config/passport');


function callCron(time) {
  var job = new CronJob(time, updateGoldPrice, null, true, 'America/Los_Angeles');
  job.start();
}
callCron("0 0 9-23 * * *");
callCron("0 30 9,10 * * *");

var app = express();

// view engine setup
app.engine('hbs', expressHbs({ defaultLayout: 'layout', extname: 'hbs', layoutDir: __dirname + '/views/layouts' }));
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
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
  cookie: { maxAge: 6 * 60 * 60 * 1000 }
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
  var today = new Date();
  var currentTry = 0;

  function checkDatabase(currentTry) {
    var yesterday = new Date().setDate(today.getDate() - currentTry);
    var date = new Date(yesterday).toJSON().slice(0, 10);
    // gets the gold price by actual date to display in top right corner of site
    GoldPrice.find({ 'date': date }, function (err, gold) {
      console.log(gold);
      if (gold.length == 0) {
        if (currentTry > 15) {
          next();
        } else {
          currentTry = currentTry + 1;
          checkDatabase(currentTry);
        }
      } else {
        app.locals.goldData = gold[0].amountUsdPerOunce;
        if (decimalPlaces(app.locals.goldData) == 1) {
          app.locals.goldData = app.locals.goldData + "0";
        } else if (decimalPlaces(app.locals.goldData) == 0) {
          app.locals.goldData = app.locals.goldData + ".00";
        }
        next();
      }
    });
  }
  checkDatabase(currentTry);
});


app.use(function (req, res, next) {
  if (req.isAuthenticated()) {
    app.locals.admin = function () {
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
  }
  res.locals.login = req.isAuthenticated();
  res.locals.session = req.session;
  next();
});

app.use('/', routes);
app.use('/user', user);
app.use('/contact', sendmail);
app.use('/admin', admin);
app.use('/error', function (req, res) {
  res.render('error', { footerclass: 'pindown' });
});
app.use(function (req, res) {
  res.render('404', { footerclass: 'pindown' });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

//this function returns the number of digits after the decimal place
function decimalPlaces(num) {
  var match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  if (!match) { return 0; }
  return Math.max(0, /* Number of digits right of decimal point. */(match[1] ? match[1].length : 0) /* Adjust for scientific notation. */ - (match[2] ? +match[2] : 0));
}