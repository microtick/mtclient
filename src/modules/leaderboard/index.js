import store from '../../store'
import api from '../api'

const MENU = 'app/menu'
const LEADERBOARD = 'leaderboard/info'

const globals = {}

const initialState = {}

export default (state = initialState, action) => {
  switch (action.type) {
    case MENU:
      globals.page = action.target
      //getLeaderboardData()
      return state
    case LEADERBOARD:
      return {
        ...state,
        commission: action.commission,
        accounts: action.accounts
      }
    default:
      return state
  }
}

const getLeaderboardData = async() => {
  /*
  if (globals.page !== 'leaderboard') return
  const info = await api.getLeaderboardInfo()
  store.dispatch({
    type: LEADERBOARD,
    commission: info.commission,
    accounts: Object.keys(info.accounts).filter(key => {
      if (info.accounts[key].balance < 5000) {
        return true
      }
      return false
    }).map(key => {
      const obj = info.accounts[key]
      obj.name = key
      return obj
    }).sort((x1, x2) => {
      const t1 = x1.balance + x1.quoteBacking + x1.tradeBacking
      const t2 = x2.balance + x2.quoteBacking + x2.tradeBacking
      return t2 - t1
    }).slice(0,25)
  }) 
  */
}