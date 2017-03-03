var User = require('../models/user');

var mongoose = require('mongoose');

mongoose.connect('localhost:29131/admin');




User.update({'email': 'johnwiltbank@yahoo.com'}, 
  {
    $set: {
      accessToken: '142d2dd8ac0a7e9d82614e50d0494e52efd2cb91043206e28255df03d2ca1bcc98e2d6f13b760c5a9241c2f87ac8f8344803efd5fd9e070b62707394f3c41c956c5d98b4286b2cd1cb37d579f58cf3c9'
    }
  }, {
    multi: false
  },
  function(err, result) {
    console.log(err);
    console.log(result);
    mongoose.disconnect();
  }
);


