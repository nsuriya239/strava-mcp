import fs from "fs";
import path from "path";
import type { Sequelize } from "sequelize";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ModelClass {
  initModel?: (sequelize: Sequelize) => void;
  associate?: (models: ModelRegistry) => void;
  name?: string;
}

export interface ModelRegistry {
  [key: string]: ModelClass;
}

const models: ModelRegistry = {};

export const loadModels = async (sequelize: Sequelize): Promise<ModelRegistry> => {
  const modelsPath = __dirname;

  const files = fs.readdirSync(modelsPath)
    .filter((file) => file !== "index.ts" && file !== "index.js" && (file.endsWith(".ts") || file.endsWith(".js")));


  for (const file of files) {
    const filePath = path.join(modelsPath, file);
    const modelModule = await import(filePath);

    const modelClass = Object.values(modelModule)[0] as ModelClass;
    if (typeof modelClass?.initModel !== "function") continue;

    modelClass.initModel(sequelize);
    if (typeof modelClass?.name === "string") {
      models[modelClass.name] = modelClass;
    }
  }

  // Run associations
  Object.values(models).forEach((model: ModelClass) => {
    if (model.associate) {
      model.associate(models);
    }
  });

  return models;
};

export default models;
