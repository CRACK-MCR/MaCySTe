import { useEffect, useState } from "react";

const envConfigCache: Map<string,string> = new Map()

export default function useEnvConfig(name: string, fallback: string | null = null): string | null {
    const [ config, setConfig ] = useState(fallback)
    useEffect(() => {
        const cachedValue = envConfigCache.get(name)
        if (cachedValue) {
            console.info('Using cached configuration value', name, cachedValue)
            setConfig(cachedValue)
            return
        }
        const get = async () => {
            const url = `/config/env/${name}`
            const req = await fetch(url)
            if (req.status !== 200) {
                throw new Error(`Status code ${req.status} is not 200`)
            }
            const txt = await req.text()
            return txt
        }
        get()
            .then(value => {
                console.info('Got configuration value', name, value)
                setConfig(value)
                envConfigCache.set(name, value)
            })
            .catch(error => console.error('Failed getting configuration value', name, error))
    }, [ name, fallback, setConfig ])
    return config
}
