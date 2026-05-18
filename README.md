# Figma JSON Extractor

A lightweight, local Figma plugin that extracts the raw JSON layout and styling data from your Figma designs. 

This tool is currently **in development** and operates entirely offline. It bypasses the Figma REST API rate limits by reading the document structure directly from the Figma Desktop App.

## Features
- **Offline & Unlimited:** Bypasses Figma's REST API limits (no PAT required).
- **Targeted Extraction:** Select specific nodes (frames, buttons, etc.) to extract, or extract the entire page.
- **Rich CSS Properties:** Extracts dimensions, auto-layout/flexbox properties, typography details, borders, strokes, fills, and effects (shadows/blurs).
- **Sanitized Output:** Automatically handles Figma's internal `figma.mixed` symbols to prevent crashes during serialization.

## How to Test / Install Locally

Since this plugin is in active development and not yet published to the Figma Community, you can run it locally using the `manifest.json` file.

**Requirements:** You must use the **Figma Desktop App** (local plugins cannot be loaded in the browser version).

1. Clone or download this repository to your computer.
2. Open the Figma Desktop App.
3. Open any design file.
4. From the top menu bar, go to **Plugins** -> **Development** -> **Import plugin from manifest...**
5. Navigate to the folder where you saved this project and select the `manifest.json` file.
6. The plugin will now appear in your menu under **Plugins** -> **Development** -> **Extract JSON Local**.

## Usage
1. **To extract specific elements:** Select one or more nodes (frames, shapes, text, etc.) in your Figma file, then run the plugin. It will download a JSON file containing only those elements.
2. **To extract the whole page:** Click on the empty canvas (deselect everything), then run the plugin. It will extract the entire current page.

## Contributing / Feedback
This is an ongoing project. Feel free to open issues or submit pull requests if you have suggestions for extracting additional properties or improving the serialization logic!

---
*Built by Tayza with GEMINI CLI*
