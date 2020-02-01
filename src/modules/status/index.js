import store from '../../store'
import api from '../api'

const MENU = 'app/menu'
const ACCOUNT = 'tendermint/account'
const STATUS = 'status/status'

const globals = {
}

const initialState = {
  quoteBacking: 0,
  tradeBacking: 0,
  curBalance: 0
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
  const acctInfo = await api.getAccountInfo(globals.acct)
  const data = {
    type: STATUS,
    numQuotes: acctInfo.activeQuotes.length,
    quoteBacking: acctInfo.quoteBacking,
    tradeBacking: acctInfo.tradeBacking,
    curBalance: acctInfo.balance
  }
  store.dispatch(data)
}
