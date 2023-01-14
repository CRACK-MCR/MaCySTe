import { useEffect, useMemo } from "react";
import { Col, Container, Offcanvas, Row } from "react-bootstrap";
import { useMap } from "react-leaflet";
import { atom, selector, useRecoilState, useSetRecoilState } from "recoil";
import { aisShipsState } from "./AISShips";
import { ownShipState } from "./Ship";

export const selectedOwnShip = atom({ key: 'selectedOwnShip', default: false })
export const selectedAISShipMMSI = atom<number | null>({ key: 'selectedAISShipMMSI', default: null })
export const selectedShip = selector({
    key: 'selectedShip',
    get: ({ get }) => {
        // Own ship
        if (get(selectedOwnShip)) {
            return get(ownShipState)
        }
        // AIS
        const mmsi = get(selectedAISShipMMSI)
        if (mmsi) {
            const aisShips = get(aisShipsState)
            const aisShip = aisShips[mmsi]
            if (aisShip) {
                return aisShip
            }
        }
        // Fallback
        return null
    },
    set: ({ set }, newValue) => {
        if (newValue === null || newValue === undefined) {
            set(selectedOwnShip, false)
            set(selectedAISShipMMSI, null)
        } else {
            throw new Error(`Invalid type for ${newValue}`)
        }
    }
})

export default function ShipPanel() {
    const [ selected, setSelected ] = useRecoilState(selectedShip)
    return (
        <Offcanvas show={selected !== null} placement={'end'} onHide={() => setSelected(null)}>
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Ship data</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <Container>
                    {selected?.lat && selected.lon && (
                        <Row>
                            <Col>Latitude: {selected?.lat.toFixed(6)}</Col>
                            <Col>Longitude: {selected?.lon.toFixed(6)}</Col>
                        </Row>
                    )}
                    <Row>
                        {selected?.heading && (<Col>Heading: {selected.heading.toFixed(1)}°</Col>)}
                        {selected?.course && (<Col>Course: {selected.course.toFixed(1)}°</Col>)}
                    </Row>
                    <Row>
                        {selected?.speed && (<Col>Speed: {selected.speed.toFixed(1)} kn</Col>)}
                    </Row>
                    <Row>
                        {selected?.aisMMSI && (<Col>MMSI: {selected.aisMMSI}</Col>)}
                        {selected?.aisName && (<Col>AIS Name: {selected.aisName}</Col>)}
                    </Row>
                </Container>
            </Offcanvas.Body>
        </Offcanvas>
    )
}