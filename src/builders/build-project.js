#!/usr/bin/env node

const fs = require("fs");
const InputReader = require("../utils/input-reader");

const createDir = (dirPath) => {
  const fullDirPath = `${process.cwd()}/${dirPath}`;

  fs.mkdirSync(fullDirPath);
};

const createFile = (filePath, content) => {
  const fullFilePath = `${process.cwd()}/${filePath}`;

  fs.writeFileSync(fullFilePath, content);
};

const buildProject = async () => {
  InputReader.open();

  const projectName = await InputReader.question("Project name: ");
  const databaseDialect = await InputReader.question("Database dialect: ");

  const databaseDependencyOptions = {
    mysql: `"mysql2": "^2.3.3"`,
    postgres: `"pg": "^8.7.1"`,
  };

  const databaseDependency =
    databaseDependencyOptions[databaseDialect] || `"mysql2": "^2.3.3"`;

  createDir(projectName);

  createDir(`${projectName}/src`);

  createFile(
    `${projectName}/.env`,
    `
DATABASE_USERNAME = ""
DATABASE_PASSWORD = ""
DATABASE_DB_NAME = ""
DATABASE_HOST = ""
DATABASE_PORT = ""
`
  );
  createFile(
    `${projectName}/.gitignore`,
    `
/node_modules
node_modules
create-express-api.json  
`
  );
  createFile(
    `${projectName}/nodemon.json`,
    `
{
  "watch": ["src"],
  "ext": "ts",
  "execMap": {
    "ts": "sucrase-node src/server.ts"
  }
}
  `
  );

  createFile(
    `${projectName}/package.json`,
    `
{
  "name": "${projectName}",
  "version": "1.0.0",
  "main": "index.js",
  "license": "MIT",
  "scripts": {
    "start": "node ./build/server.js",
    "dev": "nodemon ./src/server.ts",
    "build": "sucrase ./src -d ./build --transforms typescript,imports"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^4.29.2",
    "@typescript-eslint/parser": "^4.29.2",
    "eslint": "^7.32.0",
    "eslint-config-prettier": "^8.3.0",
    "eslint-config-standard": "^16.0.3",
    "eslint-plugin-import": "^2.24.1",
    "eslint-plugin-node": "^11.1.0",
    "eslint-plugin-prettier": "^3.4.1",
    "eslint-plugin-promise": "^5.1.0",
    "prettier": "^2.3.2",
    "typescript": "^4.3.5"
  },
  "dependencies": {
    "@types/cors": "^2.8.12",
    "@types/express": "^4.17.13",
    "axios": "^0.21.1",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^10.0.0",
    "express": "^4.17.1",
    "express-async-errors": "^3.1.1",
    "jsonwebtoken": "^8.5.1",
    ${databaseDependency},
    "nodemon": "^2.0.12",
    "sequelize": "^6.14.0",
    "sequelize-cli": "^6.4.1",
    "sucrase": "^3.20.1",
    "yup": "^0.32.11"
  }
}
`
  );

  createFile(
    `${projectName}/create-express-api.json`,
    `
{
  "controller": {
    "name": ""
  },
  "service": {
    "name": ""
  },
  "validation": {
    "name": "",
    "fields": {}
  },
  "routes": {
    "name": "",
    "basePath": "",
    "list": []
  },
  "model": {
    "build": false,
    "name": "",
    "tableName": "",
    "underscored": true,
    "timestamps": true,
    "fields": {}
  }
}  
`
  );

  createDir(`${projectName}/src/config`);

  createFile(
    `${projectName}/src/config/database.ts`,
    `
require("dotenv").config();

module.exports = {
  dialect: "${databaseDialect}",
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_DB_NAME,
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  ssl: true,
};
`
  );

  createDir(`${projectName}/src/controllers`);

  createDir(`${projectName}/src/database`);
  createDir(`${projectName}/src/database/migrations`);
  createFile(
    `${projectName}/src/database/index.ts`,
    `  
import Sequelize = require("sequelize");
import databaseConfig = require("../config/database");
//Models List

const models = [
  //Models list
];

interface IDatabase {
  connection: any;
}

class Database implements IDatabase {
  connection: any;

  constructor() {
    this.init();
  }

  init() {
    this.connection = new Sequelize(databaseConfig);
    models
      .map((model) => model.init(this.connection))
      .map(
        (model) => model.associate && model.associate(this.connection.models)
      );
  }
}

export default new Database();
    
`
  );

  createDir(`${projectName}/src/errors`);
  createFile(
    `${projectName}/src/errors/GlobalError.ts`,
    `
interface IGlobalError {
  message: string;
  statusCode: number;
}

class GlobalError implements IGlobalError {
  message: string;
  statusCode: number;

  constructor(message, statusCode = 400) {
    this.message = message;
    this.statusCode = statusCode;
  }
}

export default GlobalError;  
`
  );

  createDir(`${projectName}/src/middleware`);
  createFile(
    `${projectName}/src/middleware/auth.ts`,
    `
import jwt = require("jsonwebtoken");
import { promisify } = require("util");
import authConfig = require("../config/authConfig");
import GlobalError = require("../errors/GlobalError");

export default async (req, res, next) => {
  const auth = req.headers.access_token;

  if (!auth) return res.status(400).json({ error: "Forneça o Token" });

  const [header, token] = auth.split(" ");

  if (header !== "coclear-token") {
    return res.status(400).json({ err: "Parametros invalidos" });
  }

  await promisify(jwt.verify)(token, authConfig.secret)
    .then((response) => {
      req.userId = response.id;
      req.email = response.email;
      req.isAdmin = response.isAdmin;
      return next();
    })
    .catch(() => {
      throw new GlobalError("Token invalido", 401);
    });
};
  
`
  );
  createFile(
    `${projectName}/src/middleware/admin.ts`,
    `
export default async (req, res, next) => {
  const { isAdmin } = req;

  if (!isAdmin)
    return res
      .status(401)
      .json({ err: "You don't have permissions to make this" });

  return next();
};    
`
  );

  createDir(`${projectName}/src/models`);

  createDir(`${projectName}/src/providers`);

  createDir(`${projectName}/src/routes`);
  createFile(
    `${projectName}/src/routes/index.ts`,
    `
import { Router } = require("express");
/** ROUTES LIST */

const routes = Router();

const loaderRoute = [
  //Routes list
];

loaderRoute.map((res) => routes.use(res));

export default routes;  
`
  );

  createDir(`${projectName}/src/services`);

  createDir(`${projectName}/src/validation`);

  createFile(
    `${projectName}/src/app.ts`,
    `  
import "dotenv/config";
import express = require("express");
import "express-async-errors";
import cors = require("cors");
import routes = require("./routes");
import GlobalError = require("./errors/GlobalError");
import "./database";

class App {
  public express: express.Application;

  public constructor() {
    this.express = express();

    this.middlewares();
    this.routes();
    this.errorHandler();
  }

  private middlewares(): void {
    this.express.use(express.json());
    this.express.use(cors());
  }

  private routes(): void {
    this.express.use(routes);
  }

  private errorHandler() {
    this.express.use((err, req, res, next) => {
      if (err instanceof GlobalError) {
        return res.status(err.statusCode).json({
          status: "erro",
          message: err.message,
        });
      }

      if (process.env.NODE_ENV === "development") {
        console.log(\`\x1B[31m $\{err.message}\`);
        console.log(\`\x1b[0m\`);
      }

      return res.status(500).json({
        status: "erro",
        message: "Erro interno do servidor",
        codeMessage: err.message,
      });
    });
  }
}

export default new App().express;
  `
  );

  createFile(
    `${projectName}/src/server.ts`,
    `
import app = require("./app");

app.listen(process.env.PORT || 3333, () =>
  console.log(\`Hearing at port ${process.env.PORT || 3333}\`)
);  
`
  );

  createFile(
    `${projectName}/src/utils.ts`,
    `
const cleanObject = (data, options = { removeEmptyStrings: false }) => {
  const { removeEmptyStrings } = options;

  return Object.keys(data)
    .filter(
      (key) =>
        data[key] !== null &&
        data[key] !== undefined &&
        (!removeEmptyStrings || data[key] !== "")
    )
    .reduce((sum, key) => ({ ...sum, [key]: data[key] }), {});
};

const cleanSchema = (data, fields) => {
  const dataClone = { ...data };

  Object.keys(data)
    .filter((key) => !fields.includes(key))
    .forEach((key) => {
      delete dataClone[key];
    });

  return dataClone;
};

export default {
  cleanSchema,
  cleanObject,
};
`
  );

  InputReader.close();
};

module.exports = buildProject;
