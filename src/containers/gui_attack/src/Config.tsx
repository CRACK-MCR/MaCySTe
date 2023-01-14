async function getEnvConfig(name: string, fallback: string, forceFallback: boolean = false) {
    const url = `/config/env/${name}`
    if (forceFallback) {
        console.debug('Forcing fallbackc')
        return fallback
    }
    try {
        const resp = await fetch(url)
        if (resp.status !== 200) {
            throw new Error(`Failed getting configuration from url (statuscode = ${resp.status})`)
        }
        const text = await resp.text()
        console.debug('Got config value', name, text)
        return text
    } catch (err) {
        console.error('Failed getting configuration value from environment', name, err)
    }
    return fallback
}

export async function getCCWebSocketURL() {
    return await getEnvConfig('WS_CC_URL', 'ws://127.0.0.1:3001/command', false)
}

export async function getNMEAWebSocketURL() {
    return await getEnvConfig('WS_NMEA_URL', 'ws://127.0.0.1:3001/nmea', false)
}
