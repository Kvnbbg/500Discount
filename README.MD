# Tokyo TCG Hub & Star Bazaar

A retro-futuristic, single-page web experience that blends trading card quests, electric car customization vibes, and playful productivity tools (coin game, math calculator, memo windows) into one immersive interface.

![Car Image](/assets/pictures/car.jpg)

[Play the App!](https://kvnbbg.github.io/500Discount/index.html)

## Product Scope

Tokyo TCG Hub & Star Bazaar is a static web experience that delivers:

- A one-screen retro arcade UI with animated ambiance.
- Quest checklists that reward you with a progress score.
- A coin-combination mini-game for tactical decision-making.
- A safe, in-browser math calculator.
- Memo windows for jotting down ideas.

## Prerequisites

- **Node.js 20+** (for linting, tests, and build-time config generation)
- **Python 3** or any static file server (for local previewing)

## Install

```bash
git clone https://github.com/kvnbbg/500Discount.git
cd 500Discount
npm install
```

## Run

Generate the runtime config (optional, but recommended when you change config values):

```bash
npm run build
```

Start a local static server (modules require a server, not a `file://` URL):

```bash
python3 -m http.server 5173
```

Then open:

```
http://localhost:5173/index.html
```

## Configuration

Runtime configuration is stored in `config/app-config.json` and compiled into `assets/js/runtime-config.js` during `npm run build`.

Optional environment overrides (copy `.env.example` → `.env`):

```bash
APP_AI_INTERVAL_MS=3000
APP_COIN_GAME_STEP_DELAY_MS=700
APP_FIRST_RUN_HELP=true
APP_LOG_LEVEL=info
```

## Usage

### Command Palette (CLI)

Type commands into the command input field (or use `Alt+R`, `Alt+N`, `Alt+T` shortcuts):

```text
help
reset
next
toggle
magicword
```

### JavaScript API (Browser Console)

```js
window.TokyoTCG.resetQuests();
window.TokyoTCG.validateNextQuest();
window.TokyoTCG.toggleTheme();
```

## Troubleshooting

- **Blank page or broken module imports**: Serve the site with a local server (see Run section).
- **Config changes not reflected**: Re-run `npm run build` to regenerate `assets/js/runtime-config.js`.
- **Memo saves are missing**: LocalStorage might be disabled or blocked by browser settings.

## Security Notes

- The app runs fully in the browser and stores memo data in LocalStorage only.
- No user data is transmitted to a backend.
- The main entrypoint uses a strict Content Security Policy (CSP) to prevent inline script execution.
- `carCustomization.html` loads Three.js from a public CDN, so only open it when network access is available.

## Project Structure

```
assets/
  css/app.css           # Main styles
  js/                   # App modules and runtime config
config/app-config.json  # Runtime configuration
scripts/build.js        # Generates runtime config
index.html              # Primary UI entrypoint
carCustomization.html   # Optional 3D demo entrypoint
```

## Contributing

1. Fork the repo and create your branch: `git checkout -b feat/my-change`.
2. Install dependencies: `npm install`.
3. Run checks: `npm run lint` and `npm run test`.
4. Commit with a clear message and open a pull request.

## License

Mozilla License. See [LICENSE](LICENSE).
