import React from 'react'
import { render } from 'react-dom'
import { IdleSessionTimeout } from 'idle-session-timeout'

import App from './App'

const target = document.querySelector('#root')

var token = "atom"

render(
  <App token={token}/>,
  target
)

const session = new IdleSessionTimeout(15 * 60 * 1000)
session.onTimeOut = () => {
  window.location.reload()
}
session.start()
