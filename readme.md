# UKDE Report

## Setup

1. Clone this repo
2. Run `yarn` to get all dependencies
3. Profit?

## Development

Run `npm run dev:start` to run webpack in watch mode and load the app using live-server in your browser.

## Releases

Run `npm run build` to run webpack in production mode.  It will write its files to the `dist` folder.

NOTE: if you are not using a continuous development server there probably should be a clean step added to the build step that will delete the `dist` folder.

## License

UKDE Report is released under the [MIT License](LICENSE).
