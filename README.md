# amazfit-gtr3-watchface-editor

Development suite for creating, previewing, and building Amazfit GTR 3 watchfaces using the Zepp OS JavaScript API.

## Quick Start

```bash
npm install

node bin/cli.js create {your-watchface-name}            # scaffold into my-faces/{your-watchface-name}

node bin/cli.js preview my-faces/{your-watchface-name}  # open browser preview with hot reload

node bin/cli.js build my-faces/{your-watchface-name}    # validate and bundle
```

## Commands

| Command | Description |
|---------|-------------|
| `create <name> [--template digital\|analog]` | Scaffold a new watchface project |
| `preview [path] [--port 3456]` | Launch browser preview with hot reload |
| `build [path]` | Validate and bundle for deployment |
| `lint [path]` | Check for common issues |

## Browser Preview

The preview renders a 454x454 round canvas simulating the GTR 3 display. Features:

- **Live clock** — real-time time updates
- **Sensor controls** — adjust heart rate, battery, steps, weather, SpO2, stress via sliders
- **Code editor** — edit watchface code and run it instantly
- **Widget inspector** — see all active widgets and their properties
- **Console** — captures `console.log/error/warn` output
- **Hot reload** — auto-reloads when you edit files in your project

## Project Structure (scaffolded)

```
my-faces/{your-watchface-name}/
  app.json               Zepp OS configuration
  app.js                 App lifecycle
  sensor.config.json     Sensor connection config
  watchface/gtr-3/
    index.js             Watchface code (WatchFace lifecycle)
  assets/gtr-3/
    images/              PNG assets (454x454 native resolution)
```

## Available APIs in Watchface Code

### Widgets (`hmUI.createWidget`)
TEXT, TEXT_TIME, TEXT_IMG, FILL_RECT, STROKE_RECT, CIRCLE, ARC_PROGRESS, LINE_PROGRESS, TIME_POINTER, IMG, WIDGET_DELEGATE, and more.

### Sensors (`hmSensor.createSensor`)
TIME, HEART, BATTERY, STEP, CALORIE, WEATHER, SPO2, STRESS, PAI, SLEEP, DISTANCE, STAND.

### Helper Libraries
- `lib/sensors.js` — `createSensors()`, `bindToWidget()`, `getWeatherInfo()`
- `lib/widgets.js` — `background()`, `text()`, `timeDisplay()`, `arcProgress()`, `analogClock()`

## Templates

- **digital** — Large time display, date, heart rate, steps arc, battery, weather
- **analog** — Classic clock hands, tick marks, date window, HR sub-dial, battery bar

## Deploying to Device

After building, use the official Zepp OS Zeus CLI to install on your GTR 3:

```bash
npm i -g @zeppos/zeus-cli
zeus preview          # scan QR code with Zepp app
```
