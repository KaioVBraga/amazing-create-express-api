const fs = require("fs");
const path = require("path");
const prettier = require("prettier");

const saveController = (name, controllerString) => {
  const formatedControllerString = prettier.format(controllerString, {
    singleQuote: true,
    trailingConma: "es5",
  });

  fs.writeFileSync(
    path.join(process.cwd(), "src", "controllers", `${name}Controller.ts`),
    formatedControllerString
  );
};

const buildControllerFunction = (type, serviceName) => {
  const functionType = {
    index: `
  async index(req: Request, res: Response): Promise<Response> {
    const { page, search } = req.query;

    const limit = 50;

    const itemsResponse = await ${serviceName}Service.index({
      page,
      search,
      limit,
    });

    if (!itemsResponse) {
      throw new GlobalError('Houve um erro ao buscar pelos itens', 404);
    }

    const [items, itemsCount] = itemsResponse;

    return res.json({
      items,
      page: page || 1,
      pages: Math.ceil(itemsCount / limit),
      msg: 'Itens listados com sucesso'
    });
  }`,
    read: `
  async read(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    const item = await ${serviceName}Service.read(id);

    if (!item) {
      throw new GlobalError('Item não encontrado', 404);
    }

    return res.json({
      item,
      msg: 'Item encontrado com sucesso !'
    });
  }`,
    create: `
  async create(req: Request, res: Response): Promise<Response> {
    const data = req.body;

    const createdItem = await ${serviceName}Service.create(data);

    if (!createdItem) {
      throw new GlobalError('Erro ao criar item', 404);
    }

    return res.json({
      item: createdItem,
      msg: 'Item criado com sucesso !'
    });
  }`,
    update: `
  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const data = req.body;

    const updatedItem = await ${serviceName}Service.update(data, id);

    if (!updatedItem) {
      throw new GlobalError('Erro ao atualizar item', 404);
    }

    return res.json({
      msg: 'Item atualizado com sucesso !'
    });
  }`,
    delete: `
  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    const deletedItem = await ${serviceName}Service.delete(id);

    if (!deletedItem) {
      throw new GlobalError('Erro ao deletar item', 404);
    }

    return res.json({
      msg: 'Item deletado com sucesso !'
    });
  }`,
  };

  return functionType[type];
};

const formatRouteString = (routeListString) => {
  const functionTypeArr = routeListString.split("\n");

  return functionTypeArr.slice(1, functionTypeArr.length).join("\n");
};

const buildController = (data) => {
  if (!data.controller || data.controller.build === false) {
    return;
  }

  console.log("BUILDING CONTROLLER");

  const routeListString = data.routes.list
    .map((route) => {
      const { type } = route;

      return buildControllerFunction(
        type,
        data.service.name,
        data?.validation?.name
      );
    })
    .join("\n");

  const formatedRouteListString = formatRouteString(routeListString);

  const controllerString = `  
import { Request, Response } from "express";
import GlobalError from '../errors/GlobalError';
import ${data.controller.name}Service from '../services/${data.controller.name}Service';

class ${data.controller.name}Controller {
${formatedRouteListString}
}

export default new ${data.controller.name}Controller();
`;

  saveController(data.controller.name, controllerString);
};

module.exports = buildController;
