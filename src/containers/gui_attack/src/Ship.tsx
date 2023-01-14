import { LeafletEventHandlerFnMap } from "leaflet";
import { useCallback, useEffect, useReducer, useState } from "react";
import { Marker } from "react-leaflet";
import { JsonObject } from "react-use-websocket/dist/lib/types";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import { atom, useSetRecoilState } from "recoil";
import { aisShipMMSIs, aisShipsState } from "./AISShips";
import { getNMEAWebSocketURL } from "./Config";
import { boatIcon } from "./Map";

export interface ShipState {
    lat?: number,
    lon?: number,
    course?: number,
    heading?: number,
    speed?: number,
    aisMMSI?: number,
    aisName?: string,
}

export const ownShipState = atom<ShipState>({ key: 'ownShipState', default: {} })

export interface IShip {
    /// Get state from sentences referring to the own ship
    isOwnShip: boolean,
    /// Get state from ships with this AIS MMSI
    aisMMSI?: number,
    /// Marker event handlers
    markerEventHandlers?: LeafletEventHandlerFnMap,
}

export default function Ship(props: IShip) {

    const setAISShips = useSetRecoilState(aisShipsState)
    const setOwnShip = useSetRecoilState(ownShipState)

    const [ ship, setShip ] = useState<ShipState>({})
    const { lastJsonMessage } = useWebSocket<JsonObject>(getNMEAWebSocketURL)

    useEffect(() => {
        if (props.isOwnShip) {
            setOwnShip(ship)
        } else {
            const aisMMSI = ship.aisMMSI
            if (aisMMSI) {
                setAISShips(ships => ({ ...ships, [aisMMSI]: ship }))
            }
        }
    }, [ props, ship, setAISShips, setOwnShip ])

    const setShipAISMMSI = useCallback((aisMMSI: any) => {
        if (typeof aisMMSI !== 'number') return
        setShip(ship => ({ ...ship, aisMMSI }))
    }, [ setShip ])

    const setShipAISName = useCallback((aisName: any) => {
        if (typeof aisName !== 'string') return
        setShip(ship => ({ ...ship, aisName }))
    }, [ setShip ])

    const setShipCourse = useCallback((course: any) => {
        if (typeof course !== 'number') return
        setShip(ship => ({ ...ship, course }))
    }, [ setShip ])

    const setShipHeading = useCallback((heading: any) => {
        if (typeof heading !== 'number') return
        setShip(ship => ({ ...ship, heading }))
    }, [ setShip ])

    const setShipPosition = useCallback((lat: any, lon: any) => {
        if (typeof lat !== 'number') return
        if (typeof lon !== 'number') return
        setShip(ship => ({ ...ship, lat, lon }))
    }, [ setShip ])

    const setShipSpeed = useCallback((speed: any) => {
        if (typeof speed !== 'number') return
        setShip(ship => ({ ...ship, speed }))
    }, [ setShip ])

    useEffect(() => {
        if (props.aisMMSI && !ship.aisMMSI) {
            setShipAISMMSI(props.aisMMSI)
        }
    }, [ ship, props, setShipAISMMSI ])

    useEffect(() => {
        // Skip if null
        if (!lastJsonMessage) return

        // Non-AIS messages aimed at the own ship
        if (props.isOwnShip) {
            switch (lastJsonMessage.sentence_type) {
                case 'GGA':
                    setShipPosition(lastJsonMessage.lat, lastJsonMessage.lon)
                    return
                case 'GLL':
                    setShipPosition(lastJsonMessage.lat, lastJsonMessage.lon)
                    return
                case 'HDT':
                    setShipHeading(lastJsonMessage.heading)
                    return
                case 'RMC':
                    setShipPosition(lastJsonMessage.lat, lastJsonMessage.lon)
                    return
                case 'VTG':
                    setShipCourse(lastJsonMessage.true_track)
                    setShipSpeed(lastJsonMessage.spd_over_grnd_kts)
                    return
                case 'DPT':
                case 'DTM':
                case 'ROT':
                case 'ZDA':
                    console.debug('Ignored NMEA message', lastJsonMessage)
                    return
                case 'VDO':
                case 'VDM':
                    break
                default:
                    console.warn('Ignored NMEA message', lastJsonMessage)
            }
        }

        // AIS messages
        if (lastJsonMessage.mmsi) {
            // Get MMSI
            const mmsi = lastJsonMessage.mmsi
            if (typeof mmsi !== 'number') return
            // Parse if filters match
            if (
                // Is about own ship
                (props.isOwnShip && lastJsonMessage.sentence_type === 'VDO') ||
                // Is about some other ship
                (!props.isOwnShip && lastJsonMessage.sentence_type === 'VDM' && (!props.aisMMSI || props.aisMMSI === mmsi))
            ) {
                switch (lastJsonMessage.msg_type) {
                    case 1:
                        setShipCourse(lastJsonMessage.course)
                        setShipHeading(lastJsonMessage.heading)
                        setShipPosition(lastJsonMessage.lat, lastJsonMessage.lon)
                        setShipSpeed(lastJsonMessage.speed)
                        return
                    case 5:
                        setShipAISMMSI(lastJsonMessage.mmsi)
                        setShipAISName(lastJsonMessage.shipname)
                        return
                    default:
                        console.warn('Ignored NMEA AIS message', lastJsonMessage)
                }
            }
        }
    }, [
        lastJsonMessage,
        props,
        setShipAISMMSI,
        setShipAISName,
        setShipCourse,
        setShipHeading,
        setShipPosition,
        setShipSpeed,
    ])

    if (ship.lat && ship.lon) {
        return (
            <Marker position={[ship.lat, ship.lon]} icon={boatIcon} eventHandlers={props.markerEventHandlers}></Marker>
        )
    }

    return (
        <></>
    )
}