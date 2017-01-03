var User = require('../models/user');

var mongoose = require('mongoose');

mongoose.connect('localhost:29131/admin');




User.update({'email': 'jonathan.emig@gmail.com'}, 
  {
    $set: {
      accessToken: '142d2dd8ac0a7e9d82614e50d0494e52638803b4334ce96cad57e92588cd88b6bbd2d48c66b27677891fd940d2fed459641cc327e6c27856186fb5a8686934c95d7a755279eb4a03b543a0f0fa2ed8ea'
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


