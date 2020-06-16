import React from 'react'
import { render } from 'react-dom'

import App from './App'

const target = document.querySelector('#root')

var token = "dai"

render(
  <App token={token}/>,
  target
)
