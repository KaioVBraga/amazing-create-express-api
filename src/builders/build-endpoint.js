const path = require("path");
const buildRoutes = require("./build-routes");
const buildController = require("./build-controller");
const buildValidation = require("./build-validation");
const buildService = require("./build-service");
const buildModel = require("./build-model");

const buildEndpoint = () => {
  const [rawBaseFilePath] = process.argv.slice(3);

  const baseFilePath = rawBaseFilePath || "create-express-api.json";

  const data = require(path.join(process.cwd(), baseFilePath));

  buildRoutes(data);
  buildController(data);
  buildValidation(data);
  buildService(data);
  buildModel(data);
};

module.exports = buildEndpoint;
