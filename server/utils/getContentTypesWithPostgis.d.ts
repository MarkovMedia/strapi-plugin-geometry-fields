import { Strapi } from "@strapi/strapi";
export declare const getContentTypeInfo: ({ strapi }: {
    strapi: Strapi;
}, contentTypeName: string) => {
    uid: string;
    fields: {
        field: string;
        column: string;
    }[];
} | null;
