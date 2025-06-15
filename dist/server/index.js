"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const register_1 = __importDefault(require("./register"));
const geometryMigration_1 = require("./migrations/geometryMigration");
exports.default = {
    register: register_1.default,
    async bootstrap() {
        await (0, geometryMigration_1.geometryMigration)({ strapi });
    },
};
//# sourceMappingURL=index.js.map