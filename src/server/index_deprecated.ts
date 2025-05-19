// import { Strapi } from '@strapi/strapi';
// import registerField from './register';
// import geometryLifecycle from './lifecycles/geometryLifecycle';

// const contentTypeUid = 'api::map.map'; // example content type using your field

// export default {
//   register({ strapi }: { strapi: Strapi }) {
//     console.log("🎉 Plugin register() fired!");

//     // Register your custom field (important!)
//     registerField({ strapi });

//     // Attach lifecycle hooks
//      const contentType = (strapi.contentTypes as Record<string, any>)[contentTypeUid];
 
//     if (contentType) {
//       console.log(`✅ Found ${contentTypeUid}, assigning lifecycles`);
//       contentType.lifecycles = geometryLifecycle({ strapi });
//     } else {
//       console.warn(`⚠️ Content type ${contentTypeUid} not found`);
//     }
//   },

//   bootstrap() {
//     console.log("🚀 Plugin bootstrap() fired!");
//   },
// };

// import fs from "fs";
// import path from "path";
// import { Strapi } from "@strapi/types";
//  import geometryLifecycle from "./lifecycles/geometryLifecycle";
// // // import { PluginContext } from "@strapi/types/dist/plugins/context";

// interface PluginContext {
//   strapi: Strapi;
// }

// export default {
//   register({ strapi }: PluginContext) {
//     // Register the custom field
//     strapi.customFields.register({
//       name: "geometry",
//       plugin: "geometry-fields",
//       type: "json",
//     });

//     console.log("hello");
//     // Helper function to find content types using the geometry field
//     const getPostgisContentTypes = (strapi: Strapi): string[] => {
//       const appRoot = strapi.dirs.app.root;

//       const contentTypesDir = fs.existsSync(path.join(appRoot, "src", "api"))
//         ? path.join(appRoot, "src", "api")
//         : path.join(appRoot, "api");

//       if (!fs.existsSync(contentTypesDir)) return [];

//       const apiDirs = fs.readdirSync(contentTypesDir);
//       const uids: string[] = [];

//       for (const apiName of apiDirs) {
//         const fullPath = path.join(contentTypesDir, apiName);
//         if (!fs.lstatSync(fullPath).isDirectory()) continue;

//         const schemaPath = path.join(
//           fullPath,
//           "content-types",
//           apiName,
//           "schema.json"
//         );
//         if (!fs.existsSync(schemaPath)) continue;

//         const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
//         const attrs = schema?.attributes || {};

//         const hasPostgis = Object.values(attrs).some(
//           (attr: any) =>
//             attr.type === "customField" &&
//             attr.customField === "plugin::geometry-fields.geometry"
//         );

//         if (hasPostgis) {
//           uids.push(`api::${apiName}.${apiName}`);
//         }
//       }

//       return uids;
//     };

//     const targetContentTypes = getPostgisContentTypes(strapi);
//   console.log("targetContentTypes: ", targetContentTypes);
//     targetContentTypes.forEach((uid) => {
//       const contentType = (strapi.contentTypes as Record<string, any>)[uid];
//     console.log("contentType: ", contentType)
//       if (contentType) {
//         contentType.lifecycles = {
//           ...(contentType.lifecycles || {}),
//           ...geometryLifecycle,
//         };
//       }
//     });
//   },

//   bootstrap() {},

// };
