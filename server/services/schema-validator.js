
const fs = require('fs');

const path = require('path');

const jsonSchema = require('jsonschema');

const BluebirdPromise = require('bluebird');

const log = require('../services/log');

const requireDir = require('require-dir');

const validator = new (jsonSchema.Validator)();

const endpointSchemas = requireDir(path.join(__dirname, '/../schemas/endpoints'));


// loading enpoint schemas
BluebirdPromise.map(Object.keys(endpointSchemas), (name) => {
  const filePath = path.join(`${__dirname}/../schemas/endpoints`, `${name}.json`);
  const stat = fs.statSync(filePath);
  if (stat.isFile()) {
    validator.addSchema(endpointSchemas[name]);
  }
});

const validateRequest = (schema, checkRequired = true) =>
  (req, res, next) => {
    const validation = validator.validate(req.params || req.body, schema);
    log.info(`Validating request for schema: ${schema}`);
    // filtering out 'required' type of errors
    if (!checkRequired) {
      validation.errors = validation.errors.filter(error => error.name !== 'required');
    }

    if (validation.errors.length > 0) {
      log.error(validation.errors);
      res.status(200).json({
        success: false,
        message: 'InvalidSchemaRequest',
        validationErrors: validation.errors.map(error => `${error.property} ${error.message}`),
        error: 1,
      });
      return;
    }
    next();
  };

module.exports = {
  validator,
  validateRequest,
};
