import React from 'react'
import { Provider } from 'react-redux'
import { ConnectedRouter } from 'react-router-redux'
import store, { history } from './store'

import App from './containers/app'

export default props => (
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <div>
        <App token={props.token}/>
      </div>
    </ConnectedRouter>
  </Provider>
)