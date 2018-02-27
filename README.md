# Story-tools Composer

## Deployment

### Local Standalone
- `yarn install`
- `webpack`
- `yarn run server`
- `http://localhost:9090/`

### Docker
- `docker-compose build`
- `docker-compose up -d`
- `http://localhost:9090`
- To test: `docker-compose run --rm composer --test
- To upgrade dependencies: `docker-compose run --rm composer --dep-upgrade`
- Interactive shell:
  - In a new container: `docker-compose run --rm composer --shell`
  - In the container with the running server: `docker-compose attach composer /bin/bash`

## Development

### Adding Story-tools to your development environment
These steps are unnecessary when using the Docker deployment.
- Ensure that [story-tools](https://github.com/MapStory/story-tools) is a parallel directory to `story-tools-composer`.
- `rm -rf node_modules/story-tools`
- Symlink your parallel `story-tools` directory to the `story-tools` directory in `story-tools-composer/node_modules`:
  - From `story-tools-composer` directory: `ln -s /absolute/path/to/story-tools node_modules/story-tools`
- After making any changes to Story-tools, run `gulp scripts` from the `story-tools` directory and they should appear in composer.

### Adding layers
Navigate to the Story-layers tab and begin typing to see a list of available layers. Currently, the layers are being pulled from the mapstory.org Geoserver, and not all of them are functional. The one I've been using to test with is `Green Iguana`.

### Style
- Add less files for individual components to the component's relevant directory in `app/`.
- In order for the style to be added to the bundled stylesheet used by the application, import it into `style/style.js`.
  - Syntax example: `import styles from ../app/map/style/map.less`
- All style's are bundled into `style/bundle.css`.

### App Config
Global configuration constants are set in the `app/app.js` module constant `appConfig` object.

### Testing
`npm run test`

### <a name="developers">Developers!</a>
This project is being created as a more lightweight and maintainable alternative to the [MapLoom](https://github.com/MapStory/MapLoom) client. The application is leveraging the Story-tools library, which broadly has two sections:

- a plain vanilla JavaScript library that provides various helpers for manipulating time data. This stuff can be found in the `core` and `edit` subdirectories in the [lib](https://github.com/MapStory/story-tools/tree/master/lib) directory of the repo.
- A set of Angular directives that provide temporal UI components, which are discussed below. These directives live in the [ng](https://github.com/MapStory/story-tools/tree/master/lib/ng) subdirectory of the `lib` directory.

The core functionality that the current product should provide is:
- <b>A time slider</b> that allows temporal feature playback. This functionality is provided by the [TimeController directive in Story-tools](https://github.com/MapStory/story-tools/blob/master/lib/ng/core/time/directives.js) and already implemented.
- <b>Story-pins</b>. These are features that are activated at a specific point or range in time during the playback of a Mapstory. Media can be embedded in the popups of these features. Check out the [MapLoom Storypin component](https://github.com/MapStory/MapLoom/tree/feature/composer-wip/src/common/storypin) for an implementation of this. A lot of code from this implementation can probably be reused in this project, but should be refactored, tested, etc.
- <b>Story-frames</b>, aka "story boxes." These are user-selected zoom scales and pan locations that can be associated with a point or range of time during the playback of a Mapstory.
- <b>Chapter Navigation</b>. Mapstories can be broken into "chapters," which are individual Open Layers maps with their own associated layers, layer styles, pins, and frames.
- <b>Custom playback configurations</b>. These configurations include playback speed; whether you would like a cumulative rather than instant view of your data as it plays across the time range of your map; and more. This is currently being handled through the time slider directive, but if you need to access any of the functionality outside of that component -- like if you wanted to change the map playback speed from the sidebar -- then the [Story-tools playback settings template](https://github.com/MapStory/story-tools/blob/master/lib/templates/core/time/playback-settings.html) may be a good place to start.
- <b>Layer styling</b>. This one's gonna be so _fun_. Talk to Emily Ashley about this. She knows more than me, your beloved README file.
- <b>Saving & loading</b>. The Mapstory configuration that gets saved to the server should include an array of individual chapter configs, which are themselves an object containing: a reference to the layers that exist on the map; pins; boxes; and metadata information such as title, description, etc.
