const WebSocket = require('ws');

const socket = new WebSocket('ws://localhost:9001/qr');
console.log('connecting...');

socket.onopen = () => {
  console.log('connected');
  // now we are connected
  socket.send(
    JSON.stringify({
      ref: 'xxxxx-xxxx-xxxx-xxxx-xxxxxxxx',
      price: '1,234',
      unit: 'THB',
    }),
  );
};
socket.onmessage = event => {
  if (event.data instanceof ArrayBuffer) {
    // binary frame
    const view = new DataView(event.data);
    console.log('received array buffer :', view.getInt32(0));
  } else {
    // text frame
    console.log('received text :', event.data);
  }
};
socket.onclose = () => {
  console.log('disconnected');
};
