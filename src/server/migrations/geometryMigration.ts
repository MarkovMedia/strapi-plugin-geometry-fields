import { Strapi } from "@strapi/strapi";

import fs from "fs";
import path from "path";

import { isPostgres, hasPostgis } from "../utils/dbChecks";
import { getContentTypeInfo } from "../utils/getContentTypesWithPostgis";

export const geometryMigration = async ({ strapi }: { strapi: Strapi }) => {
  // db is Postgres
  if (!isPostgres({ strapi })) {
    strapi.log.warn("[PostGIS] Skipping migration: not using PostgreSQL");
    return null;
  }

  // postgis installed
  if (!(await hasPostgis({ strapi }))) {
    strapi.log.warn(
      "[PostGIS] Skipping migration: PostGIS extension not found"
    );
    return null;
  }

  const appRoot = strapi.dirs.app.root;

  const contentTypesDir = fs.existsSync(path.join(appRoot, "src", "api"))
    ? path.join(appRoot, "src", "api")
    : path.join(appRoot, "api");

  if (!fs.existsSync(contentTypesDir)) return null;

  const apiDirs = fs.readdirSync(contentTypesDir);

  // Loop through content types that has geometry fields

  for (const apiName of apiDirs) {
    const schemaPath = path.join(
      contentTypesDir,
      apiName,
      "content-types",
      apiName,
      "schema.json"
    );

    if (!fs.existsSync(schemaPath)) continue;

    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
    const tableNamePlural = schema.info.pluralName;
    const tableNameSingular = schema.info.singularName;
    const contentTypeInfo = getContentTypeInfo({ strapi }, tableNameSingular);

    // Nested loop through each geometry field
    if (!contentTypeInfo) continue;

    for (const field of contentTypeInfo.fields) {
      strapi.log.info(
        `[PostGIS] Updating field "${field}" on table "${tableNamePlural}" to type geometry`
      );

      // Convert jsonb to geometry

      try {
        if (!strapi.db) {
          strapi.log.warn("[PostGIS] strapi.db is undefined");
          return null;
        }
        await strapi.db.connection.raw(
          `
          ALTER TABLE ?? 
          ALTER COLUMN ?? TYPE geometry(GEOMETRY, 4326) 
          USING ST_SetSRID(ST_GeomFromGeoJSON(??::text), 4326)
          `,
          [tableNamePlural, field.column, field.column]
        );
      } catch (error) {
        if (
          error instanceof Error &&
          !error.message.includes("already of type geometry")
        ) {
          strapi.log.warn(
            `[PostGIS] Failed to alter column "${field}" on "${tableNamePlural}": ${error.message}`
          );
        }
      }
    }
  }
};
