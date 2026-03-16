#!/usr/bin/env node

/**
 * Test suite for the watchface development suite.
 * Runs without external test frameworks — plain Node.js assertions.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BIN = path.join(ROOT, 'bin', 'cli.js');
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, error: e.message });
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    console.log(`    ${e.message}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function cli(args) {
  return execSync(`node "${BIN}" ${args}`, { cwd: ROOT, encoding: 'utf-8', timeout: 10000 });
}

// --- Cleanup helper ---
const TMP_PROJECT = path.join(ROOT, 'my-faces', '_test_tmp_face');

function cleanup() {
  if (fs.existsSync(TMP_PROJECT)) {
    fs.rmSync(TMP_PROJECT, { recursive: true, force: true });
  }
}

// ============================================================
console.log('\n  CLI Tests\n');
// ============================================================

test('help command prints usage', () => {
  const out = cli('help');
  assert(out.includes('Usage:'), 'Should show usage');
  assert(out.includes('create'), 'Should list create command');
  assert(out.includes('preview'), 'Should list preview command');
});

test('unknown command exits with error', () => {
  try {
    cli('fakecmd');
    assert(false, 'Should have thrown');
  } catch (e) {
    assert(e.message.includes('Unknown command') || e.status !== 0, 'Should error');
  }
});

// ============================================================
console.log('\n  Scaffolding Tests\n');
// ============================================================

cleanup();

test('create scaffolds a digital project', () => {
  const out = cli(`create _test_tmp_face --template digital`);
  assert(out.includes('Created'), 'Should confirm creation');
  assert(fs.existsSync(TMP_PROJECT), 'Project dir should exist');
});

test('scaffolded project has app.json', () => {
  const appJson = JSON.parse(fs.readFileSync(path.join(TMP_PROJECT, 'app.json'), 'utf-8'));
  assert(appJson.app.appType === 'watchface', 'appType should be watchface');
  assert(appJson.targets['gtr-3'], 'Should have gtr-3 target');
});

test('scaffolded project has app.js', () => {
  const content = fs.readFileSync(path.join(TMP_PROJECT, 'app.js'), 'utf-8');
  assert(content.includes('App('), 'Should register App');
  assert(content.includes('onCreate'), 'Should have onCreate');
});

test('scaffolded project has watchface entry', () => {
  const entry = path.join(TMP_PROJECT, 'watchface', 'gtr-3', 'index.js');
  assert(fs.existsSync(entry), 'watchface/gtr-3/index.js should exist');
  const content = fs.readFileSync(entry, 'utf-8');
  assert(content.includes('WatchFace('), 'Should call WatchFace()');
  assert(content.includes('build'), 'Should have build()');
  assert(content.includes('hmUI.createWidget'), 'Should use hmUI');
  assert(content.includes('hmSensor.createSensor'), 'Should use hmSensor');
});

test('scaffolded project has sensor.config.json', () => {
  const config = JSON.parse(fs.readFileSync(path.join(TMP_PROJECT, 'sensor.config.json'), 'utf-8'));
  assert(config.sensors, 'Should have sensors section');
  assert(config.sensors.time.enabled === true, 'Time sensor should be enabled');
  assert(config.device.resolution === 454, 'Resolution should be 454');
});

test('scaffolded project has assets directory', () => {
  assert(fs.existsSync(path.join(TMP_PROJECT, 'assets', 'gtr-3', 'images')), 'assets/gtr-3/images should exist');
});

test('create refuses duplicate name', () => {
  try {
    cli(`create _test_tmp_face`);
    assert(false, 'Should have thrown');
  } catch (e) {
    assert(e.message.includes('already exists') || e.status !== 0, 'Should error on duplicate');
  }
});

test('create refuses invalid template', () => {
  try {
    cli(`create _test_bad --template nonexistent`);
    assert(false, 'Should have thrown');
  } catch (e) {
    assert(e.message.includes('not found') || e.status !== 0, 'Should error on bad template');
  }
});

// ============================================================
console.log('\n  Lint Tests\n');
// ============================================================

test('lint passes on valid project', () => {
  const out = cli(`lint my-faces/_test_tmp_face`);
  assert(out.includes('All checks passed'), 'Should pass lint');
});

test('lint catches missing app.json', () => {
  const emptyDir = path.join(ROOT, '_test_empty');
  fs.mkdirSync(emptyDir, { recursive: true });
  try {
    cli(`lint _test_empty`);
    assert(false, 'Should have thrown');
  } catch (e) {
    assert(e.status !== 0, 'Should fail lint');
  }
  fs.rmSync(emptyDir, { recursive: true, force: true });
});

// ============================================================
console.log('\n  Build Tests\n');
// ============================================================

test('build produces dist output', () => {
  const out = cli(`build my-faces/_test_tmp_face`);
  assert(out.includes('Build complete'), 'Should complete build');
  const distDir = path.join(TMP_PROJECT, 'dist');
  assert(fs.existsSync(distDir), 'dist/ should exist');
  assert(fs.existsSync(path.join(distDir, 'manifest.json')), 'manifest.json should exist');
  assert(fs.existsSync(path.join(distDir, 'app.json')), 'app.json should be in dist');
  assert(fs.existsSync(path.join(distDir, 'watchface', 'gtr-3', 'index.js')), 'watchface entry should be in dist');
});

test('build manifest has correct metadata', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(TMP_PROJECT, 'dist', 'manifest.json'), 'utf-8'));
  assert(manifest.device === 'Amazfit GTR 3', 'Device should be GTR 3');
  assert(manifest.resolution === '454x454', 'Resolution should be 454x454');
  assert(manifest.files.length > 0, 'Should list files');
  assert(manifest.builtAt, 'Should have build timestamp');
});

// ============================================================
console.log('\n  Template Tests\n');
// ============================================================

test('digital template exists and is valid', () => {
  const entry = path.join(ROOT, 'templates', 'digital', 'watchface', 'gtr-3', 'index.js');
  assert(fs.existsSync(entry), 'digital template should exist');
  const code = fs.readFileSync(entry, 'utf-8');
  assert(!code.includes('document.'), 'Should not use browser APIs');
  assert(!code.includes('window.'), 'Should not use browser APIs');
});

test('analog template exists and is valid', () => {
  const entry = path.join(ROOT, 'templates', 'analog', 'watchface', 'gtr-3', 'index.js');
  assert(fs.existsSync(entry), 'analog template should exist');
  const code = fs.readFileSync(entry, 'utf-8');
  assert(code.includes('TIME_POINTER'), 'Analog should use TIME_POINTER');
  assert(!code.includes('document.'), 'Should not use browser APIs');
});

// ============================================================
console.log('\n  Library Tests\n');
// ============================================================

test('lib/sensors.js exports expected functions', () => {
  const sensors = require(path.join(ROOT, 'lib', 'sensors'));
  assert(typeof sensors.createSensors === 'function', 'Should export createSensors');
  assert(typeof sensors.bindToWidget === 'function', 'Should export bindToWidget');
  assert(typeof sensors.formatTime === 'function', 'Should export formatTime');
  assert(typeof sensors.getWeatherInfo === 'function', 'Should export getWeatherInfo');
  assert(typeof sensors.progressPercent === 'function', 'Should export progressPercent');
});

test('lib/sensors.js formatTime works correctly', () => {
  const { formatTime } = require(path.join(ROOT, 'lib', 'sensors'));
  assert(formatTime(9, 5) === '09:05', 'Should pad single digits');
  assert(formatTime(14, 30) === '14:30', 'Should handle double digits');
  assert(formatTime(9, 5, 3) === '09:05:03', 'Should include seconds');
});

test('lib/sensors.js progressPercent works correctly', () => {
  const { progressPercent } = require(path.join(ROOT, 'lib', 'sensors'));
  assert(progressPercent(5000, 10000) === 50, 'Should be 50%');
  assert(progressPercent(15000, 10000) === 100, 'Should cap at 100%');
  assert(progressPercent(0, 10000) === 0, 'Should be 0%');
  assert(progressPercent(100, 0) === 0, 'Should handle zero target');
});

test('lib/widgets.js exports expected functions', () => {
  const widgets = require(path.join(ROOT, 'lib', 'widgets'));
  assert(typeof widgets.background === 'function', 'Should export background');
  assert(typeof widgets.text === 'function', 'Should export text');
  assert(typeof widgets.timeDisplay === 'function', 'Should export timeDisplay');
  assert(typeof widgets.arcProgress === 'function', 'Should export arcProgress');
  assert(typeof widgets.analogClock === 'function', 'Should export analogClock');
  assert(widgets.RESOLUTION === 454, 'Resolution should be 454');
  assert(widgets.CENTER === 227, 'Center should be 227');
});

// ============================================================
console.log('\n  Preview Mock Tests\n');
// ============================================================

test('preview/zepp-mock.js is valid JavaScript', () => {
  const code = fs.readFileSync(path.join(ROOT, 'preview', 'zepp-mock.js'), 'utf-8');
  // Check it parses without syntax errors (wrap in function to avoid execution)
  new Function(code);
});

test('preview/index.html exists and references zepp-mock.js', () => {
  const html = fs.readFileSync(path.join(ROOT, 'preview', 'index.html'), 'utf-8');
  assert(html.includes('zepp-mock.js'), 'Should reference mock script');
  assert(html.includes('watchCanvas'), 'Should have canvas element');
  assert(html.includes('454'), 'Should reference 454 resolution');
});

// ============================================================
// Cleanup and report
// ============================================================

cleanup();

console.log(`\n  ────────────────────────`);
console.log(`  ${passed + failed} tests, \x1b[32m${passed} passed\x1b[0m${failed > 0 ? `, \x1b[31m${failed} failed\x1b[0m` : ''}`);

if (failures.length > 0) {
  console.log(`\n  Failures:`);
  failures.forEach(f => console.log(`    \x1b[31m✗\x1b[0m ${f.name}: ${f.error}`));
}

console.log();
process.exit(failed > 0 ? 1 : 0);
