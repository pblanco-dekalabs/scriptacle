#!/bin/node
const chalk = require('chalk');
const commander = require('commander');
const fs = require('fs');
const stacktrace = require('stacktrace-js');
const child_process = require('child_process');
const readline = require('readline');
const EventEmitter = require('events');

const getStack = (() => {
  const PRESETS = {
    normal: {
      min: 0,
      max: 5
    },
    short: {
      min: 1,
      max: 5
    },
    full: {
      min: 0,
      max: 0
    }
  }
  return (mode = 'normal') => stacktrace.getSync()
    .filter((_, i, a) => i > PRESETS[mode].min && i < a.length - PRESETS[mode].max)
    .map(s => `  ${s}`)
    .join('\n')
})()
const echo = (...args) => console.log(chalk(...args))
const ok = (...args) => echo(chalk.green`ok` + ' -', ...args)
const warn = (...args) => echo(chalk.yellow`warn` + ' -', ...args)
const err = (...args) => echo(chalk.red`err` + ' -', ...args)
const panic = (...args) => {
  let what = ''
  if (args.length > 0) {
    what = String.raw(...args)
  }
  echo(chalk.red`PANIC ${what}\n${getStack('short')}`)
  process.exit(1)
}
let cwd = null
const env = {}
const run = (...args) => {
  try {
    return child_process.execSync(String.raw(...args), {
      cwd,
      stdio: 'inherit',
      shell: true,
      env: {
        ...env,
        FORCE_COLORS: true
      }
    })
  } catch (err) {
    panic `Command "${String.raw(...args)}" failed!
  caused by: ${err.message}`
  }
}
const cd = (...args) => cwd = String.raw(...args)
cd.reset = () => cwd = null
const container = (...label) => ({
  stdio: 'pipe',
  env: {},
  /** @var {ReturnType<import('child_process').spawn>} */
  process: null,
  color: 'yellow',
  events: new EventEmitter(),
  once(event, fn) {
    this.events.once(event, fn)
  },
  on(event, fn) {
    this.events.on(event, fn)
  },
  spawn(command, ...args) {
    this.process = child_process.spawn(command, args, {
      cwd,
      stdio: this.stdio,
      env: {
        ...env,
        ...this.env,
        FORCE_COLORS: true
      }
    });
    this.process.once('close', (...args) => this.events.emit('close', ...args));
    const rl = readline.createInterface({ input: this.process.stdout });
    rl.on('line', line => {
      this.events.emit('line', line);
      echo`[{yellow ${String.raw(...label)}}]: ${line}`
    });
    this.events.emit('ready');
  }
})
const cmd = commander.program.option('-f, --full', 'Enables the full requirement check').parse()

const options = cmd.opts();
const args = cmd.args;
const when = (flag, fn, not) => {
  if (options[flag]) {
    fn()
  } else if (typeof not === 'function') {
    not()
  }
}

module.exports = {
  echo,
  ok,
  warn,
  err,
  panic,
  getStack,
  cd,
  run,
  container,
  options,
  args,
  when,
  env,
  fs,
  child_process,
  stacktrace,
  chalk,
  commander
}

if (require.main) {
  for (const key in module.exports) {
    global[key] = module.exports[key];
  }
}
