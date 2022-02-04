const fs = require("fs");
const path = require("path");
const prettier = require("prettier");

const saveValidation = (name, validationString) => {
  if (
    fs.existsSync(
      path.join(process.cwd(), "src", "validation", `${name}Controller`)
    )
  ) {
    fs.rmdirSync(
      path.join(process.cwd(), "src", "validation", `${name}Controller`)
    );
  }

  fs.mkdirSync(
    path.join(process.cwd(), "src", "validation", `${name}Controller`)
  );

  const formatedValidationString = prettier.format(validationString, {
    singleQuote: true,
    trailingConma: "es5",
  });

  fs.writeFileSync(
    path.join(
      process.cwd(),
      "src",
      "validation",
      `${name}Controller`,
      `index.ts`
    ),
    formatedValidationString
  );
};

const buildValidation = (data) => {
  if (!data.validation || data.validation.build === false) {
    return;
  }

  console.log("BUILDING VALIDATION");

  const { fields } = data.validation;

  const createFieldsString = Object.keys(fields)
    .map((key) => {
      const typeString = fields[key].map((type) => `.${type}()`).join("");
      return `        ${key}: Yup${typeString}.strict(),`;
    })
    .join("\n");

  const updateFieldsString = Object.keys(fields)
    .map((key) => {
      const typeString = fields[key]
        .filter((type) => type !== "required")
        .map((type) => `.${type}()`)
        .join("");
      return `        ${key}: Yup${typeString}.strict(),`;
    })
    .join("\n");

  const validationString = `
import * as Yup from 'yup';
import utils from '../../utils';

module.exports = {
  async create(req, res, next) {
    try {
      const schemaObj = {
${createFieldsString}
      };

      const schema = Yup.object().shape(schemaObj);

      await schema.validate(req.body, { abortEarly: false });

      req.body = utils.cleanSchema(req.body, Object.keys(schemaObj));

      return next();
    } catch (err) {
      return res
        .status(400)
        .json({ error: 'Validation fail', message: err.inner });
    }
  },
  async update(req, res, next) {
    try {
      const schemaObj = {
${updateFieldsString}
      };

      const schema = Yup.object().shape(schemaObj);

      await schema.validate(req.body, { abortEarly: false });

      req.body = utils.cleanSchema(req.body, Object.keys(schemaObj));

      return next();
    } catch (err) {
      return res
        .status(400)
        .json({ error: 'Validation fail', message: err.inner });
    }
  },
};`;

  saveValidation(data.validation.name, validationString);
};

module.exports = buildValidation;
