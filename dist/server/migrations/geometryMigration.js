"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geometryMigration = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dbChecks_1 = require("../utils/dbChecks");
const getContentTypesWithPostgis_1 = require("../utils/getContentTypesWithPostgis");
const geometryMigration = async ({ strapi }) => {
    // db is Postgres
    if (!(0, dbChecks_1.isPostgres)({ strapi })) {
        strapi.log.warn("[PostGIS] Skipping migration: not using PostgreSQL");
        return null;
    }
    // postgis installed
    if (!(await (0, dbChecks_1.hasPostgis)({ strapi }))) {
        strapi.log.warn("[PostGIS] Skipping migration: PostGIS extension not found");
        return null;
    }
    const appRoot = strapi.dirs.app.root;
    const contentTypesDir = fs_1.default.existsSync(path_1.default.join(appRoot, "src", "api"))
        ? path_1.default.join(appRoot, "src", "api")
        : path_1.default.join(appRoot, "api");
    if (!fs_1.default.existsSync(contentTypesDir))
        return null;
    const apiDirs = fs_1.default.readdirSync(contentTypesDir);
    // Loop through content types that has geometry fields
    for (const apiName of apiDirs) {
        const schemaPath = path_1.default.join(contentTypesDir, apiName, "content-types", apiName, "schema.json");
        if (!fs_1.default.existsSync(schemaPath))
            continue;
        const schema = JSON.parse(fs_1.default.readFileSync(schemaPath, "utf-8"));
        const tableNamePlural = schema.info.pluralName;
        const tableNameSingular = schema.info.singularName;
        const contentTypeInfo = (0, getContentTypesWithPostgis_1.getContentTypeInfo)({ strapi }, tableNameSingular);
        // Nested loop through each geometry field
        if (!contentTypeInfo)
            continue;
        for (const field of contentTypeInfo.fields) {
            strapi.log.info(`[PostGIS] Updating field "${field}" on table "${tableNamePlural}" to type geometry`);
            // Convert jsonb to geometry
            try {
                if (!strapi.db) {
                    strapi.log.warn("[PostGIS] strapi.db is undefined");
                    return null;
                }
                await strapi.db.connection.raw(`
          ALTER TABLE ?? 
          ALTER COLUMN ?? TYPE geometry(GEOMETRY, 4326) 
          USING ST_SetSRID(ST_GeomFromGeoJSON(??::text), 4326)
          `, [tableNamePlural, field.column, field.column]);
            }
            catch (error) {
                if (error instanceof Error &&
                    !error.message.includes("already of type geometry")) {
                    strapi.log.warn(`[PostGIS] Failed to alter column "${field}" on "${tableNamePlural}": ${error.message}`);
                }
            }
        }
    }
};
exports.geometryMigration = geometryMigration;
//# sourceMappingURL=geometryMigration.js.map