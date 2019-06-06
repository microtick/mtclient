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
  
  globals.transaction_count = await api.totalEvents(globals.acct)
  //console.log("Total transactions=" + globals.transaction_count)
  globals.totalPages = Math.ceil(globals.transaction_count / globals.viewInc)
  
  //console.log("View history page=" + globals.viewPage + " inc=" + globals.viewInc)
  //console.log("account=" + globals.acct)
  //console.log("transaction count=" + globals.transaction_count)
  
  const history = await api.pageHistory(globals.acct, globals.viewPage, globals.viewInc)
  var hist = []
  const acctTag = "acct." + globals.acct
  history.map((x, i) => {
    const time = new Date(x.time).toLocaleString("en-US")
    if (x.originator === 'send') {
      if (x.tags[acctTag] === "account.deposit") {
        const amount = parseInt(x.transfer[0].amount, 10)
        hist.push({
          type: 'deposit',
          time: time,
          block: x.block,
          amount: amount,
          debit: 0,
          credit: amount,
          commission: 0,
          balance: parseFloat(x.balanceTo.amount)
        })
      }
      if (x.tags[acctTag] === "account.withdraw") {
        
      }
    }
    if (x.originator === 'marketTrade' || x.originator === 'limitTrade') {
      if (x.tags[acctTag] === "trade.long") {
        const cost = parseFloat(x.trade.cost.amount)
        const commission = parseFloat(x.trade.commission.amount) + parseFloat(x.trade.settleIncentive.amount)
        hist.push({
          type: 'trade.long',
          time: time,
          block: x.block,
          id: x.trade.id,
          amount: cost,
          premium: cost,
          ttype: x.trade.type,
          market: x.trade.market,
          dur: x.trade.duration,
          debit: cost + commission,
          credit: 0,
          commission: commission,
          balance: parseFloat(x.trade.balance.amount)
        })
      }
      if (x.tags[acctTag] === 'trade.short') {
        x.trade.counterParties.map(cp => {
          if (cp.short === globals.acct) {
            const premium = parseFloat(cp.premium.amount)
            hist.push({
              type: 'trade.short',
              time: time,
              block: x.block,
              amount: premium,
              id: x.trade.id,
              premium: premium,
              ttype: x.trade.type,
              market: x.trade.market,
              dur: x.trade.duration,
              debit: 0,
              credit: premium,
              commission: 0,
              balance: parseFloat(cp.balance.amount)
            })
          }
          return false
        })
      }
    }
    if (x.originator === 'settleTrade') {
      if (x.tags[acctTag] === "settle.long") {
        const settle = parseFloat(x.settle.amount)
        const commission = parseFloat(x.commission.amount)
        var credit = settle
        if (globals.acct === x.settler) {
          credit += parseFloat(x.incentive.amount) - commission
        }
        hist.push({
          type: 'settle.long',
          time: time,
          block: x.block,
          amount: settle,
          id: x.id,
          settle: settle,
          debit: 0,
          credit: credit,
          commission: commission,
          balance: parseFloat(x.balance.amount),
        })
      }
      if (x.tags[acctTag] === 'settle.short') {
        x.counterparties.map(cp => {
          if (cp.short === globals.acct) {
            const refund = parseFloat(cp.refund.amount)
            hist.push({
              type: 'settle.short',
              time: time,
              block: x.block,
              amount: refund,
              id: x.id,
              settle: 0,
              debit: 0,
              credit: refund,
              commission: 0,
              balance: parseFloat(cp.balance.amount),
            })
          }
          return false
        })
      }
    }
    if (x.originator === 'createQuote') {
      const backing = parseFloat(x.backing.amount)
      const commission = parseFloat(x.commission.amount)
      hist.push({
        type: 'quote.create',
        time: time,
        block: x.block,
        amount: backing,
        id: x.id,
        market: x.market,
        dur: x.dur,
        backing: backing,
        debit: backing + commission,
        credit: 0,
        commission: commission,
        balance: parseFloat(x.balance.amount)
      })
    }
    if (x.originator === 'depositQuote') {
      const backing = parseFloat(x.backing.amount)
      const commission = parseFloat(x.commission.amount)
      hist.push({
        type: 'quote.deposit',
        time: time,
        block: x.block,
        amount: backing,
        id: x.id,
        backing: backing,
        debit: backing + commission,
        credit: 0,
        commission: commission,
        balance: parseFloat(x.balance.amount)
      })
    }
    if (x.originator === 'updateQuote') {
      const commission = parseFloat(x.commission.amount)
      hist.push({
        type: 'quote.update',
        time: time,
        block: x.block,
        id: x.id,
        debit: commission,
        credit: 0,
        commission: commission,
        balance: parseFloat(x.balance.amount)
      })
    }
    if (x.originator === 'cancelQuote') {
      const refund = parseFloat(x.refund.amount)
      hist.push({
        type: 'quote.cancel',
        time: time,
        block: x.block,
        amount: refund,
        id: x.id,
        debit: 0,
        credit: refund,
        commission: 0,
        balance: parseFloat(x.balance.amount)
      })
    }
    return false
  })
  hist = hist.sort((x1, x2) => {
    if (x1.block > x2.block) return 1
    if (x1.block < x2.block) return -1
    return x1.index - x2.index
  })
  store.dispatch({
    type: HISTORY,
    page: globals.viewPage,
    pageInc: globals.viewInc,
    total: globals.totalPages,
    list: hist
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
  console.log("View trade: " + id)
  const data = await getTradeInfo(id)
  data.history = await getMarketHistory(data.trade.market, data.startBlock, data.endBlock)
  /*
  if (trade.type === "Call") {
    if (trade.history.maxp < trade.strike + trade.unitprem) trade.history.maxp = trade.strike + trade.unitprem
    if (trade.history.minp > trade.strike) trade.history.minp = trade.strike
  }
  if (trade.type === "Put") {
    if (trade.history.minp > trade.strike - trade.unitprem) trade.history.minp = trade.strike - trade.unitprem
    if (trade.history.maxp < trade.strike) trade.history.maxp = trade.strike
  }
  */
  //console.log("data=" + JSON.stringify(data, null, 2))
  store.dispatch({
    type: HISTTRADE,
    id: id,
    info: data
  })
}

async function getTradeInfo(id) {
  const info = await api.blockInfo()
  const key = "trade." + id
  const hist = await api.history(key + " CONTAINS 'event'", 0, info.block, [key])
  const data = hist.reduce((acc, x) => {
    if (x.tags[key] === "event.create") {
      acc.startBlock = x.block
      acc.start = x.time
      acc.trade = x.trade
      acc.state = "active"
    }
    if (x.tags[key] === 'event.settle') {
      acc.endBlock = x.block
      acc.end = x.time
      acc.state = "settled"
      acc.trade.final = x.final
      acc.trade.settle = x.settle
      if (acc.trade.counterParties.length === x.counterparties.length) {
        for (var i=0; i<acc.trade.counterParties.length; i++) {
          acc.trade.counterParties[i].settle = x.counterparties[i].settle
          acc.trade.counterParties[i].refund = x.counterparties[i].refund
        }
      }
    }
    return acc
  }, {})
  return data
}

const getMarketHistory = async (market, fromBlock, toBlock) => {
  if (toBlock === undefined) {
    const info = await api.blockInfo()
    toBlock = info.block
  }
  //console.log("fromBlock=" + fromBlock)
  //console.log("toBlock=" + toBlock)
  //console.log("market=" + market)
  //const history = await api.history("mtm.MarketTick='" + market + "'", fromBlock, toBlock, true)
  const history = await api.history("mtm.MarketTick='" + market + "'", fromBlock, toBlock)
  var minp = Number.MAX_VALUE
  var maxp = 0
  const data = history.reduce((acc, h) => {
    const spot = parseFloat(h.consensus.amount)
    if (minp > spot) minp = spot
    if (maxp < spot) maxp = spot
    acc.push({
      block: h.block,
      time: h.time,
      spot: spot
    })
    return acc
  }, [])
  return {
    data: data,
    minp: minp,
    maxp: maxp
  }
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
  console.log("View quote: " + id)
  const data = await getQuoteData(id)
  computeQuotePrices(data)
  store.dispatch({
    type: HISTQUOTE,
    id: id,
    info: data,
    view: {
      quotespot: true,
      quotepremiums: true,
      consensus: true,
      callpremiums: true,
      putpremiums: true
    }
  })
}

const computeQuotePrices = async data => {
  data.consensus.filter(cons => {
    var last = undefined
    data.hist.find(h => {
      if (h.block <= cons.block) last = h
      return h.block > cons.block
    })
    if (last !== undefined) {
      const deviation = last.spot - cons.spot
      cons.call = last.premium + deviation / 2
      cons.put = last.premium - deviation / 2
      if (cons.call < 0) cons.call = 0
      if (cons.put < 0) cons.put = 0
      if (data.maxp < cons.spot + cons.call) data.maxp = cons.spot + cons.call
      if (data.minp > cons.spot - cons.put) data.minp = cons.spot - cons.put
    } 
    return false
  })
}

const getQuoteData = async id => {
  const event = "quote." + id
  const latestBlock = await api.blockNumber()
  if (latestBlock.block > 2000) {
    var startBlock = latestBlock.block - 2000
  } else {
    startBlock = 0
  }
  const history = await api.history(event + "=''", startBlock, latestBlock.block)
  const quote = await api.getQuote(id)
  if (quote !== undefined) {
    var market = quote.market
    var dur = quote.dur
  }
  var state = {
    start: startBlock,
    end: latestBlock.block
  }
  var hist = []
  var minp = Number.MAX_VALUE
  var maxp = 0
  for (var i=0; i<history.length; i++) {
    const h = history[i]
    for (var j=0; j<h.tags.length; j++) {
      const t = h.tags[j]
      if (t.key === event) {
        const block = parseInt(h.block, 10)
        switch (t.value) {
          case 'create':
            market = h.market
            dur = h.dur
            state.start = block
            state.state = 'in progress'
            state.end = latestBlock.block
            hist.push({
              block: block,
              spot: h.spot,
              premium: h.premium
            })
            break
          case 'final':
            state.end = block
            state.state = 'finalized'
            break
          case 'cancel':
            state.end = block
            state.state = 'cancel'
            break
          case 'update':
            state.state = 'in progress'
            if (minp > h.spot - h.premium) minp = h.spot - h.premium
            if (maxp < h.spot + h.premium) maxp = h.spot + h.premium
            hist.push({
              block: block,
              spot: h.spot,
              premium: h.premium
            })
            break
          case 'deposit':
            state.state = 'in progress'
            break
          case 'match':
            state.state = 'in progress'
            break
          default:
        }
      }
    }
  }
  if (hist.length > 0) {
    hist.unshift({
      block: startBlock,
      spot: hist[0].spot,
      premium: hist[0].premium
    })
    hist.push({
      block: latestBlock.block,
      spot: hist[hist.length-1].spot,
      premium: hist[hist.length-1].premium
    })
  }
  const consensus = await getMarketHistory(market, state.start, state.end)
  if (consensus.data.length > 0) {
    consensus.start = startBlock
    if (consensus.data[0].block < startBlock) consensus.data[0].block = startBlock
    const last = consensus.data[consensus.data.length-1]
    if (last.block < state.end) {
      consensus.data.push({
        block: state.end,
        spot: last.spot
      })
    }
  }
  return Object.assign({
    market: market,
    dur: dur,
    hist: hist,
    minp: minp,
    maxp: maxp,
    consensus: consensus.data
  }, state)
}
