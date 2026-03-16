const fs = require('fs');
const path = require('path');

const DEVICE = {
  name: 'Amazfit GTR 3',
  target: 'gtr-3',
  deviceSources: [226, 227],
  resolution: 454,
  designWidth: 480,
  shape: 'round',
};

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function generateAppJson(name) {
  return JSON.stringify({
    configVersion: 'v2',
    app: {
      appId: 1000000 + Math.floor(Math.random() * 999999),
      appName: name,
      appType: 'watchface',
      version: { code: 1, name: '1.0.0' },
      icon: 'images/preview.png',
      vender: 'developer',
      description: `${name} watchface for Amazfit GTR 3`,
    },
    permissions: [],
    runtime: {
      apiVersion: {
        compatible: '1.0.0',
        target: '1.0.1',
        minVersion: '1.0.0',
      },
    },
    targets: {
      [DEVICE.target]: {
        module: {
          watchface: {
            path: `watchface/${DEVICE.target}/index`,
            main: 1,
            editable: 0,
            lockscreen: 0,
          },
        },
        platforms: DEVICE.deviceSources.map(ds => ({
          name: 'gtr3',
          deviceSource: ds,
        })),
        designWidth: DEVICE.designWidth,
      },
    },
    i18n: { 'en-US': { appName: name } },
    defaultLanguage: 'en-US',
    debug: false,
  }, null, 2);
}

function generateAppJs() {
  return `App({
  globalData: {},
  onCreate() {
    console.log('app onCreate');
  },
  onDestroy() {
    console.log('app onDestroy');
  },
});
`;
}

function generateSensorConfig() {
  return JSON.stringify({
    sensors: {
      time: { enabled: true, updateInterval: 'minute' },
      heart: { enabled: true, updateInterval: 'realtime' },
      battery: { enabled: true },
      weather: { enabled: true },
      step: { enabled: true },
      calorie: { enabled: true },
      distance: { enabled: false },
      spo2: { enabled: false },
      stress: { enabled: false },
      pai: { enabled: false },
      sleep: { enabled: false },
    },
    display: {
      aod: false,
      editable: false,
    },
    device: {
      target: DEVICE.target,
      resolution: DEVICE.resolution,
      designWidth: DEVICE.designWidth,
      shape: DEVICE.shape,
    },
  }, null, 2);
}

function run(positional, flags) {
  const name = positional[0];
  if (!name) {
    console.error('Usage: gtr3 create <name> [--template digital|analog]');
    process.exit(1);
  }

  const template = flags.template || 'digital';
  const suiteRoot = path.resolve(__dirname, '..');
  const templateDir = path.join(suiteRoot, 'templates', template);

  if (!fs.existsSync(templateDir)) {
    console.error(`Template "${template}" not found. Available: digital, analog`);
    process.exit(1);
  }

  const facesDir = path.join(suiteRoot, 'my-faces');
  fs.mkdirSync(facesDir, { recursive: true });
  const projectDir = path.join(facesDir, name);

  if (fs.existsSync(projectDir)) {
    console.error(`Directory "${name}" already exists.`);
    process.exit(1);
  }

  console.log(`\n  Creating watchface "${name}" from ${template} template...\n`);

  // Copy template
  copyDirSync(templateDir, projectDir);

  // Write generated configs
  fs.writeFileSync(path.join(projectDir, 'app.json'), generateAppJson(name));
  fs.writeFileSync(path.join(projectDir, 'app.js'), generateAppJs());
  fs.writeFileSync(path.join(projectDir, 'sensor.config.json'), generateSensorConfig());

  const relPath = `my-faces/${name}`;
  console.log(`  Created: ${projectDir}`);
  console.log(`
  Project structure:
    ${relPath}/
      app.json               Zepp OS app configuration
      app.js                 App lifecycle
      sensor.config.json     Sensor connection config
      watchface/gtr-3/
        index.js             Main watchface code
      assets/gtr-3/
        images/              Image assets (454x454)

  Next steps:
    node bin/cli.js preview ${relPath}   Launch browser preview
    node bin/cli.js build ${relPath}     Validate & bundle
`);
}

module.exports = { run };
