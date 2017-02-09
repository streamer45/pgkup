'use strict';

require('./modules/console');
const exec = require('child_process').execSync;
const fs = require('fs');

function loadConfig() {
  let config;
  const configFile = process.argv[2];
  if (!configFile) panic('I need a valid configuration file');
  try {
    config = require(__dirname + '/' + configFile);
  } catch(e) {
    panic('cannot read configuration file');
  }
  return config;
}

function validateConfig(config) {
  if (!config.db) panic('database name is required');
  if (!config.path) panic('backups path is required');
  if (!config.backups) {
    warn('no backups object defined in config, using defaults');
    config.backups = {
      hours: 24,
      days: 7,
      weeks: 4,
      months: 12
    };
  }
}

function initDir(path) {
  try {
    fs.accessSync(path, fs.constants.R_OK | fs.constants.W_OK);
  } catch(e) {
    if (e.code === 'ENOENT') {
      fs.mkdirSync(path);
    } else {
      panic(e.message);
    }
  }
}

function initDirs(config) {
  try {
    fs.accessSync(config.path, fs.constants.R_OK | fs.constants.W_OK);
  } catch(e) {
    panic(e.message);
  }
  for (const dir in config.backups) {
    initDir(config.path + '/' + dir);
  }
}

function makeBackupPlan(config) {
  const plan = {
    create: [],
    destroy: []
  };
  const durations = {
    hours: 60 * 60 * 1000,
    days: 60 * 60 * 24 * 1000,
    weeks: 60 * 60 * 24 * 7 * 1000,
    months: 60 * 60 * 24 * 30 * 1000
  };
  const now = new Date().getTime();
  for (const dir in config.backups) {
    if (!durations[dir]) continue;
    const backups = [];
    const files = fs.readdirSync(config.path + '/' + dir);
    for (let i = 0; i < files.length; ++i) {
      if (files[i].substr(0, config.db.length + 1) !== config.db + '_') {
        warn('badly named file: ' + config.path + '/' + dir +
         '/' + files[i]);
      }
      const ts = parseInt(files[i].substr(config.db.length + 1));
      if (isNaN(ts) || ts <= 0 || ts > new Date().getTime()) {
        warn('bad timestamp in: ' + config.path + '/' + dir +
         '/' + files[i]);
      } else {
        backups.push({
          ts: ts,
          filename: config.path + '/' + dir + '/' + files[i]
        });
      }
    }
    backups.sort((a, b) => {
      if (a.ts === b.ts) return 0;
      if (a.ts < b.ts) return 1;
      if (a.ts > b.ts) return -1;
    });
    const diff = now - backups[0].ts - durations[dir];
    if (config.backups[dir] && backups.length > config.backups[dir]) {
      for (let i = config.backups[dir]; i < backups.length; ++i) {
        plan.destroy.push(backups[i].filename);
      }
    }
    if (backups.length === 0 || diff > -300000) {
      plan.create.push(config.path + '/' + dir + '/' + config.db + '_' +
       now + '.sql.gz');
      if (config.backups[dir] && backups.length > config.backups[dir]) {
        plan.destroy.push(backups[config.backups[dir] - 1].filename);
      }
    } else {
      //console.log(now, backups[0].ts, durations[dir], diff);
    }
  }
  return plan;
}

function runBackupPlan(plan, config) {
  for (let i = 0; i < plan.create.length; ++i) {
    try {
      exec(`pg_dump ${config.db} -Z 3 > ${plan.create[i]}`,
       { stdio: ['ignore', 'ignore', 'pipe'] });
      info(plan.create[i] + ' was created');
    } catch(e) {
      error(e.message);
      fs.unlinkSync(plan.create[i]);
    }
  }
  for (let i = 0; i < plan.destroy.length; ++i) {
    try {
      fs.unlinkSync(plan.destroy[i]);
    } catch(e) {
      error(e.message);
    }
    info(plan.destroy[i] + ' was removed');
  }
}

function main() {
  const config = loadConfig();
  validateConfig(config);
  initDirs(config);
  const plan = makeBackupPlan(config);
  runBackupPlan(plan, config);
}

main();
