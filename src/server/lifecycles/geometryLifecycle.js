"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistGeometry = void 0;
const getGeometryFieldsFromModel_1 = require("../utils/getGeometryFieldsFromModel");
exports.default = ({ strapi }) => ({
    async afterFindOne(event) {
        await wkbToWkt(event);
    },
    async beforeCreate(event) {
        await interceptGeometryInput(event);
    },
    async beforeUpdate(event) {
        await interceptGeometryInput(event);
    },
    async afterCreate(event) {
        await persistGeometry(event);
    },
    async afterUpdate(event) {
        await persistGeometry(event);
    },
});
async function wkbToWkt(event) {
    const { result } = event;
    const geometryFields = (0, getGeometryFieldsFromModel_1.getGeometryFieldsFromModel)(event.model);
    if (!result)
        return;
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
            }
            catch (err) {
                console.warn(`Failed to convert ${field} from WKB to WKT:`);
            }
        }
    }
}
async function interceptGeometryInput(event) {
    const { data } = event.params;
    const geometryFields = (0, getGeometryFieldsFromModel_1.getGeometryFieldsFromModel)(event.model);
    const geometryCopies = {};
    for (const field of geometryFields) {
        if (data[field]) {
            geometryCopies[field] = data[field];
            delete data[field];
        }
    }
    event.state.postInsertGeometry = geometryCopies;
}
async function persistGeometry(event) {
    const id = event.result.id;
    const geometries = event.state.postInsertGeometry;
    if (!geometries || Object.keys(geometries).length === 0)
        return;
    const updates = [];
    const values = [];
    // Fail safe
    const geometryFields = (0, getGeometryFieldsFromModel_1.getGeometryFieldsFromModel)(event.model);
    for (const [field, wkt] of Object.entries(geometries)) {
        if (!geometryFields.includes(field)) {
            throw new Error(`Field "${field}" is not a valid geometry field.`);
        }
        updates.push(`"${field}" = ST_GeomFromText(?, 4326)`);
        values.push(wkt);
    }
    const tableName = strapi.db.connection.client.wrapIdentifier(event.model.collectionName);
    values.push(id);
    try {
        await strapi.db.connection.raw(`
    UPDATE ${tableName}
    SET ${updates.join(", ")}
    WHERE id = ?;
  `, values);
    }
    catch (error) {
        const pgMessage = error?.message || "Unknown database error";
        console.error(`[PostGIS] Failed to store geometry for ID ${id}: ${pgMessage}`);
    }
}
exports.persistGeometry = persistGeometry;
//# sourceMappingURL=geometryLifecycle.js.map