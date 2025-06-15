import register from "./register";
import { Strapi } from "@strapi/strapi";

import { geometryMigration } from "./migrations/geometryMigration";

export default {
  register,
  async bootstrap() {
    await geometryMigration({ strapi });
  },
};
