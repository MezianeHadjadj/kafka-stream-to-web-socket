'user strict';

const BluebirdPromise = require('bluebird');

const log = require('../services/log');

require('dotenv').config();
const TwitterLib = require('twit');

const GpsUtil = require('gps-util');

const Twitter = new TwitterLib({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const kafka = require('node-rdkafka');

const produceTwitterStream = (lat, lon) => {
  const producer = new kafka.Producer({
    'metadata.broker.list': process.env.KAFKA_SERVER_URL,
    dr_cb: true,
  });
  const topicName = `${lat}-${lon}`;
  producer.on('event.error', (err) => {
    log.error(`Producer failed: ${err}`);
    throw new Error('ProducerError');
  });

  producer.on('ready', (arg) => {
    console.log(`producer ready. ${JSON.stringify(arg)}`);
    let boundingBox = GpsUtil.getBoundingBox(parseFloat(lat), parseFloat(lon), 500);
    boundingBox = [JSON.stringify(boundingBox[0].lng), JSON.stringify(boundingBox[0].lat),
      JSON.stringify(boundingBox[1].lng), JSON.stringify(boundingBox[1].lat)];
    Twitter.stream('statuses/filter', { locations: boundingBox })
    .on('tweet', (tweet) => {
      producer.produce(topicName, -1, new Buffer(tweet.text));
    });
  });


  producer.on('disconnected', (arg) => {
    log.error(`Producer disconnected: ${arg}`);
    throw new Error('ProducerDisconnected');
  });

  producer.connect();
};

const subscribeToDelayedStream = (lat, lon, io) => {
  const consumer = new kafka.KafkaConsumer({
    'metadata.broker.list': process.env.KAFKA_SERVER_URL,
    'group.id': 'node-rdkafka-consumer-flow-example',
    'enable.auto.commit': false,
  });
  const topicName = `${lat}-${lon}`;
  consumer.on('event.error', (err) => {
    log.error(`Consumer failed: ${err}`);
    throw new Error('ConsumerError');
  });

  consumer.on('ready', (arg) => {
    console.log(`consumer ready. ${JSON.stringify(arg)}`);
    consumer.subscribe([topicName]);
    consumer.consume();
  });


  consumer.on('data', (data) => {
    io.sockets.emit(JSON.stringify(topicName), data.value.toString());
  });

  consumer.on('disconnected', (arg) => {
    log.error(`Consumer disconnected: ${arg}`);
    throw new Error('ConsumerDisconnected');
  });
  consumer.connect();
};

const streamLocationTweets = (lat, lon, io) =>
  BluebirdPromise.resolve()
  .then(() => {
    produceTwitterStream(lat, lon);
  })
  .then(() => subscribeToDelayedStream(lat, lon, io));

module.exports = {
  streamLocationTweets,
};
