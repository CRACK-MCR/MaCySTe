# Single Page Application (SPA) hoster

This microservice allows to service a single page application such as a React app.
In addition, an endpoint is exposed at `/config.json` allowing the app to programmatically gather its configuration.

## Configuration

This application can be configured by setting the following environment variables:

|Name|Description|Default|
|---|---|---|
|`CONFIG_JSON_PATH`|Where to grab the configuration JSON to be served at `/config.json`|`config.json`|
|`STATIC_FILES_PATH`|Where to grab the static files|`.` (`/srv` in the default container)|
|`BIND_PORT`|Port to use for the server|`3000`|

## Usage with React

```js
function useSPAConfig() {
    const [ config, setConfig ] = useState(null)
    useEffect(() => {
        const abortController = new AbortController()
        fetch('/config.json', { signal: abortController.signal })
            .then(resp => resp.json())
            .then(json => setConfig(json))
            .catch(error => console.error('Error while fetching config', error))
        return () => abortController.abort()
    })
    return config
}
```
