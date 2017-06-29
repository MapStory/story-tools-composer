# Story-tools Composer

## Deployment
- `npm install`
- `bower install`
- `webpack`
- `npm run server`
- `http://localhost:9090/`


## Development
### Style
- Add less files for individual components to the component's relevant directory in `app/`.
- In order for the style to be added to the bundled stylesheet used by the application, import it into `style/style.js`.
  - Syntax example: `import styles from ../app/map/style/map.less`
- All style's are bundled into `style/bundle.css`.
