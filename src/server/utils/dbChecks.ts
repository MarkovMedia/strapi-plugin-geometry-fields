import { Strapi } from "@strapi/strapi";

export const isPostgres = ({ strapi }: { strapi: Strapi }): boolean => {
  return strapi.db?.config?.connection?.client === "postgres";
};

export const hasPostgis = async ({
  strapi,
}: {
  strapi: Strapi;
}): Promise<boolean | null> => {
  if (!strapi.db) {
    strapi.log.warn("[PostGIS] strapi.db is undefined");
    return null;
  }

  try {
    const result = await strapi.db.connection.raw(`
        SELECT extname FROM pg_extension WHERE extname = 'postgis';
      `);
    return result.rows.length > 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    strapi.log.warn(
      "[PostGIS] Failed to check for PostGIS extension:",
      message
    );
    return false;
  }
};
