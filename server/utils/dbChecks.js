"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPostgis = exports.isPostgres = void 0;
const isPostgres = ({ strapi }) => {
    return strapi.db?.config?.connection?.client === "postgres";
};
exports.isPostgres = isPostgres;
const hasPostgis = async ({ strapi, }) => {
    if (!strapi.db) {
        strapi.log.warn("[PostGIS] strapi.db is undefined");
        return null;
    }
    try {
        const result = await strapi.db.connection.raw(`
        SELECT extname FROM pg_extension WHERE extname = 'postgis';
      `);
        return result.rows.length > 0;
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        strapi.log.warn("[PostGIS] Failed to check for PostGIS extension:", message);
        return false;
    }
};
exports.hasPostgis = hasPostgis;
//# sourceMappingURL=dbChecks.js.map