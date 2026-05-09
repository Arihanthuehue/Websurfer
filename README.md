<<<<<<< HEAD
# Websurfer
=======
# WebSurfer

WebSurfer is a Google Chrome extension that injects a DOM-aware physics game overlay into any website. It allows you to spawn a 2D character that can jump and walk across the different elements (buttons, links, images, containers) present on the web page.

## Features

- **DOM-Aware Physics**: WebSurfer scans the underlying webpage for specific HTML elements (like buttons, navigation bars, images, text blocks, etc.) and turns them into solid platform
- **Customizable Character**: You can change your surfer's name and color directly from the extension popup.
- **Dynamic Rescanning**: The physics engine automatically detects when the page scrolls, resizes, or dynamically updates (like loading new chat messages or infinite scrolling), and adjusts platforms accordingly.
- **Fully Featured Platformer Mechanics**: Includes jumping, fast-falling, coyote time, jump buffering, variable jump heights, and dropping through platforms.
- **"Make it to the end" Objective**: Try to reach the very bottom of the webpage to win!

## How It Works

- **Manifest V3**: Built using modern Chrome Extension APIs.
- **DOM Scanner (`engine/dom-scanner.js`)**: Constantly monitors the page using `MutationObserver` and intercepts scroll events to identify elements like `button`, `a`, `header`, `nav`, and other common structural containers. It passes the position and bounding boxes of these elements to the physics engine.
- **Physics Engine (`engine/physics.js`)**: A custom 2D physics engine running at 60fps within a `requestAnimationFrame` loop. It handles gravity, friction, collision detection against the dynamically generated DOM platforms, and complex inputs.
- **Renderer (`engine/renderer.js`)**: A custom HTML5 Canvas rendering pipeline that draws the character, drop shadows, and visual representations of the DOM platforms over the page content. The canvas is `pointer-events: none`, allowing you to interact with the website normally while the game runs.
- **Input (`engine/input.js`)**: Captures WASD and Arrow key inputs, automatically suspending them if you click into a text input field to avoid interrupting your normal web browsing.

## Controls

- **Move**: `Arrow Left` / `Arrow Right` (or `A` / `D`)
- **Jump**: `Space` / `Arrow Up` / `W`
- **Fast Fall**: `Arrow Down` / `S`
- **Drop through platform**: `Shift + Down` / `Shift + S`
- **Disable Extension**: `Escape` (or use the extension popup toggle)

## Installation

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click on **Load unpacked** and select the directory containing this repository.
5. The WebSurfer icon should appear in your extensions bar!

## File Structure

- `manifest.json`: The Chrome extension configuration file.
- `background.js`: Service worker managing state and inter-script communication.
- `content.js`: Main script injected into pages, setting up the canvas overlay and game loop.
- `engine/`: Core game logic:
  - `dom-scanner.js`: Maps HTML elements to physical bounds.
  - `input.js`: Keyboard input listener with text-field safety.
  - `physics.js`: 2D physics logic.
  - `renderer.js`: HTML5 Canvas rendering layer.
- `popup/`: Extension popup UI to toggle the game and customize the player.
- `icons/`: Extension icons.
>>>>>>> 7fe2a49 (onthegoman)
