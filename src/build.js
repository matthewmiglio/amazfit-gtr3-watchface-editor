const fs = require('fs');
const path = require('path');

function run(positional, flags) {
  const projectDir = path.resolve(positional[0] || '.');
  const outDir = path.join(projectDir, 'dist');

  console.log(`\n  Building watchface: ${projectDir}\n`);

  // Validate first
  const lint = require('./lint');
  try {
    lint.run(positional, flags);
  } catch (e) {
    // lint already printed errors
    process.exit(1);
  }

  // Read app.json
  const appJson = JSON.parse(fs.readFileSync(path.join(projectDir, 'app.json'), 'utf-8'));
  const appName = appJson.app?.appName || 'watchface';

  // Create dist directory
  fs.mkdirSync(outDir, { recursive: true });

  // Collect all source files
  const bundle = {
    'app.json': fs.readFileSync(path.join(projectDir, 'app.json'), 'utf-8'),
    'app.js': fs.readFileSync(path.join(projectDir, 'app.js'), 'utf-8'),
  };

  // Collect watchface files
  const watchfaceDir = path.join(projectDir, 'watchface');
  if (fs.existsSync(watchfaceDir)) {
    collectFiles(watchfaceDir, projectDir, bundle);
  }

  // Collect assets
  const assetsDir = path.join(projectDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    collectFiles(assetsDir, projectDir, bundle);
  }

  // Write manifest
  const manifest = {
    name: appName,
    version: appJson.app?.version?.name || '1.0.0',
    device: 'Amazfit GTR 3',
    resolution: '454x454',
    files: Object.keys(bundle),
    builtAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  // Copy all files to dist
  for (const [relPath, content] of Object.entries(bundle)) {
    const destPath = path.join(outDir, relPath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    if (typeof content === 'string') {
      fs.writeFileSync(destPath, content);
    } else {
      fs.copyFileSync(path.join(projectDir, relPath), destPath);
    }
  }

  // Copy sensor config if present
  const sensorConfig = path.join(projectDir, 'sensor.config.json');
  if (fs.existsSync(sensorConfig)) {
    fs.copyFileSync(sensorConfig, path.join(outDir, 'sensor.config.json'));
  }

  const fileCount = Object.keys(bundle).length;
  console.log(`  Output: ${outDir}`);
  console.log(`  Files: ${fileCount}`);
  console.log(`\n  Build complete. To deploy to device:`);
  console.log(`    1. Install Zeus CLI: npm i -g @zeppos/zeus-cli`);
  console.log(`    2. Run: zeus preview (scan QR with Zepp app)`);
  console.log(`    3. Or use zeus bridge for direct device install\n`);
}

function collectFiles(dir, rootDir, bundle) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, fullPath);
    if (entry.isDirectory()) {
      collectFiles(fullPath, rootDir, bundle);
    } else {
      bundle[relPath] = fs.readFileSync(fullPath, 'utf-8');
    }
  }
}

module.exports = { run };
