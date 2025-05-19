import { Schema } from '@strapi/types';

export function getGeometryFieldsFromModel(model: Schema.ContentType): string[] {
  return Object.entries(model.attributes)
    .filter(([, attr]) => {
      return (
        attr.type === 'json' &&
        typeof attr === 'object' &&
        'customField' in attr &&
        attr.customField === 'plugin::geometry-fields.geometry'
      );
    })
    .map(([fieldName]) => fieldName);
}
