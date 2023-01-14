import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'
import 'leaflet/dist/leaflet.js'
import L, { LatLngExpression } from 'leaflet';

import boatImage from './boat_stylized.png'
import Ship from './Ship';
import AISShips from './AISShips';
import { atom, useRecoilValue, useSetRecoilState } from 'recoil';
import ShipPanel, { selectedOwnShip } from './ShipPanel';
import { useEffect } from 'react';

const boatIconSize = [ 512, 512 ]
const boatIconSizeDivisor = 16.0
export const boatIcon = new L.Icon({
  iconUrl: boatImage,
  iconSize: [ boatIconSize[0] / boatIconSizeDivisor, boatIconSize[1] / boatIconSizeDivisor ]
})

export const mapCenter = atom({ key: 'mapCenter', default: [44.4, 8.9] })

function MapChanger() {
  const map = useMap()
  const mapCenterCoordinates = useRecoilValue(mapCenter)
  useEffect(() => {
    map.panTo([ mapCenterCoordinates[0], mapCenterCoordinates[1] ])
  }, [ map, mapCenterCoordinates ])
  return (<></>)
}

export default function Map() {
    const setOwnShipSelected = useSetRecoilState(selectedOwnShip)
    return (
        <MapContainer center={[44.4, 8.9]} zoom={13} style={{ height: "calc(100vh - 56px)" }}>
          <MapChanger/>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <TileLayer
            attribution='&copy; <a href="https://www.openseamap.org">OpenSeaMap</a> contributors'
            url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
          />
          <Ship isOwnShip={true} markerEventHandlers={{
            click: () => setOwnShipSelected(true),
          }} />
          <AISShips/>
          <ShipPanel/>
        </MapContainer>
    )
}