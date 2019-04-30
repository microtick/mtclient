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
  
  const event = "acct." + globals.acct
  globals.transaction_count = await api.totalEvents(event + "=''")
  globals.totalPages = Math.ceil(globals.transaction_count / globals.viewInc)
  
  //console.log("View history page=" + globals.viewPage + " inc=" + globals.viewInc)
  //console.log("account=" + globals.acct)
  //console.log("transaction count=" + globals.transaction_count)
  
  const history = await api.pageHistory(event + "=''", globals.viewPage, globals.viewInc)
  var hist = []
  for (var i=0; i<history.length; i++) {
    const x = history[i]
    const block = await api.getBlock(x.block)
    const time = new Date(block.header.time).toLocaleString("en-US")
    // Step 1 - Iterate over tags and identify events
    const events = []
    for (var j=0; j<x.tags.length; j++) {
      const t = x.tags[j]
      if (t.key === event && !events.includes(t.value)) {
        events.push(t.value)
      }
    }
    const blockNum = parseInt(x.block, 10)
    // Step 2 - add transactions
    if (events.includes('create')) {
      hist.push({
        type: 'create',
        time: time,
        block: blockNum,
        index: x.index,
        debit: 0,
        credit: x.balance,
        commission: 0,
        balance: x.balance
      })
    }
    if (events.includes('quote.create')) {
      hist.push({
        type: 'quote.create',
        time: time,
        block: blockNum,
        index: x.index,
        id: x.id,
        market: x.market,
        dur: x.dur,
        backing: x.backing,
        debit: x.backing,
        credit: 0,
        commission: x.commission,
        balance: x.balance
      })
    }
    if (events.includes('quote.deposit')) {
      hist.push({
        type: 'quote.deposit',
        time: time,
        block: blockNum,
        index: x.index,
        id: x.id,
        backing: x.backing,
        debit: x.backing,
        credit: 0,
        commission: x.commission,
        balance: x.balance
      })
    }
    if (events.includes('quote.cancel')) {
      hist.push({
        type: 'quote.cancel',
        time: time,
        block: blockNum,
        index: x.index,
        id: x.id,
        debit: 0,
        credit: x.refund,
        commission: x.commission,
        balance: x.balance
      })
    }
    if (events.includes('quote.update')) {
      hist.push({
        type: 'quote.update',
        time: time,
        block: blockNum,
        index: x.index,
        id: x.id,
        debit: 0,
        credit: 0,
        commission: x.commission,
        balance: x.balance
      })
    }
    if (events.includes('trade.long')) {
      hist.push({
        type: 'trade.long',
        time: time,
        block: blockNum,
        index: x.index,
        id: x.trade.id,
        premium: x.trade.premium,
        ttype: x.trade.type,
        market: x.trade.market,
        dur: x.trade.dur,
        debit: x.trade.premium,
        credit: 0,
        commission: x.trade.commission,
        balance: x.trade.startBalance
      })
    }
    if (events.includes('trade.short')) {
      for (var k=0; k<x.trade.counterparties.length; k++) {
        const cp = x.trade.counterparties[k]
        if (cp.short === globals.acct) {
          hist.push({
            type: 'trade.short',
            time: time,
            block: blockNum,
            index: x.index,
            id: x.trade.id,
            ttype: x.trade.type,
            market: x.trade.market,
            dur: x.trade.dur,
            premium: cp.premium,
            debit: 0,
            credit: cp.premium,
            commission: 0,
            balance: cp.startBalance
          })
        }
      }
    }
    if (events.includes('settle.long')) {
      for (k=0; k<x.trades.length; k++) {
        const tr = x.trades[k]
        if (tr.long === globals.acct) {
          hist.push({
            type: 'settle.long',
            time: time,
            block: blockNum,
            index: x.index,
            id: tr.id,
            market: tr.market,
            dur: tr.dur,
            settle: tr.settle,
            debit: 0,
            credit: tr.settle,
            commission: 0,
            balance: tr.endBalance
          })
        }
      }
    }
    if (events.includes('settle.short')) {
      for (k=0; k<x.trades.length; k++) {
        const tr = x.trades[k]
        for (var l=0; l<tr.counterparties.length; l++) {
          const cp = tr.counterparties[l]
          if (cp.short === globals.acct) {
            hist.push({
              type: 'settle.short',
              time: time,
              block: blockNum,
              index: x.index,
              id: tr.id,
              market: tr.market,
              dur: tr.dur,
              settle: cp.settle,
              debit: 0,
              credit: cp.settle,
              commission: 0,
              balance: cp.endBalance
            })
          }
        }
      }
    }
  }
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
  store.dispatch({
    type: HISTTRADE,
    id: id,
    info: data
  })
}

async function getTradeInfo(id) {
  const latestBlock = await api.blockNumber()
  const hist = await api.history("trade." + id + "=''", 0, latestBlock.block)
  const data = hist.reduce((acc, x) => {
    x.tags.map(t => {
      if (t.key === "trade." + id) {
        if (t.value === 'start') {
          acc.startBlock = x.block
          acc.start = x.consensus
          acc.trade = x.trade
          acc.state = "active"
        }
        if (t.value === 'settle') {
          acc.endBlock = x.block
          acc.state = "settled"
          acc.trade = x.trades.reduce((acc2, y) => {
            if (y.id === id) {
              acc2 = y 
              acc.end = x.final[y.market]
            }
            return acc2
          }, 0)
        }
      }
      return false
    })
    return acc
  }, {})
  return data
}

const getMarketHistory = async (market, fromBlock, toBlock) => {
  if (toBlock === undefined) {
    const latestBlock = await api.blockNumber()
    toBlock = latestBlock.block
  }
  //console.log("fromBlock=" + fromBlock)
  //console.log("toBlock=" + toBlock)
  //console.log("market=" + market)
  //const history = await api.history("mtm.MarketTick='" + market + "'", fromBlock, toBlock, true)
  const history = await api.historyHack(market, fromBlock, toBlock)
  var minp = Number.MAX_VALUE
  var maxp = 0
  const data = history.map(h => {
    if (minp > h.spot) minp = h.spot
    if (maxp < h.spot) maxp = h.spot
    return {
      block: h.block,
      spot: h.spot
    }
  })
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
