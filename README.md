# amazfit-gtr3-watchface-editor

Development suite for creating, previewing, and building Amazfit GTR 3 watchfaces using the Zepp OS JavaScript API.

## Quick Start

```bash
npm install

node bin/cli.js create {your-watchface-name}            # scaffold into my-faces/{your-watchface-name}

node bin/cli.js preview my-faces/{your-watchface-name}  # open browser preview with hot reload

node bin/cli.js build my-faces/{your-watchface-name}    # validate and bundle
```
<img width="1918" height="839" alt="image" src="https://github.com/user-attachments/assets/2f75afba-bf0b-4e23-ae4b-2ac14d44af79" />

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

Install the Zeus CLI and deploy your watchface to a real device.

### Prerequisites

1. Install the Zeus CLI globally:
   ```bash
   npm i -g @zeppos/zeus-cli
   ```
2. Log in to your Zepp developer account:
   ```bash
   zeus login
   ```
3. Install the **Zepp** app on your phone and pair your watch
4. In the Zepp app, enable **Developer Mode** (Profile > Settings > About > tap 7 times)

### Device Configuration

Make sure `app.json` has the correct `deviceSource` values for your watch model:

| Model | deviceSource values |
|-------|-------------------|
| GTR 3 | 226, 227 |
| GTR 3 Pro | 229, 230, 242, 6095106 |

### Install via Bridge (recommended)

This pushes the watchface directly to your watch over the local network:

```bash
cd my-faces/{your-watchface-name}
zeus bridge
```

Then in the bridge console:
```
bridge$ connect
bridge$ install
```

The watchface will appear in your device's watchface list.

### Install via QR Preview (alternative)

```bash
cd my-faces/{your-watchface-name}
zeus preview
```

Scan the QR code using the **Zepp app scanner** (not your phone camera). This method uploads through Zepp's servers and can be unreliable.
