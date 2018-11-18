
const express = require('express');

const path = require('path');

require('dotenv').config();

const streamDA = require('./data-access/stream');

const app = express();

const server = app.listen(process.env.PORT);

const io = require('socket.io').listen(server);

const log = require('./services/log');

const errorHandler = require('./services/error-handler')(log);

const validateRequest = require('./services/schema-validator').validateRequest;

const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

app.get('/:lat/:lon', validateRequest('/subscribe'), (req, res) => {
  streamDA.streamLocationTweets(req.params.lat, req.params.lon, io)
    .then(() => {
      res.sendFile(path.join(__dirname, './views/index.html'));
    })
    .catch(errorHandler(res));
});

app.use(express.static(path.join(__dirname, '/views')));

module.exports = server;
