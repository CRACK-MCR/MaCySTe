export const ConfigASTERIXWebSocketUrl = '/config/env/ASTERIX_WS_URL'
export const ConfigNATSWebSocketUrl = '/config/env/NATS_WS_URL'

export async function getConfig(url) {
  const resp = await fetch(url)
  if (resp.status !== 200) {
    throw new Error("Error in getting config, response status is " + resp.status)
  }
  const conf = await resp.text()
  console.debug('Got config', url, conf)
  return conf
}

export async function getConfigAndThen(url, callback) {
  let config = null
  while (!config) {
    try {
      console.debug('Getting config from', url)
      config = await getConfig(url)
    } catch (error) {
      console.error('Error getting config', error)
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  callback(config)
}
