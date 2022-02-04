import buildRoutes from './build-routes';
import buildController from './build-controller';
import buildValidation from './build-validation';
import buildService from './build-service';
import buildModel from './build-model';
import base from './build-templates/base.json';

const main = () => {
  const data = base;

  buildRoutes(data);
  buildController(data);
  buildValidation(data);
  buildService(data);
  buildModel(data);
};

main();
