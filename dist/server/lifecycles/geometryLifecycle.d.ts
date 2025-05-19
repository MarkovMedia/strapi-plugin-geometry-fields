import { Strapi } from "@strapi/strapi";
interface GeometryEvent {
    model: {
        collectionName: string;
    };
    result: {
        id: number;
    };
    state: {
        postInsertGeometry?: Record<string, string>;
    };
}
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
export declare function persistGeometry(event: GeometryEvent): Promise<void>;
