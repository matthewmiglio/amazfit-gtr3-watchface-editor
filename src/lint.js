const fs = require('fs');
const path = require('path');

const DEVICE = {
  resolution: 454,
  designWidth: 480,
};

function run(positional, flags) {
  const projectDir = path.resolve(positional[0] || '.');
  const issues = [];
  const warnings = [];

  console.log(`\n  Linting watchface project: ${projectDir}\n`);

  // Check app.json
  const appJsonPath = path.join(projectDir, 'app.json');
  if (!fs.existsSync(appJsonPath)) {
    issues.push('Missing app.json');
  } else {
    try {
      const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      if (appJson.app?.appType !== 'watchface') {
        issues.push('app.json: appType must be "watchface"');
      }
      if (!appJson.targets && !appJson.module) {
        issues.push('app.json: missing targets or module configuration');
      }
    } catch (e) {
      issues.push(`app.json: invalid JSON - ${e.message}`);
    }
  }

  // Check app.js
  if (!fs.existsSync(path.join(projectDir, 'app.js'))) {
    issues.push('Missing app.js');
  }

  // Check watchface entry
  const watchfacePath = path.join(projectDir, 'watchface', 'gtr-3', 'index.js');
  if (!fs.existsSync(watchfacePath)) {
    issues.push('Missing watchface/gtr-3/index.js');
  } else {
    const code = fs.readFileSync(watchfacePath, 'utf-8');
    if (!code.includes('WatchFace(')) {
      issues.push('watchface/gtr-3/index.js: must call WatchFace({...})');
    }
    if (!code.includes('build')) {
      warnings.push('watchface/gtr-3/index.js: missing build() lifecycle method');
    }

    // Check for common mistakes
    if (code.includes('document.') || code.includes('window.')) {
      issues.push('watchface/gtr-3/index.js: browser APIs (document/window) are not available on Zepp OS');
    }
    if (code.includes('require(') && code.includes('node_modules')) {
      warnings.push('watchface/gtr-3/index.js: Node.js modules are not available on Zepp OS');
    }
  }

  // Check assets directory
  const assetsDir = path.join(projectDir, 'assets', 'gtr-3');
  if (!fs.existsSync(assetsDir)) {
    warnings.push('Missing assets/gtr-3/ directory');
  } else {
    // Check for oversized images
    const checkImages = (dir) => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          checkImages(fullPath);
        } else if (/\.(png|jpg|jpeg)$/i.test(entry.name)) {
          const stat = fs.statSync(fullPath);
          if (stat.size > 100 * 1024) {
            warnings.push(`Large image (${Math.round(stat.size / 1024)}KB): ${path.relative(projectDir, fullPath)}`);
          }
        }
      }
    };
    checkImages(assetsDir);
  }

  // Check sensor config
  const sensorConfigPath = path.join(projectDir, 'sensor.config.json');
  if (fs.existsSync(sensorConfigPath)) {
    try {
      JSON.parse(fs.readFileSync(sensorConfigPath, 'utf-8'));
    } catch (e) {
      issues.push(`sensor.config.json: invalid JSON - ${e.message}`);
    }
  }

  // Report
  if (issues.length === 0 && warnings.length === 0) {
    console.log('  All checks passed.\n');
  } else {
    if (issues.length > 0) {
      console.log('  Errors:');
      issues.forEach(i => console.log(`    ✗ ${i}`));
      console.log();
    }
    if (warnings.length > 0) {
      console.log('  Warnings:');
      warnings.forEach(w => console.log(`    ⚠ ${w}`));
      console.log();
    }
  }

  if (issues.length > 0) {
    process.exit(1);
  }
}

module.exports = { run };
