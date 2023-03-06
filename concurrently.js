const concurrently = require('concurrently');
const {exec} = require('node:child_process');

const CMD = {
  STOP_COMPOSE: 'docker-compose -f docker-compose.local.yml down -v',
  START_COMPOSE: 'docker-compose -f docker-compose.local.yml up --build',
};

const {result} = concurrently(
  [
    {
      command: `${CMD.STOP_COMPOSE} && ${CMD.START_COMPOSE}`,
      name: 'queue',
    },
    {
      command: 'sleep 10 && cd apis/autopay && yarn && yarn start',
      name: 'web-scraping',
    },
  ],
  {
    // prefix: 'system',
    killOthers: ['failure', 'success'],
    // restartTries: 3,
    // cwd: path.resolve(__dirname, 'scripts'),
  },
);

const stopCompose = () => {
  exec(CMD.STOP_COMPOSE, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(stdout);
  });
};

const success = () => {
  stopCompose();
  process.exit(0);
};
const failure = () => {
  stopCompose();
  process.exit(1);
};

result.then(success, failure);
