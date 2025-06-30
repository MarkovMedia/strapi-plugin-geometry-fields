# Geometry Fields plugin for Strapi

**Store and edit geospatial data with PostGIS in a Strapi v4 custom field.**

> **_NOTE:_**  For this plugin supported by Strapi v5, see [@gismark/strapi-geometry-fields](https://www.npmjs.com/package/@gismark/strapi-geometry-fields).

The plugin accepts WKT (Well-known text) from the API and stores it in a PostGIS column in the db table of the content type. You can use multiple geometry fields across different content types. All features are editable and draggable using the hosted [Leaflet.Editable](https://github.com/Leaflet/Leaflet.Editable) and [Path.Drag](https://github.com/Leaflet/Path.Drag.js/).

Below is an example following this WKT input: "GEOMETRYCOLLECTION (POINT (40 10),
LINESTRING (10 10, 20 20, 10 40),
POLYGON ((40 40, 20 45, 45 30, 40 40)))"

![Geometry Field example](https://raw.githubusercontent.com/MarkovMedia/strapi-plugin-geometry-fields/main/assets/strapi-plugin-geometry-fields.jpg)

## Installation

<pre> # with npm
npm install strapi-plugin-geometry-fields </pre>

<pre> # with yarn
yarn add strapi-plugin-geometry-fields </pre>

## Configuration

This plugin only runs with PostgreSQL and needs PostGIS to be installed. If you haven't already done so run this query in Postgres:

<pre>CREATE EXTENSION postgis;</pre>

For the Leaflet map and the markers to display you must allow Openstreetmap in your middlewares.js. Update "strapi::security" like so:

<pre>
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "img-src": ["'self'", "data:", "*.tile.openstreetmap.org"],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
</pre>

## Usage

### In the Content Type Builder

- Create a new collection type
- In the field selection, choose CUSTOM, select the Geometry field and give it a name
- Finish & Save

### In the code

Add this field to the schema.json of your content type ('geometry' can be any unique field name)

<pre>    "geometry": {
      "type": "customField",
      "customField": "plugin::geometry-fields.geometry"
    }</pre>

    ## Examples

### input as WKT

<pre>
{ 
  "data": {
    "geometry": { wkt: "POINT (30 10)" }   
  }
}
</pre>

## Tested with

- Strapi 4.25.22
- PostgreSQL 12.4
- PostGIS 3.0.2

## License

MIT

## Todo

- Add GeoJSON support
- Validate WKT / GeoJSON option
- Choose CRS (Coordinate Reference System) from settings
- Create & delete features in custom field
- Click feature shows popup with geo info
