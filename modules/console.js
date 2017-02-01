'use strict';

const Chalk = require('chalk');

global.panic = function() {
  console.log(Chalk.red('panic: ' + arguments[0]),
    ...[].slice.call(arguments).slice(1));
  process.exit(-1);
}

global.error = function() {
  console.log(Chalk.red('error: ' + arguments[0]),
    ...[].slice.call(arguments).slice(1));
}

global.warn = function() {
  console.log(Chalk.yellow('warning: ' + arguments[0]),
    ...[].slice.call(arguments).slice(1));
}

global.info = function() {
  console.log(Chalk.green('info: ' + arguments[0]),
    ...[].slice.call(arguments).slice(1));
}
