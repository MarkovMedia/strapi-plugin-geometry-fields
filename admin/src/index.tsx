import type { StrapiApp } from '@strapi/types';
import type { CustomFieldInputDefinition } from '@strapi/admin/exports';
import GeometryInput from './components/GeometryInput';

const geometryField: CustomFieldInputDefinition = {
  name: 'geometry',
  pluginId: 'geometry-fields',
  type: 'json',
  intlLabel: {
    id: 'geometry.label',
    defaultMessage: 'Geometry',
  },
  intlDescription: {
    id: 'geometry.description',
    defaultMessage: 'Stores spatial data using PostGIS',
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
