import { Strapi } from '@strapi/strapi';
declare const _default: ({ strapi }: {
    strapi: Strapi;
}) => {
    afterFindOne(event: any): Promise<void>;
    beforeCreate(event: any): Promise<void>;
    beforeUpdate(event: any): Promise<void>;
    afterCreate(event: any): Promise<void>;
    afterUpdate(event: any): Promise<void>;
};
export default _default;
