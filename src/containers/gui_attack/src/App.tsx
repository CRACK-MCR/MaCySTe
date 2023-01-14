import { Col, Container, Nav, Navbar, Offcanvas, Row } from 'react-bootstrap';
import { RecoilRoot } from 'recoil';
import AttackPanel from './AttackPanel';

import Header from './Header';
import Map from './Map'
import ShipList from './ShipList';

function App() {
  return (
    <RecoilRoot>
      <Header />
      <Map />
      <ShipList />
      <AttackPanel />
    </RecoilRoot>
  );
}

export default App;
