import register from "./server/register";
import { Strapi } from "@strapi/strapi";

import { geometryMigration } from "./server/migrations/geometryMigration";

export default {
  register,
  async bootstrap() {
    await geometryMigration({ strapi });
  },
};
