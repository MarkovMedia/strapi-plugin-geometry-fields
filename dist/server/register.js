"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const geometryLifecycle_1 = __importDefault(require("./lifecycles/geometryLifecycle"));
exports.default = ({ strapi }) => {
    strapi.customFields.register({
        name: "geometry",
        plugin: "geometry-fields",
        type: "json",
    });
    // Helper function to find content types using the geometry field
    const getPostgisContentTypes = (strapi) => {
        const appRoot = strapi.dirs.app.root;
        const contentTypesDir = fs_1.default.existsSync(path_1.default.join(appRoot, "src", "api"))
            ? path_1.default.join(appRoot, "src", "api")
            : path_1.default.join(appRoot, "api");
        if (!fs_1.default.existsSync(contentTypesDir))
            return [];
        const apiDirs = fs_1.default.readdirSync(contentTypesDir);
        const uids = [];
        for (const apiName of apiDirs) {
            const fullPath = path_1.default.join(contentTypesDir, apiName);
            if (!fs_1.default.lstatSync(fullPath).isDirectory())
                continue;
            const schemaPath = path_1.default.join(fullPath, "content-types", apiName, "schema.json");
            if (!fs_1.default.existsSync(schemaPath))
                continue;
            const schema = JSON.parse(fs_1.default.readFileSync(schemaPath, "utf-8"));
            const attrs = schema?.attributes || {};
            const hasPostgis = Object.values(attrs).some((attr) => attr.type === "customField" && attr.customField === "plugin::geometry-fields.geometry");
            if (hasPostgis) {
                uids.push(`api::${apiName}.${apiName}`);
            }
        }
        return uids;
    };
    const targetContentTypes = getPostgisContentTypes(strapi);
    targetContentTypes.forEach((uid) => {
        const contentType = strapi.contentTypes[uid];
        if (contentType) {
            contentType.lifecycles = (0, geometryLifecycle_1.default)({ strapi });
        }
    });
};
//# sourceMappingURL=register.js.map