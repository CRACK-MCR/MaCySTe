import { useCallback } from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { attackPanelShown } from './AttackPanel';
import { getCCWebSocketURL, getNMEAWebSocketURL } from './Config';
import { mapCenter } from './Map';
import { ownShipState } from './Ship';
import { shipListShown } from './ShipList';

import unigeLogo from './unigew.png'
import WebSocketStatus from './WebSocketStatus';

export default function Header() {
    const setAttackPanelShown = useSetRecoilState(attackPanelShown)
    const setShipListShown = useSetRecoilState(shipListShown)

    const ownShip = useRecoilValue(ownShipState)
    const setMapCenter = useSetRecoilState(mapCenter)
    const centerOnShip = useCallback(() => {
        const lat = ownShip.lat
        const lon = ownShip.lon
        if (lat && lon) {
            setMapCenter([ lat, lon ])
        }
    }, [ ownShip, setMapCenter ])

    return (
        <Navbar bg="danger" variant="dark" sticky="top" className='flex-grow-1'>
            <Container>
                <Navbar.Brand>MaCySTe</Navbar.Brand>
                <Navbar.Collapse>
                    <Nav className="me-auto">
                        <Nav.Link onClick={() => setShipListShown(true)}>Ships list</Nav.Link>
                        <Nav.Link onClick={centerOnShip}>Center map</Nav.Link>
                        <Nav.Link onClick={() => setAttackPanelShown(true)}>Attacks</Nav.Link>
                    </Nav>
                    <WebSocketStatus wsName='CC' wsURLFn={getCCWebSocketURL} />
                    <WebSocketStatus wsName='NMEA' wsURLFn={getNMEAWebSocketURL} />
                    <img src={unigeLogo} height="40px" />
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}