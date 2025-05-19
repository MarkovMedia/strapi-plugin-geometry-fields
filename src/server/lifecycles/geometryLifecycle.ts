import { Strapi } from "@strapi/strapi";
import { getGeometryFieldsFromModel } from "../utils/getGeometryFieldsFromModel";

interface GeometryEvent {
  model: {
    collectionName: string;
  };
  result: {
    id: number;
  };
  state: {
    postInsertGeometry?: Record<string, string>;
  };
}

export default ({ strapi }: { strapi: Strapi }) => ({
  async afterFindOne(event: any) {
    await wkbToWkt(event);
  },
  async beforeCreate(event: any) {
    await interceptGeometryInput(event);
  },
  async beforeUpdate(event: any) {
    await interceptGeometryInput(event);
  },
  async afterCreate(event: any) {
    await persistGeometry(event);
  },
  async afterUpdate(event: any) {
    await persistGeometry(event);
  },
});

async function wkbToWkt(event: any) {
  const { result } = event;
  const geometryFields = getGeometryFieldsFromModel(event.model as any);

  if (!result) return;

  for (const field of geometryFields) {
    const wkbValue = result[field];



    if (wkbValue) {
      try {
        const response = await strapi.db.connection.raw(`SELECT ST_AsText(?)`, [
          wkbValue,
        ]);
        const wkt = response.rows[0]?.st_astext;

        if (wkt) {
          result[field] = wkt;
        }
      } catch (err) {
        console.warn(`Failed to convert ${field} from WKB to WKT:`);
      }
    }
  }
}

async function interceptGeometryInput(event: any) {
  const { data } = event.params;
  const geometryFields = getGeometryFieldsFromModel(event.model);

  const geometryCopies: Record<string, unknown> = {};

  for (const field of geometryFields) {
    if (data[field]) {
      geometryCopies[field] = data[field];
      delete data[field];
    }
  }

  event.state.postInsertGeometry = geometryCopies;
}

export async function persistGeometry(event: GeometryEvent) {
  const id = event.result.id;
  const geometries = event.state.postInsertGeometry;

  if (!geometries || Object.keys(geometries).length === 0) return;

  const updates: string[] = [];
  const values: (string | number)[] = [];

  // Fail safe
  const geometryFields = getGeometryFieldsFromModel(event.model as any);

  for (const [field, wkt] of Object.entries(geometries)) {
    if (!geometryFields.includes(field)) {
      throw new Error(`Field "${field}" is not a valid geometry field.`);
    }

    updates.push(`"${field}" = ST_GeomFromText(?, 4326)`);
    values.push(wkt);
  }

  const tableName = strapi.db.connection.client.wrapIdentifier(
    event.model.collectionName
  );
  values.push(id);

  try {
    await strapi.db.connection.raw(
      `
    UPDATE ${tableName}
    SET ${updates.join(", ")}
    WHERE id = ?;
  `,
      values
    );
  } catch (error: any) {
    const pgMessage = error?.message || "Unknown database error";
    console.error(
      `[PostGIS] Failed to store geometry for ID ${id}: ${pgMessage}`
    );
  }
}
