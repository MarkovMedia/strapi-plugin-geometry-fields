"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGeometryFieldsFromModel = void 0;
function getGeometryFieldsFromModel(model) {
    return Object.entries(model.attributes)
        .filter(([, attr]) => {
        return (attr.type === 'json' &&
            typeof attr === 'object' &&
            'customField' in attr &&
            attr.customField === 'plugin::geometry-fields.geometry');
    })
        .map(([fieldName]) => fieldName);
}
exports.getGeometryFieldsFromModel = getGeometryFieldsFromModel;
//# sourceMappingURL=getGeometryFieldsFromModel.js.map