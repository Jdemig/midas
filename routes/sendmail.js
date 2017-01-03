var express = require('express');
var router = express.Router();
var SendGrid  = require('sendgrid-nodejs').SendGrid;
var sendgrid = new SendGrid('fluxteck', 'jdE03121996!');
var message = '';

router.get('/message', function(req, res) {
  res.render('content/contact', { title: 'Midas Gold' });
});

router.use(function(req, res, next) {
  if (req.body.name) {
    message = "<p><strong>From: </strong>" + req.body.name + "<strong> Telephone: </strong>" + req.body.telephone + "<strong> Message: </strong>" + req.body.message + "</p>" ;
  }
  next();
});

router.post(['/message', '/contact'], function (req, res) {
  sendgrid.send({
    to: 'john@midas.gold',
    from: req.body.email,
    subject: req.body.subject,
    html: message
  }, function(err, json) {
    if (err) {
      return console.log(err);
    } else {
      console.log(json);
    }
  });
  res.end();
});

module.exports = router;