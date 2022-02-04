const fs = require("fs");
const path = require("path");
const prettier = require("prettier");

const typesOptions = {
  index: { httpVerb: "get", slug: "" },
  read: { httpVerb: "get", slug: "/:id" },
  create: { httpVerb: "post", slug: "" },
  update: { httpVerb: "put", slug: "/:id" },
  delete: { httpVerb: "delete", slug: "/:id" },
};

const saveRoute = (name, routesString) => {
  if (fs.existsSync(path.join(process.cwd(), "src", "routes", `${name}`))) {
    fs.rmdirSync(path.join(process.cwd(), "src", "routes", `${name}`));
  }

  fs.mkdirSync(path.join(process.cwd(), "src", "routes", `${name}`));

  const formatedRoutesString = prettier.format(routesString, {
    singleQuote: true,
    trailingConma: "es5",
  });

  fs.writeFileSync(
    path.join(process.cwd(), "src", "routes", `${name}`, `index.ts`),
    formatedRoutesString
  );
};

const insertInRoutesFile = (name) => {
  const routes = fs.readFileSync(
    path.join(process.cwd(), "src", "routes", "index.ts"),
    { encoding: "utf-8" }
  );

  console.log(
    "PATH :: ",
    path.join(process.cwd(), "src", "routes", "index.ts")
  );

  const [importsBlock, restBlock] = routes.split("const routes = Router();");

  // console.log("REST BLOCK", restBlock);

  const formatedImportsBlock = importsBlock
    .split("\n")
    .filter((v) => v)
    .join("\n");

  const [arrayElements, restElements] = restBlock.split("];");

  const arrayElementsArr = arrayElements.split("\n");

  const formatedArrayElements = arrayElementsArr
    .slice(1, arrayElementsArr.length - 1)
    .join("\n");

  const newRoutes = `${formatedImportsBlock}
import ${name} from './${name}';

const routes = Router();
${formatedArrayElements}
  ${name},
];
${restElements}`;

  fs.writeFileSync(
    path.join(process.cwd(), "src", "routes", "index.ts"),
    newRoutes
  );
};

const buildRoute = (route, basePath, controllerName, validationName = "") => {
  const { type, auth, admin } = route;

  const formatedBasePath =
    basePath[0] === "/" ? basePath.slice(1, basePath.length) : basePath;

  const validationString =
    validationName && ["create", "update"].includes(type)
      ? `\n  ${validationName}Validation.${type},`
      : "";

  const routeString = `
routes.${typesOptions[type].httpVerb}(
  '/${formatedBasePath}${typesOptions[type].slug}',${
    auth ? "\n  AuthMiddleware," : ""
  }${auth && admin ? "\n  AdminMiddleware," : ""}${validationString}
  ${controllerName}Controller.${type}
);`;

  return routeString;
};

const buildRoutes = (data) => {
  if (!data.routes || data.routes.build === false || !data.validation) {
    return;
  }

  console.log("BUILDING ROUTES");

  const hasAuth = data.routes.list.some((route) => route.auth);
  const hasAdmin = data.routes.list.some((route) => route.admin);
  const { basePath } = data.routes;
  const routesListString = data.routes.list
    .map((route) => {
      return buildRoute(
        route,
        basePath,
        data.controller.name,
        data?.validation?.name
      );
    })
    .join("\n");
  const importController = `import ${data.controller.name}Controller from '../../controllers/${data.controller.name}Controller';`;
  const importAuthMiddleware = hasAuth
    ? "import AuthMiddleware from '../../middleware/auth';"
    : "";
  const importAdminMiddleware = hasAdmin
    ? "import AdminMiddleware from '../../middleware/admin';"
    : "";
  const importValidation = data.validation
    ? `import ${data.validation.name}Validation from '../../validation/${data.validation.name}Controller';`
    : "";

  const routesString = `
import { Router } from 'express';
${importController}
${importValidation}
${importAuthMiddleware}
${importAdminMiddleware}

const routes = Router();
${routesListString}

export default routes;`;

  saveRoute(data.routes.name, routesString);
  insertInRoutesFile(data.routes.name);
};

module.exports = buildRoutes;
