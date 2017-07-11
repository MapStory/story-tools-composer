# Story-tools Composer

## Deployment
- `npm install`
- `bower install`
- `webpack`
- `npm run server`
- `http://localhost:9090/`

### Proxy Server
- You can proxy map data from mapstory.org using the following endpoint format:
`http://localhost:8001/#!/maps/<map_id>/data`
  - example: `http://localhost:9090/#!/maps/1412/data`

## Development
### Style
- Add less files for individual components to the component's relevant directory in `app/`.
- In order for the style to be added to the bundled stylesheet used by the application, import it into `style/style.js`.
  - Syntax example: `import styles from ../app/map/style/map.less`
- All style's are bundled into `style/bundle.css`.

### App Config
Global configuration constants are set in the `app/app.js` module constant `config` object.

### Testing
`npm run test`
