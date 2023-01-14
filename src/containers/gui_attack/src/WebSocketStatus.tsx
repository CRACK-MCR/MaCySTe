import React, { useMemo } from "react"
import { OverlayTrigger, Tooltip } from "react-bootstrap"
import { ReadyState } from "react-use-websocket"
import { WebSocketLike } from "react-use-websocket/dist/lib/types"
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket"
import { getNMEAWebSocketURL } from "./Config"

function WebSocketStatusString({ wsName, readyState }: { wsName: string, readyState: ReadyState }) {
    const color = useMemo(() => {
        switch (readyState) {
            case ReadyState.CLOSED:
            case ReadyState.CLOSING:
            case ReadyState.UNINSTANTIATED:
                return 'yellow'
            case ReadyState.CONNECTING:
                return 'darkgrey'
            case ReadyState.OPEN:
                return 'green'
        }
    }, [ readyState ])
    return (
        <span className="text-light me-2">{wsName} <span style={{ color }} className="font-monospace">{ReadyState[readyState]}</span></span>
    )
}

export default function WebSocketStatus({ wsName, wsURLFn }: { wsName: string, wsURLFn: () => Promise<string> }) {
    const { readyState, getWebSocket } = useWebSocket(wsURLFn)
    return (
        <WebSocketStatusString wsName={wsName} readyState={readyState}/>
    )
}