import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'

import tendermint from './chain/tendermint'
import microtick from './microtick'
import history from './history'
import status from './status'
import leaderboard from './leaderboard'
import notifications from './notifications'
import app from './app'
import dialog from './dialog'

export default combineReducers({
  routing: routerReducer,
  app,
  tendermint,
  microtick,
  status,
  leaderboard,
  history,
  notifications,
  dialog
})