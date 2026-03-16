#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

const COMMANDS = {
  create: require('../src/create'),
  preview: require('../src/preview-server'),
  build: require('../src/build'),
  lint: require('../src/lint'),
  help: showHelp,
};

function showHelp() {
  console.log(`
  amazfit-gtr3 watchface development suite

  Usage:
    gtr3 <command> [options]

  Commands:
    create <name>          Scaffold a new watchface project
      --template <type>    Template: digital (default), analog
    preview [path]         Launch browser preview with hot reload
      --port <number>      Server port (default: 3456)
      --mock <file>        Custom sensor mock data JSON
    build [path]           Validate and bundle watchface project
    lint [path]            Check watchface code for common issues
    help                   Show this help message

  Examples:
    gtr3 create my-cool-face --template analog
    gtr3 preview ./my-cool-face
    gtr3 build ./my-cool-face
`);
}

// --- Parse args ---
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === 'help' || command === '--help') {
  showHelp();
  process.exit(0);
}

if (!COMMANDS[command]) {
  console.error(`Unknown command: ${command}\nRun "gtr3 help" for usage.`);
  process.exit(1);
}

// Parse flags
const flags = {};
const positional = [];
for (let i = 1; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].slice(2);
    flags[key] = args[i + 1] || true;
    i++;
  } else {
    positional.push(args[i]);
  }
}

const run = COMMANDS[command];
if (typeof run === 'function') {
  run(positional, flags);
} else if (typeof run.run === 'function') {
  run.run(positional, flags);
} else {
  console.error(`Command "${command}" is not properly configured.`);
  process.exit(1);
}
