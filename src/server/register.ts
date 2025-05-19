// const fs = require("fs");
// const path = require("path");
import fs from "fs";
import path from "path";
import { Strapi } from "@strapi/strapi";
import geometryLifecycle from "./lifecycles/geometryLifecycle";

export default ({ strapi }: { strapi: Strapi }) => {
  strapi.customFields.register({
    name: "geometry",
    plugin: "geometry-fields",
    type: "json", // or 'string' if your field is text-based
  });

  // Helper function to find content types using the geometry field
  const getPostgisContentTypes = (strapi: Strapi): string[] => {
    const appRoot = strapi.dirs.app.root;

    const contentTypesDir = fs.existsSync(path.join(appRoot, "src", "api"))
      ? path.join(appRoot, "src", "api")
      : path.join(appRoot, "api");

    if (!fs.existsSync(contentTypesDir)) return [];

    const apiDirs = fs.readdirSync(contentTypesDir);
    const uids: string[] = [];

    for (const apiName of apiDirs) {
      const fullPath = path.join(contentTypesDir, apiName);
      if (!fs.lstatSync(fullPath).isDirectory()) continue;

      const schemaPath = path.join(
        fullPath,
        "content-types",
        apiName,
        "schema.json"
      );
      if (!fs.existsSync(schemaPath)) continue;

      const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
      const attrs = schema?.attributes || {};

      const hasPostgis = Object.values(attrs).some(
        (attr: any) =>
          attr.type === "customField" &&
          attr.customField === "plugin::geometry-fields.geometry"
      );

      if (hasPostgis) {
        uids.push(`api::${apiName}.${apiName}`);
      }
    }

    return uids;
  };

  const targetContentTypes = getPostgisContentTypes(strapi);
   targetContentTypes.forEach((uid) => {
    const contentType = (strapi.contentTypes as Record<string, any>)[uid];

    if (contentType) {
      contentType.lifecycles = geometryLifecycle({ strapi });
    }
  });
};
