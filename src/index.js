#!/usr/bin/env node

const buildEndpoint = require("./builders/build-endpoint");
const buildProject = require("./builders/build-project");

const main = () => {
  const [option] = process.argv.slice(2);

  const options = {
    "build-endpoint": buildEndpoint,
  };

  if (!options[option]) {
    buildProject();

    return;
  }

  options[option]();
};

main();
