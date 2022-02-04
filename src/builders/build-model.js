const fs = require("fs");
const path = require("path");
const prettier = require("prettier");

const saveModel = (name, modelsString) => {
  const formatedModelsString = prettier.format(modelsString, {
    singleQuote: true,
    trailingConma: "es5",
  });

  fs.writeFileSync(
    path.join(process.cwd(), "src", "models", `${name}.ts`),
    formatedModelsString
  );
};

const insertInModelsFile = (name) => {
  const models = fs.readFileSync(
    path.join(process.cwd(), "src", "database", "index.ts"),
    { encoding: "utf-8" }
  );

  const [importsBlock, restBlock] = models.split("const models = [");

  const formatedImportsBlock = importsBlock
    .split("\n")
    .filter((v) => v)
    .join("\n");

  const [arrayElements, restElements] = restBlock.split("];");

  const arrayElementsArr = arrayElements.split("\n");

  const formatedArrayElements = arrayElementsArr
    .slice(1, arrayElementsArr.length - 1)
    .join("\n");

  const newModels = `${formatedImportsBlock}
import ${name} from '../models/${name}';

const models = [
${formatedArrayElements}
  ${name},
];
${restElements}`;

  fs.writeFileSync(
    path.join(process.cwd(), "src", "database", "index.ts"),
    newModels
  );
};

const buildModel = (data) => {
  if (data.model.build === false) {
    return;
  }

  console.log("BUILDING MODEL");

  const { fields } = data.model;

  const fieldsString = Object.keys(fields)
    .map((key) => `        ${key}: DataTypes.${fields[key]},`)
    .join("\n");

  const modelsString = `
import { Model, DataTypes } from 'sequelize';

class ${data.model.name} extends Model {
  static init(sequelize) {
    super.init(
      {
${fieldsString}
      },
      {
        sequelize,
        tableName: '${data.model.tableName}',
        ${data.model.timestamps === false ? "timestamps: false," : ""}
        ${data.model.underscored && "underscored: true"}
      }
    );
    return this;
  }
}
export default ${data.model.name};`;

  saveModel(data.model.name, modelsString);
  insertInModelsFile(data.model.name);
};

module.exports = buildModel;
