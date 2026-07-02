import TuyAPI from 'tuyapi'

export default defineEventHandler(async (event) => {
  // We must instantiate TuyAPI with dummy credentials just to access its UDP discovery methods.
  // The 'tuyapi' library throws an error if id/key are missing from the constructor.
  const device = new TuyAPI({
    id: '00000000000000000000',
    key: '0000000000000000'
  })

  try {
    // Scan the local network for 8 seconds
    await device.find({ timeout: 8, all: true })
  } catch (e) {
    // TuyAPI throws an error on timeout even if it found devices
  }
  
  return device.foundDevices || []
})
