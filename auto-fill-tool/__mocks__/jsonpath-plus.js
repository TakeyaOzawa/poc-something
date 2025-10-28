/**
 * Manual mock for jsonpath-plus
 * This is needed because jsonpath-plus uses ES modules which Jest has trouble transforming
 */

const jp = require('jsonpath');

const JSONPath = (options) => {
  const { path, json, wrap } = options;
  const result = jp.query(json, path);
  return wrap ? result : result[0];
};

module.exports = { JSONPath };
