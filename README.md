# Screen Counter Figma Plugin

A Figma plugin to count and group selected frames (screens) in your Figma file, with support for prefix grouping and easy selection navigation.

## Features
- Count selected frames/screens in Figma
- Group screens by custom prefixes (e.g., Dashboard, Orders)
- See unique and total frame counts
- Click to select and focus on frames in Figma
- Clean, modern UI with Tailwind CSS

## Installation
1. Clone this repository:
   ```sh
   git clone https://github.com/fahmimuhamad/Screen-counter-Figma-Plugin.git
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Build the plugin:
   ```sh
   npm run build
   ```
4. In Figma, go to `Plugins > Development > Import Plugin from Manifest...` and select the `manifest.json` file in this repo.

## Usage
- Select one or more frames in your Figma file.
- Open the plugin from the Figma plugins menu.
- (Optional) Enter prefixes to group screens (comma-separated).
- Click "Count Selected Screens" to see results.
- Click on any listed frame to focus it in Figma.
- Use the red "Reset" button to clear results and start over.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE) 