'use strict';

function loadAddon(addonSpec) {
  console.debug('Installing addon', addonSpec)
  const buttons = document.getElementById('buttons')
  const button = document.createElement('button')
  button.onclick = _ => navbtn(button)
  button.textContent = addonSpec.text
  if (addonSpec.name) button.dataset.name = addonSpec.name
  if (addonSpec.env) button.dataset.env = addonSpec.env
  if (addonSpec.tip) button.dataset.tip = addonSpec.tip
  if (addonSpec.url) button.dataset.url = addonSpec.url
  buttons.insertBefore(button, document.getElementById('2x1-grid-button'))
}

async function loadAddonInfo(envVariables, addonName) {
  // Get property values
  async function loadAddonProperty(propertyName, targetName) {
    const result = { propertyName, propertyValue: undefined, targetName }
    if (envVariables.includes(`MENU_${addonName}_${propertyName}`)) {
      const resp = await fetch(`/config/env/MENU_${addonName}_${propertyName}`)
      if (resp.status === 200) {
        result.propertyValue = await resp.text()
      }
    }
    return result
  }
  const propertyQueryResults = await Promise.all([
    loadAddonProperty('TEXT', 'text'),
    loadAddonProperty('ENV', 'env'),
    loadAddonProperty('TIP', 'tip'),
    loadAddonProperty('URL', 'url'),
  ])
  // Assemble and return result
  const elementInfo = {
    name: addonName,
  }
  for (const propertyQueryResult of propertyQueryResults) {
    if (propertyQueryResult.propertyValue) {
      elementInfo[propertyQueryResult.targetName] = propertyQueryResult.propertyValue
    }
  }
  return elementInfo
}

async function loadAddons() {
  console.debug('Loading addons')
  // Grab list of environment variables
  const resp = await fetch('/config/env')
  const json = await resp.json()
  console.debug('Got env list', json)
  // Iterate over the environment variables
  const env_re = /^MENU_(.+)_(TEXT|ENV|TIP|URL)$/
  const menuElements = new Set()
  for (const variable of json) {
    const env_re_results = env_re.exec(variable)
    if (env_re_results) {
      menuElements.add(env_re_results[1])
    }
  }
  console.debug('Menu entries', menuElements)
  // For every menu entry assemble and deploy addon
  const elementInfos = await Promise.all(Array.from(menuElements).sort().map(addonName => loadAddonInfo(json, addonName)))
  for (const elementInfo of elementInfos) {
    loadAddon(elementInfo)
  }
  // Reorder elements
  const elementLabels = Array.from(document.getElementById('buttons').children)
    .filter(element => element.tagName === 'BUTTON')
    .map(element => element.textContent)
    .sort((a, b) => {
      const aIsGrid = a.endsWith(' grid')
      const bIsGrid = b.endsWith(' grid')
      if (aIsGrid && bIsGrid) {
        const gridRe = /([0-9]+)x([0-9]+).*/
        const aMatch = gridRe.exec(a)
        const bMatch = gridRe.exec(b)
        const aVal = parseInt(aMatch[1]) * parseInt(aMatch[2])
        const bVal = parseInt(bMatch[1]) * parseInt(bMatch[2])
        if (aVal < bVal) return -1
        if (aVal > bVal) return  1
        return 0
      }
      if (aIsGrid && !bIsGrid) return 1
      if (!aIsGrid && bIsGrid) return -1
      return a.localeCompare(b)
    })
  Array.from(document.getElementById('buttons').children)
    .filter(element => element.tagName === 'BUTTON')
    .forEach(element => {
      const elementText = element.textContent
      const elementIndex = elementLabels.indexOf(elementText)
      element.style.order = elementIndex
    })
}
document.addEventListener('DOMContentLoaded', async _ => {
  try {
    await loadAddons()
  } catch (error) {
    console.error('Error loading addons', error)
    const buttons = document.getElementById('buttons')
    const button = document.createElement('button')
    button.classList.add('error')
    button.style.fontSize = '28px'
    button.textContent = 'failed loading available elements'
    buttons.insertBefore(button, document.getElementById('2x1-grid-button'))

    document.getElementById('placeholder').style.color = 'darkred'
    document.getElementById('placeholder').style.border = '5px red solid'
    document.getElementById('placeholder').style.margin = '0px'
    document.getElementById('placeholder').textContent = 'Failed loading available elements'

    const refreshBtn = document.createElement('span')
    refreshBtn.style.color = 'darkgrey'
    refreshBtn.style.fontSize = '20px'
    refreshBtn.textContent = 'click this text to retry'
    refreshBtn.onclick = _ => window.location.reload()
    document.getElementById('placeholder').appendChild(refreshBtn)

    document.getElementsByTagName('header')[0].style.background = 'linear-gradient(to bottom, darkred, 90%, red)'
    document.getElementsByTagName('header')[0].style.color = 'yellow'
    document.getElementsByTagName('header')[0].style.margin = '0px'
    document.getElementsByTagName('header')[0].style.paddingLeft = '10px'
    document.getElementsByTagName('header')[0].style.paddingRight = '10px'

    document.getElementById('controls').style.background = 'red'
    document.getElementById('controls').style.color = 'yellow'

    document.getElementById('controls-info').textContent = 'Error'

    document.getElementById('2x1-grid-button').remove()
    document.getElementById('2x2-grid-button').remove()
  }
  document.getElementById('buttons-placeholder').remove()
})

