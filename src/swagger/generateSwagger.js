const fs = require('fs');
const path = require('path');
const specs = require('./swagger.js');
const YAML = require('yaml');


const outputJsonPath = path.resolve(__dirname, 'swagger-output.json');
const outputYamlPath = path.resolve(__dirname, 'swagger-output.yaml');

const yamlStr = YAML.stringify(specs);

fs.writeFileSync(outputJsonPath, JSON.stringify(specs, null, 2), 'utf-8');
fs.writeFileSync(outputYamlPath, yamlStr, 'utf-8');

try {
    console.log("Swagger files generated successfully.");
} catch (error) {
    console.error("Failed to generate Swagger files:", error);
}