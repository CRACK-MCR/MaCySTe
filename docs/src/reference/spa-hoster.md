# Single page application hoster

Every web application of MaCySTe is hosted via the `spa-hoster` component.
This component serves static files under a directory specified with the environment variable `STATIC_FILES_PATH`.  
It can be binded on a specific port thanks to `BIND_PORT` environment variable.  
`spa-hoster` exposes environment variables at path `/config/env/<ENV_NAME>` **BEWARE** that this may not be safe because it exposes all the env, but you can specify which variables to serve via a space separated list in another environment variable named `ENV_WHITELIST`.  