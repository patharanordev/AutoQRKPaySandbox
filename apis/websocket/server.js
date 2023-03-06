const {Buffer} = require('buffer');
const {Kafka} = require('kafkajs');
// // For SSL
// const app = require('uWebSockets.js').SSLApp({
//   key_file_name: 'misc/key.pem',
//   cert_file_name: 'misc/cert.pem',
// });

// Non-SSL is simply App()
const {App, SHARED_COMPRESSOR} = require('uWebSockets.js');

const app = App();
const PORT = 9001;
const TOPIC = 'user.payment.qr';

const kafka = new Kafka({
  clientId: 'qrscanner_20230305',
  brokers: ['kafka:29092'],
});

const producer = kafka.producer();

const buf2Obj = arrBuffer => {
  let data = {str: '', json: '', raw: arrBuffer};

  try {
    const buf = Buffer.from(arrBuffer);
    data.str = buf.toString();
    data.json = JSON.parse(data.str);
  } catch (err) {
    console.log('convert buffer to object error :', err);
  }
  return data;
};

const produce = async data => {
  try {
    await producer.connect();
    await producer.send({
      topic: TOPIC,
      messages: [{key: data.json.ref, value: data.str}],
    });
  } catch (err) {
    console.log('produce error :', err);
  } finally {
    await producer.disconnect();
  }
};

app
  .ws('/*', {
    /* Options */
    compression: SHARED_COMPRESSOR,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 10,
    /* Handlers */
    open: ws => {
      console.log('A WebSocket connected!');
    },
    message: async (ws, message, isBinary) => {
      const data = buf2Obj(message);
      console.log('received :', data.json);

      const ok = ws.send('in progress...');
      console.log('sending status :', ok);

      await produce(data);
    },
    drain: ws => {
      console.log('WebSocket backpressure: ' + ws.getBufferedAmount());
    },
    close: (ws, code, message) => {
      console.log('WebSocket closed');
    },
  })
  .any('/*', (res, req) => {
    res.end('Nothing to see here!');
  })
  .listen(PORT, listenSocket => {
    if (listenSocket) {
      console.log('Listening to port 9001');
    }
  });
