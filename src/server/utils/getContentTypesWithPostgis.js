"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContentTypeInfo = void 0;
const getContentTypeInfo = ({ strapi }, contentTypeName) => {
    const fields = [];
    if (!strapi.db) {
        strapi.log.warn("[PostGIS] strapi.db is undefined");
        return null;
    }
    for (const [uid] of Object.entries(strapi.contentTypes)) {
        const uidTypeName = uid.split("::")[1]?.split(".")[1];
        if (uidTypeName === contentTypeName) {
            const metadata = strapi.db.metadata.get(uid);
            for (const [fieldName, attr] of Object.entries(metadata.attributes)) {
                if (typeof attr === "object" &&
                    "customField" in attr &&
                    attr.customField === "plugin::geometry-fields.geometry") {
                    fields.push({
                        field: fieldName,
                        column: "columnName" in attr && typeof attr.columnName === "string"
                            ? attr.columnName
                            : fieldName,
                    });
                }
            }
            return { uid, fields };
        }
    }
    return null;
};
exports.getContentTypeInfo = getContentTypeInfo;
//# sourceMappingURL=getContentTypesWithPostgis.js.map