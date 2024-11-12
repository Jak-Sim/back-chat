const YAML = require('yamljs');
const path = require('path');

const swaggerSpecs = YAML.load(path.join(__dirname, 'swagger.yml'));

module.exports = swaggerSpecs;