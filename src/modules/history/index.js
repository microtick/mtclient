import store from '../../store'
import { selectMenu } from '../app'
import api from '../api'

const ACCOUNT = 'tendermint/account'
const MENU = 'app/menu'
const VIEW = 'history/view'
const HISTORY = 'history/list'
const HISTTRADE = 'history/trade'
const HISTQUOTE = 'history/quote'
const UPDQUOTE = 'history/updquote'

const globals = {
  viewPage: 1,
  viewInc: 10
}

const initialState = {
  page: 'history',
  view: 'account',
  data: {
    list: []
  }
}

/*
const durValue = {
  '5minute': 300,
  '15minute': 900,
  '1hour': 3600,
  '4hour': 14400,
  '12hour': 43200
}
*/

export default (state = initialState, action) => {
  switch (action.type) {
    case MENU:
      globals.page = action.target
      globals.view = state.view
      getAccountData()
      return state
    case VIEW:
      globals.view = action.view
      return {
        page: state.page,
        view: action.view
      }
    case ACCOUNT:
      globals.acct = action.acct
      getAccountData()
      return state
    case HISTORY:
      return {
        ...state,
        data: {
          account: globals.acct,
          list: action.list,
          page: action.page,
          pageInc: action.pageInc,
          total: action.total
        }
      }
    case HISTTRADE:
      return {
        ...state,
        data: {
          block: globals.block,
          id: action.id,
          info: action.info
        }
      }
    case HISTQUOTE:
      return {
        ...state,
        data: {
          block: globals.block,
          id: action.id,
          info: action.info,
          view: action.view
        }
      }
    case UPDQUOTE:
      return {
        ...state,
        data: {
          ...state.data,
          view: action.view
        }
      }
    default:
      return state
  }
}

export const viewAccount = id => {
  return dispatch => {
    dispatch({
      type: VIEW,
      view: 'account'
    })
    selectMenu('history')
    getAccountData()
  }
}

export const button10 = () => {
  return dispatch => {
    globals.viewInc = 10 
    globals.viewPage = 1
    getAccountData()
  }
}

export const button25 = () => {
  return dispatch => {
    globals.viewInc = 25
    globals.viewPage = 1
    getAccountData()
  }
}

export const button50 = () => {
  return dispatch => {
    globals.viewInc = 50
    globals.viewPage = 1
    getAccountData()
  }
}

export const button100 = () => {
  return dispatch => {
    globals.viewInc = 100
    globals.viewPage = 1
    getAccountData()
  }
}

export const buttonfirst = () => {
  return dispatch => {
    globals.viewPage = 1
    getAccountData()
  }
}

export const prevButton = () => {
  return dispatch => {
    //console.log("Prev pressed") 
    if (globals.viewPage > 1) {
      globals.viewPage--
      getAccountData()
    }
  }
}

export const nextButton = () => {
  return dispatch => {
    //console.log("Next pressed") 
    if (globals.viewPage < globals.totalPages) {
      globals.viewPage++
      getAccountData()
    }
  }
}

export const buttonlast = () => {
  return dispatch => {
    globals.viewPage = globals.totalPages 
    getAccountData()
  }
}

const getAccountData = async () => {
  if (globals.page !== 'history' || globals.view !== 'account' || globals.acct === undefined) return
  
  globals.transaction_count = await api.accountLedgerSize()
  globals.totalPages = Math.ceil(globals.transaction_count / globals.viewInc)
  
  const history = await api.accountLedger(globals.viewPage, globals.viewInc)
  //console.log(JSON.stringify(history, null, 2))
  store.dispatch({
    type: HISTORY,
    page: globals.viewPage,
    pageInc: globals.viewInc,
    total: globals.totalPages,
    list: history
  })
}
  
// View trade

export const viewTrade = id => {
  return dispatch => {
    dispatch({
      type: VIEW,
      view: 'trade'
    })
    selectMenu('history')
    getTradeData(id)
  }
}

const getTradeData = async id => {
  const data = await api.getHistoricalTrade(id)
  //console.log(JSON.stringify(data, null, 2))
  data.minp = Number.MAX_VALUE
  data.maxp = 0
  data.ticks.map(el => {
    if (data.minp > el.consensus) data.minp = el.consensus
    if (data.maxp < el.consensus) data.maxp = el.consensus
    return null
  })
  store.dispatch({
    type: HISTTRADE,
    id: id,
    info: data
  })
}

// View Quote

export const viewQuote = id => {
  return dispatch => {
    dispatch({
      type: VIEW,
      view: 'quote'
    })
    selectMenu('history')
    getQuote(id)
  }
}

export const updateQuote = which => {
  return dispatch => {
    const state = store.getState()
    const action = {}
    action[which] = !state.history.data.view[which]
    store.dispatch({
      type: UPDQUOTE,
      view: Object.assign({}, state.history.data.view, action)
    })
  }
}

const getQuote = async id => {
  const info = await getQuoteData(id)
  info.maxp = 0
  info.minp = Number.MAX_VALUE
  info.ticks.map(tick => {
    if (info.maxp < tick.consensus) info.maxp = tick.consensus
    if (info.minp > tick.consensus) info.minp = tick.consensus
    return null
  })
  info.updates.map(update => {
    if (info.maxp < update.spot + update.premium) info.maxp = update.spot + update.premium
    if (info.minp > update.spot - update.premium) info.minp = update.spot - update.premium
    return null
  })
  computeQuotePrices(info)
  store.dispatch({
    type: HISTQUOTE,
    id: id,
    info: info,
    view: {
      quotespot: true,
      quotepremiums: true,
      consensus: true,
      callpremiums: true,
      putpremiums: true
    }
  })
}

const computeQuotePrices = async info => {
  info.ticks.filter(tick => {
    const last = info.updates.reduce((acc, h) => {
      if (h.height <= tick.height) acc = h
      return acc
    }, 0)
    const deviation = last.spot - tick.consensus
    tick.call = last.premium + deviation / 2
    tick.put = last.premium - deviation / 2
    if (tick.call < 0) tick.call = 0
    if (tick.put < 0) tick.put = 0
    if (info.maxp < tick.consensus + tick.call) info.maxp = tick.consensus + tick.call
    if (info.minp > tick.consensus - tick.put) info.minp = tick.consensus - tick.put
    return false
  })
}

const getQuoteData = async id => {
  const info = await api.blockInfo()
  if (info.block > 250) {
    var startBlock = info.block - 250
  } else {
    startBlock = 0
  }
  const quote = await api.getHistoricalQuote(id, startBlock, info.block)
  return quote
}
