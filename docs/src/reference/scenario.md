# Scenarios

MaCySTe allows the user to add new scenarios in the simulation environment.  
This essentially requires two steps to be performed:
- Scenario and World generation for the ship simulator (BridgeCommand)
- Download of Navigation Charts for the ECIDS (opencpn)

The former can be achieved by following the BridgeCommand documentation ([[1]](https://www.bridgecommand.co.uk/Doc/Scenario.php) [[2]](https://www.bridgecommand.co.uk/Doc/4.6/WorldFileSpec.php)).  
The files have to be placed in the corresponding directories under `flatpaks/bridgecommand`.

For the latter we suggest using OpenSeaMap ([[3]](http://www.openseamap.org/index.php?id=openseamap&L=1)).  
The charts must be placed in `${CONFIG_DIR}/opencpn/charts`.

MaCySTe ships with a custom scenario of the Port of Genoa described [in the following section](./scenario-genova.md).