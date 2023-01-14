import { useCallback } from "react";
import { Button } from "react-bootstrap";
import { Offcanvas } from "react-bootstrap";
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { aisShipsState } from "./AISShips";
import { mapCenter } from "./Map";
import { ownShipState } from "./Ship";

export const shipListShown = atom({ key: 'shipListShown', default: false })

function ShipEntry({ name, latitude, longitude }: { name: string, latitude?: number, longitude?: number }) {
    const setMapCenter = useSetRecoilState(mapCenter)
    const changeMapCenter = useCallback(() => {
        if (latitude && longitude) setMapCenter([ latitude, longitude ])
    }, [ latitude, longitude, setMapCenter ])
    return (
        <Button onClick={changeMapCenter}>{name}</Button>
    )
}

export default function ShipList() {
    const [isShipListShown, setShipListShown] = useRecoilState(shipListShown)
    const aisShips = useRecoilValue(aisShipsState)
    const ownShip = useRecoilValue(ownShipState)
    return (
        <Offcanvas show={isShipListShown} placement={'start'} onHide={() => setShipListShown(false)}>
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Ships</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body className="d-grid gap-1">
                <ShipEntry name="Own ship" latitude={ownShip.lat} longitude={ownShip.lon} />
                {Object.values(aisShips).map(aisShip => (
                    <ShipEntry key={aisShip.aisMMSI} name={`AIS ship ${aisShip.aisMMSI}`} latitude={aisShip.lat} longitude={aisShip.lon} />
                ))}
            </Offcanvas.Body>
        </Offcanvas>
    )
}