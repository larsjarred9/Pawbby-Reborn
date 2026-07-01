const TuyAPI = require('tuyapi');

const device = new TuyAPI({
  id: '00000000000000000000',
  key: '0000000000000000'
});

console.log('Scanning network...');

device.find({timeout: 5, all: true}).then(() => {
  console.log('Finished scanning.');
  console.log('Found devices:', device.foundDevices);
}).catch(e => {
  console.log('Error or timeout', e.message);
  console.log('Found devices despite timeout:', device.foundDevices);
});
