import React from 'react'
import { render } from 'react-dom'

import App from './App'

const target = document.querySelector('#root')

if (process.env.MICROTICK_PROD === 'true') {
  var token = "dai"
} else {
  token = "mt"
}

render(
  <App token={token}/>,
  target
)
