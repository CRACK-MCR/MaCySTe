'use strict';
// State
let nMessages = 0
// Print websocket URL
const wsFullURL = new URL((window.location.protocol === 'https' ? 'wss://' : 'ws://') + window.location.host + wsURL);
console.debug('WebSocket URL', wsFullURL)
// Grab elements
const containerElement = document.getElementById('ctr');
const statusElement = document.getElementById('sts');
// Helpers
function setStatus(text) {
  statusElement.textContent = text;
}
// Create WebSocket
let ws = new WebSocket(wsFullURL);
setStatus('Connecting')
ws.addEventListener('open', _ => {
  console.log('WebSocket connected')
  setStatus('Connected');
})
ws.addEventListener('error', (event) => {
  console.error('WebSocket error', event)
  setStatus(`Error (${event})`);
})
ws.addEventListener('message', (event) => {
  const data = event.data;
  nMessages++;
  // Remove the last elements if too many are present
  while (containerElement.childElementCount > 100) {
    const lastChildren = containerElement.lastElementChild;
    containerElement.removeChild(lastChildren);
  }
  // Append new element
  const newElement = document.createElement('div')

  const infoElement = document.createElement('p')
  infoElement.textContent = `[t = ${new Date().toISOString()}, i = ${nMessages}]`
  newElement.appendChild(infoElement)

  const contentElement = document.createElement('p')
  newElement.appendChild(contentElement)
  if (data instanceof Blob) {
    contentElement.textContent = `Binary (${data.size} bytes)`
    data.text()
      .then(text => contentElement.textContent = contentElement.textContent + ' => ' + text.trim())
  } else if (typeof data === 'string') {
    contentElement.textContent = data.trim()
  } else {
    console.warn('Unknown element', data)
    contentElement.textContent = '???'
  }

  newElement.appendChild(document.createElement('hr'))

  containerElement.insertBefore(newElement, containerElement.firstElementChild)
})