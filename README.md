# midas

Project built back in 2016.

Midas.gold was intended to be a gold backed banking startup that would allow people to use a credit card to purchase items with gold.

We used Plaid to communicate with a bank so that every transaction that went through the bank account would trigger a transaction in Midas subtracting the amount of gold that the account owned.

Quandl was used to keep track of gold in realtime.

## Setup

To get this project working on your own machine follow the steps below.

You'll need to install MongoDB and make sure that the `mongod` service is running.

Once you've done that you should be able to seed the database by typing `node ./seed/defaultseeder.js`.

Then you can start the server with `node ./bin/www`. You can login and view the transactions and account balance by using the username: test.user@gmail.com and password: asdf1234


