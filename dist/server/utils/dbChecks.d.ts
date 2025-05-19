import { Strapi } from "@strapi/strapi";
export declare const isPostgres: ({ strapi }: {
    strapi: Strapi;
}) => boolean;
export declare const hasPostgis: ({ strapi, }: {
    strapi: Strapi;
}) => Promise<boolean | null>;
