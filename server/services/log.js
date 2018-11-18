
const bunyan = require('bunyan');

const log = bunyan.createLogger({
  name: 'Streaming',
  level: 'debug',
});

module.exports = log;
