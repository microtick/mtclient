import store from '../../store'
import api from '../api'

const MENU = 'app/menu'
const ACCOUNT = 'tendermint/account'
const STATUS = 'status/status'

const globals = {
}

const initialState = {
}

export default (state = initialState, action) => {
  switch (action.type) {
    case MENU:
      globals.page = action.target
      getStatusData()
      return state
    case ACCOUNT:
      globals.acct = action.acct
      getStatusData()
      return state
    case STATUS:
      return {
        ...state,
        numQuotes: action.numQuotes,
        numTradesLong: action.numTradesLong,
        numTradesShort: action.numTradesShort,
        quoteBacking: action.quoteBacking,
        tradeBacking: action.tradeBacking,
        curBalance: action.curBalance
      }
    default:
      return state
  }
}
      
const getStatusData = async () => {
  //if (globals.page !== 'status') return
  const acctInfo = await api.getAccountInfo(globals.acct)
  store.dispatch({
    type: STATUS,
    numQuotes: acctInfo.activeQuotes.length,
    numTradesLong: 0, //acctInfo.activeTrades.long.length,
    numTradesShort: 0, //acctInfo.activeTrades.short.length,
    quoteBacking: parseFloat(acctInfo.quoteBacking.amount),
    tradeBacking: parseFloat(acctInfo.tradeBacking.amount),
    curBalance: acctInfo.balance
  })
}
