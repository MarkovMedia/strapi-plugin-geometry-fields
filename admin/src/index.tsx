import type { StrapiApp } from '@strapi/types';
import type { CustomFieldInputDefinition } from '@strapi/admin/exports';

const geometryField: CustomFieldInputDefinition = {
  name: 'geometry',
  pluginId: 'geometry-fields',
  type: 'json',
  intlLabel: {
    id: 'geometry.label',
    defaultMessage: 'Geometry Fields',
  },
  intlDescription: {
    id: 'geometry.description',
    defaultMessage: 'Store and edit geospatial data with PostGIS in a Strapi 4 custom field.',
  },
  components: {
    Input: async () => import('./components/GeometryInput'),
  },
};

export default {
  register(app: StrapiApp) {
    app.customFields.register(geometryField);
  },
};
