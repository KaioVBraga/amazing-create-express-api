import fs from "fs";
import path from "path";
import prettier from "prettier";

const saveService = (name, serviceString) => {
  if (fs.existsSync(path.join(__dirname, "..", "services", `${name}Service`))) {
    fs.rmdirSync(path.join(__dirname, "..", "services", `${name}Service`));
  }

  fs.mkdirSync(path.join(__dirname, "..", "services", `${name}Service`));

  const formatedServiceString = prettier.format(serviceString, {
    singleQuote: true,
    trailingConma: "es5",
  });

  fs.writeFileSync(
    path.join(__dirname, "..", "services", `${name}Service`, `index.ts`),
    formatedServiceString
  );
};

const buildServiceFunction = (type, modelName) => {
  const functionType = {
    index: `
  async index({ page, limit }) {
    const formatedLimit = limit || 10;

    const itemsResponse = await Promise.all([
      ${modelName}.findAll({
        limit: formatedLimit,
        offset: ((page || 1) - 1) * formatedLimit,
        order: [['id', 'desc']],
      }),
      ${modelName}.count(),
    ]);

    if (!itemsResponse) {
      return false;
    }

    return itemsResponse;
  }`,
    read: `
  async read(id:number) {
    const item = await ${modelName}.findByPk(id);

    if (!item) {
      return false;
    }

    return item;
  }`,
    create: `
  async create(data:I${modelName}) {
    const createdItem = await ${modelName}.create(data);

    if (!createdItem) {
      return false;
    }

    return createdItem;
  }`,
    update: `
  async update(data:I${modelName}, id:number) {
    const item = await ${modelName}.findByPk(id);

    if (!item) {
      return false;
    }

    await item.update(data);

    return true;
  }`,
    delete: `
  async delete(id:number) {
    const item = await ${modelName}.findByPk(id);

    if (!item) {
      return false;
    }

    await item.destroy();

    return true;
  }`,
  };

  return functionType[type];
};

const formatRouteString = (routeListString) => {
  const functionTypeArr = routeListString.split("\n");

  return functionTypeArr.slice(1, functionTypeArr.length).join("\n");
};

const buildService = (data) => {
  if (!data.service || data.service.build === false) {
    return;
  }

  console.log("BUILDING SERVICE");

  const routeListString = data.routes.list
    .map((route) => {
      const { type } = route;

      return buildServiceFunction(type, data.model.name);
    })
    .join("\n");

  const formatedRouteListString = formatRouteString(routeListString);

  const serviceString = `
import ${data.model.name} from '../../models/${data.model.name}';

interface I${data.model.name} {
${Object.entries(data.validation.fields)
  .map(([field, type]) => ` ${field}: ${type[0]};`)
  .join("\n")}
}

class ${data.service.name}Service {
${formatedRouteListString}
}

export default new ${data.service.name}Service();
  `;

  saveService(data.service.name, serviceString);
};

export default buildService;
