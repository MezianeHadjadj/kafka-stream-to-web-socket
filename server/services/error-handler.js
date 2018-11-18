
const errors = {
  ProducerError: 2,
  ProducerDisconnected: 3,
  ConsumerError: 4,
  ConsumerDisconnected: 5,
};

module.exports = logger => res =>
  (err) => {
    if (errors[err.message]) {
      res.status(200).json({
        success: false,
        message: err.message,
        error: errors[err.message],
        validationErrors: err.message === 'InvalidRequest' ? err.validationErrors : null,
      });
    } else {
      logger.error(`time: ${Date()}, error running query`, err);
      res.status(500).json({
        success: false,
        message: 'UnknownError',
        error: 0,
      });
    }
  };
