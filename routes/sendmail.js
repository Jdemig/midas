var sgMail = require('@sendgrid/mail');
var emailTemplate = require('./email/emailTemplate');
var express = require('express');
var router = express.Router();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);



router.get('/message', function(req, res) {
  res.render('content/contact', { title: 'Midas Gold' });
});

router.post(['/message', '/contact'], function (req, res) {
  const emails = [
    {
      to: 'hello@fluxtech.co',
      from: {
        email: req.body.email,
        name: req.body.name,
      },
      subject: 'Midas Gold Software Development',
      html: `
        <div>
          <p><strong>Message: </strong>${req.body.message}</p>
          <p><strong>Phone: </strong>${req.body.phone}</p>
          <p><strong>Company: </strong>${req.body.company}</p>
          <p><strong>Website: </strong>${req.body.website}</p>
          <p><strong>Budget: </strong>${req.body.budget}</p>
          <p>Sent from fluxtech.co</p>
        </div>
      `,
    },
    {
      to: req.body.email,
      from: { email: 'hello@fluxtech.co', name: 'Flux Tech' },
      subject: 'Midas Gold Software Development',
      text: `Hi ${
        req.body.name
      },\n\nThanks for messaging us! This reponse is just a robot letting you know that we got your email. A real person will contact you as soon as possible. It usually takes us about 24 hours to get back to emails.\n\nThanks!\nFlux Tech, LLC\n928 Timber Ln, Fort Collins, CO\n(850) 739-4302`,
      html: emailTemplate(),
    },
  ];

  sgMail
    .send(emails)
    .then(() => res.send({ status: 'OK' }))
    .catch(err => res.send(err));

  res.end();
});

module.exports = router;