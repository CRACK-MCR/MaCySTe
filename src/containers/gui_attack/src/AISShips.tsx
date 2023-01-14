import { useEffect, useState } from "react"
import useWebSocket from "react-use-websocket"
import { JsonObject } from "react-use-websocket/dist/lib/types"
import { atom, useRecoilState, useSetRecoilState } from "recoil"
import { getNMEAWebSocketURL } from "./Config"
import Ship, { ShipState } from "./Ship"
import { selectedAISShipMMSI } from "./ShipPanel"

export const aisShipMMSIs = atom<number[]>({ key: 'aisShipMMSIs', default: [] })
export const aisShipsState = atom<{[mmsi: number]: ShipState}>({ key: 'aisShipsState', default: {} })

export default function AISShips() {
    const setSelectedMMSI = useSetRecoilState(selectedAISShipMMSI)
    const [ MMSIs, setMMSIs ] = useRecoilState<number[]>(aisShipMMSIs)
    const { lastJsonMessage } = useWebSocket<JsonObject>(getNMEAWebSocketURL)
    useEffect(() => {
        if (!lastJsonMessage) return
        if (lastJsonMessage.sentence_type === 'VDM' && typeof lastJsonMessage.mmsi === 'number') {
            const mmsi = lastJsonMessage.mmsi
            setMMSIs(oldMMSIs => {
                if (!oldMMSIs.includes(mmsi)) {
                    console.debug('Created AIS ship', mmsi)
                    return [ mmsi, ...oldMMSIs ].sort()
                }
                return oldMMSIs
            })
        }
    }, [ lastJsonMessage ])
    return (
        <>
            {MMSIs.map((mmsi: number) => (
                <Ship key={mmsi} isOwnShip={false} aisMMSI={mmsi} markerEventHandlers={{
                    click: () => setSelectedMMSI(mmsi)
                }}/>
            ))}
        </>
    )
}