async function navbtn(button) {
  // Grab elements
  const placeholder = document.getElementById('placeholder')
  const iframe = document.getElementById('main-iframe')
  const tipControl = document.getElementById('controls-tip')
  const infoControl = document.getElementById('controls-info')
  // Set button as active
  button.classList.add('active')
  for (const sibling of button.parentElement.children) {
    if (sibling === button) continue
    sibling.classList.remove('active')
    sibling.classList.remove('error')
  }
  // Set tip
  const tip = button.dataset.tip
  tipControl.textContent = ''
  for (const child of tipControl.children) tipControl.removeChild(child)
  if (tip) {
    tip.split(' ').forEach(kv => {
      const [ k, v ] = kv.split('=', 2)
      const kElement = document.createElement('span')
      kElement.textContent = `${k}: `
      const vElement = document.createElement('span')
      vElement.textContent = v
      const kvElement = document.createElement('div')
      kvElement.appendChild(kElement)
      kvElement.appendChild(vElement)
      tipControl.appendChild(kvElement)
    })
    tipControl.style.display = 'block'
  } else {
    tipControl.style.display = 'none'
  }
  // Grab url from configuration
  let url;
  if (button.dataset.url) {
    url = button.dataset.url
  } else {
    const configRequestURL = `/config/env/${button.dataset.env}`
    try {
      const configRequest = await fetch(configRequestURL)
      if (configRequest.status !== 200) {
        throw new Error(`Request failed with status code ${configRequest.status} ${configRequest.statusText}`)
      }
      url = new URL(await configRequest.text())
    } catch (error) {
      console.error('URL request failed', error)
      button.classList.add('error')
      button.classList.remove('active')
      placeholder.style.color = 'darkred'
      placeholder.textContent = 'Error in setting up connection'
      infoControl.textContent = 'Error'
    }
  }
  if (!url) {
    throw new Error('No URL')
  }
  // Set URL
  iframe.src = url
  placeholder.classList.add('hidden')
  iframe.classList.remove('hidden')
  infoControl.textContent = button.textContent
  console.debug('iFrame set to', iframe.src)
}

function closeHeader() {
  if (window.confirm('This will delete the header, are you sure?')) {
    // Destroy elements
    for (const elem of document.getElementsByTagName('header')) {
      elem.remove()
    }
    // Clear borders, padding, ...
    function removeChrome(elem) {
      elem.style.border = 'none'
      elem.style.margin = '0px'
      elem.style.padding = '0px'
    }
    removeChrome(document.getElementById('placeholder'))
    for (const elem of document.getElementsByTagName('iframe')) {
      removeChrome(elem)
    }
    document.getElementById('controls').remove()
  }
}

function collapseHeader() {
  const controls = document.getElementById('controls')
  const header = document.getElementsByTagName('header')[0]
  header.classList.toggle('hidden')
  controls.classList.toggle('reduced')
  const label = document.getElementById('controls-collapse')
  if (label.textContent === 'Collapse header') {
    label.textContent = 'Expand header'
  } else {
    label.textContent = 'Collapse header'
  }
}
