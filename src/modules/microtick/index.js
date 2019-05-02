import {createTestTokensNotification,
        createBuyNotification, 
        createPlaceQuoteNotification,
        createCancelQuoteNotification,
        createBackQuoteNotification,
        createUpdateSpotNotification,
        createUpdatePremiumNotification,
        createSettleNotification,
        createSuccessNotification,
        createErrorNotification,
        removeNotification} from '../notifications'
import { chartCursorPos, orderBookCursorPos } from '../../containers/trading/chart'
import store from '../../store'
import api from '../api'

const datafeed = require('./datafeed')

const BLOCKTIME = 5

const DEFAULTDUR = 3600
const DEFAULTCHARTSIZE = 7200

const DIALOG_TIME1 = 1500
const DIALOG_TIME2 = 1750

const PASSWORD = 'app/password'
const INVALIDPASSWORD = 'app/invalidpassword'
const RESETPASSWORD = 'app/resetpassword'
const MENU = 'app/menu'
const MARKET = 'microtick/market/select'
const DUR = 'microtick/market/dur'
const ORDERBOOK = 'microtick/market/orderbook'
const PREMIUMS = 'microtick/market/premiums'
const TICK = 'microtick/market/tick'
const LOADHIST = 'microtick/market/loadhistory'
const HISTORY = 'microtick/market/history'
const BLOCK = 'tendermint/newblock'
const ACCOUNTSELECT = 'tendermint/accountselect'
const ACCOUNT = 'tendermint/account'
const QUOTELIST = 'microtick/quote/list'
const TRADELIST = 'microtick/trade/list'
const QUOTEPARAMS= 'microtick/quote/params'
const MOUSESTATE = 'microtick/update'
const DONELOADING = 'microtick/loading'

const globals = {
  accountSubscriptions: {},
  marketSubscription: -1,
  dur: DEFAULTDUR,
  durs: [300, 900, 3600, 14400, 43200],
  spot: 0,
  chart: {
    size: DEFAULTCHARTSIZE
  },
  quote: {
    backing: 1
  },
  quotes: []
}

// eslint-disable-next-line
const CallAsk = 0
// eslint-disable-next-line
const PutAsk = 1

// eslint-disable-next-line
const BuyCall = 0
// eslint-disable-next-line
const BuyPut = 1

// eslint-disable-next-line
const Call = 0
// eslint-disable-next-line
const Put = 1

const initialState = {
  loading: true,
  blocktime: BLOCKTIME,
  password: {
    prompt: true,
    invalid: false
  },
  market: {
    selected: false,
    symbol: '',
    dur: globals.dur,
    durs: globals.durs,
    qty: 0,
    premiums: [[0], [0]],
    spot: 0
  },
  chart: {
    mouseState: 0,
    size: globals.chart.size,
    ticks: {
      minb: 0,
      maxb: 0,
      minp: 0,
      maxp: 0,
      data: []
    },
    spots: {
      data: []
    },
    premiums: {
      data: []
    },
    view: {
      minb: 0,
      maxb: 0,
      minp: 0,
      maxp: 0
    }
  },
  premiums: {
  },
  trade: {
    qty: 0,
    list: []
  },
  quote: {
    backing: 1,
    list: []
  }
}

function calcMinMax(obj) {
  var minb = obj.chart.ticks.minb
  var maxb = obj.chart.ticks.maxb
  var minp = obj.chart.ticks.minp
  var maxp = obj.chart.ticks.maxp
  obj.chart.spots.data.map(spot => {
    if (minp > spot) minp = spot
    if (maxp < spot) maxp = spot
    return 0
  })
  /*
  if (obj.premiums !== undefined) {
    const call = parseFloat(obj.premiums.indicatedSpot) + obj.premiums.indicatedCallPremium
    if (maxp < call) maxp = call
    const put = parseFloat(obj.premiums.indicatedSpot) - obj.premiums.indicatedPutPremium
    if (minp > put) minp = put
    const qtop = parseFloat(obj.premiums.qs) + obj.premiums.prem
    if (maxp < qtop) maxp = qtop
    const qbottom = parseFloat(obj.premiums.qs) - obj.premiums.prem
    if (minp > qbottom) minp = qbottom
  }
  */
  if (obj.orderbook) {
    const call = obj.market.spot + obj.orderbook.calls.maxPrem
    if (maxp < call) maxp = call
    const put = obj.market.spot - obj.orderbook.puts.maxPrem
    if (minp > put) minp = put
  }
  obj.trade.list.map(tr => {
    if ((tr.market === globals.market) && (tr.endBlock === undefined || tr.endBlock >= minb)) {
      if (tr.type === BuyCall) {
        const min = tr.strike
        if (minp > min) minp = min
        const max = tr.strike + tr.premium / tr.qty
        if (maxp < max) maxp = max
      }
      if (tr.type === BuyPut) {
        const min = tr.strike - tr.premium / tr.qty
        if (minp > min) minp = min
        const max = tr.strike
        if (maxp < max) maxp = max
      }
    }
    return null
  })
  var height = maxp - minp
  if (height === 0) height = 1
  globals.chart.minp = minp - height * .05
  globals.chart.maxp = maxp + height * .05
  return {
    ...obj,
    chart: {
      ...obj.chart,
      view: {
        minb: minb,
        maxb: maxb,
        minp: globals.chart.minp,
        maxp: globals.chart.maxp
      }
    }
  }
}

export default (state = initialState, action) => {
  //console.log("action=" + action.type)
  //console.log("state=" + JSON.stringify(state,null,2))
  switch (action.type) {
    case RESETPASSWORD:
      return {
        ...state,
        password: {
          prompt: true,
          invalid: false
        }
      }
    case PASSWORD:
      return {
        ...state,
        password: {
          prompt: false,
          invalid: false
        }
      }
    case INVALIDPASSWORD:
      return {
        ...state,
        password: {
          prompt: true,
          invalid: true
        }
      }
    case MARKET:
      return {
        ...state,
        market: {
          ...state.market,
          selected: true,
          symbol: action.selection,
          spot: action.spot,
          weight: action.weight,
          backing: action.backing,
          sumqty: action.sumqty
        },
        chart: {
          ...state.chart,
          spots: {
            data: []
          },
          premiums: {
            data: []
          }
        }
      }
    case DUR:
      return {
        ...state,
        chart: {
          ...state.chart,
          size: globals.chart.size
        },
        market: {
          ...state.market,
          dur: action.selection
        }
      }
    case ORDERBOOK:
      globals.orderbook = action
      return calcMinMax({
        ...state,
        orderbook: {
          ...action
        }
      })
    case DONELOADING:
      return {
        ...state,
        loading: false
      }
    case PREMIUMS:
      return calcMinMax({
        ...state,
        premiums: {
          ...action
        }
      })
    case TICK:
      var newdata = state.chart.ticks.data.reduce((res, el) => {
        res.push({
          block: el.block,
          value: el.value
        })
        return res
      }, [])
      newdata.push({
        block: action.block,
        value: action.spot
      })
      return calcMinMax({
        ...state,
        market: {
          ...state.market,
          spot: action.spot,
          weight: action.weight,
          backing: action.backing,
          sumqty: action.sumqty
        },
        chart: {
          ...state.chart,
          ticks: {
            ...state.chart.ticks,
            data: newdata
            
          }
        }
      })
    case LOADHIST:
      return {
        ...state,
        loading: true
      }
    case HISTORY:
      return calcMinMax({
        ...state,
        market: {
          ...state.market,
          premiums: [[0], [0]]
        },
        chart: {
          ...state.chart,
          ticks: {
            data: action.data,
            minb: action.minb,
            maxb: action.maxb,
            minp: action.minp,
            maxp: action.maxp
          },
          spots: {
            data: []
          },
          premiums: {
            data: []
          },
          size: globals.chart.size
        }
      })
    case BLOCK: 
      globals.blockNumber = action.block.number
      const delta = action.block.number - state.chart.ticks.maxb
      var targetmin = state.chart.ticks.minb + delta
      if (action.block.number - targetmin < globals.chart.size / BLOCKTIME) {
        targetmin = 0
      }
      var min = Number.MAX_VALUE, max = 0
      var last = null
      newdata = state.chart.ticks.data.reduce((res, el) => {
        if (el.block >= targetmin) {
          if (min > el.value) min = el.value
          if (max < el.value) max = el.value
          if (last != null) {
            if (min > last.value) min = last.value
            if (max < last.value) max = last.value
            res.push({
              block: last.block,
              value: last.value
            })
            last = null
          }
          res.push({
            block: el.block,
            value: el.value
          })
        } else {
          last = el
        }
        return res
      }, [])
      if (state.chart.ticks.data.length === 0) {
        max = globals.spot
        min = globals.spot
      }
      var height = max - min
      return calcMinMax({
        ...state,
        chart: {
          ...state.chart,
          ticks: {
            data: newdata,
            minb: targetmin,
            maxb: action.block.number,
            minp: min - height * .05,
            maxp: max + height * .05
          }
        }
      })
    case ACCOUNT:
      return {
        ...state,
        account: action.acct,
        balance: action.balance,
        //available: action.available
      }
    case TRADELIST:
      var list = globals.trades.map(tr => {
        return {
          ...tr
        }
      })
      list.sort((a,b) => {
        return a.id - b.id
      })
      return {
        ...state,
        trade: {
          ...state.trade,
          list: list
        }
      }
    case QUOTELIST:
      list = globals.quotes.map(q => {
        return {
          ...q
        }
      })
      list.sort((a,b) => {
        return a.id - b.id
      })
      return {
        ...state,
        quote: {
          ...state.quote,
          list: list
        }
      }
    case QUOTEPARAMS:
      return {
        ...state,
        quote: {
          ...state.quote,
          spot: globals.quote.spot,
          premium: globals.quote.premium,
          backing: globals.quote.backing
        }
      }
    case MOUSESTATE:
      return {
        ...state,
        chart: {
          ...state.chart,
          mouseState: action.mouseState
        }
      }
    default:
      return state
  }
}

async function updateHistory(dispatch) {
  dispatch({
    type: LOADHIST
  })
  // Get historic data
  const currentBlock = await api.blockInfo()
  var startBlock = currentBlock.block - globals.chart.size / BLOCKTIME
  if (startBlock < 0) startBlock = 0
  var min = Number.MAX_VALUE, max = 0
  var rawHistory = await api.history("mtm.MarketTick='" + globals.market + "'", startBlock, currentBlock.block, true)
  const currentSpot = await api.getMarketSpot(globals.market)
  if (rawHistory.length > 250) {
    // interpolate
    const inter = Math.floor(rawHistory.length / 250)
    rawHistory = rawHistory.filter((el, i) => {
      if ((i % inter) === 0) return true
      return false
    })
  }
  const history = rawHistory.map(hist => {
    const value = parseFloat(hist.consensus.amount)
    if (min > value) min = value
    if (max < value) max = value
    return {
      block: hist.block,
      value: value
    }
  })
  if (history.length === 0) {
    min = globals.spot
    max = globals.spot
  }
  history.push({
    block: currentBlock.block,
    value: parseFloat(currentSpot.consensus.amount)
  })
  var height = max - min
  const minp = min - height * .05
  const maxp = max + height * .05
  dispatch({
    type: HISTORY,
    data: history,
    minb: startBlock,
    maxb: currentBlock.block,
    minp: minp,
    maxp: maxp
  })
}

export const selectMarket = choice => {
  if (typeof choice === "string")
    globals.market = choice
  else
    globals.market = choice.value
  console.log("Market requested: " + globals.market)
  
  return async dispatch => {
    dispatch({
      type: MENU,
      target: 'trading'
    })
    
    const info = await api.getMarketInfo(globals.market)
    if (info === undefined) return
    globals.spot = parseFloat(info.consensus.amount)
    globals.weight = parseFloat(info.sumWeight.amount)
    globals.sumqty = parseFloat(info.sumWeight.amount)
    globals.backing = parseFloat(info.sumBacking.amount)
    
    updateHistory(dispatch)
    
    // Unsubscribe previous watch
    datafeed.removeMarket(globals.marketSubscription)
    
    // Subscribe MarketTick events
    //var lastId = 0
    globals.marketSubscription = datafeed.addMarket(globals.market, async event => {
      //if (event.returnValues.id < lastId) return
      //lastId = event.returnValues.id
      globals.spot = parseFloat(event.data.consensus.amount)
      const info = await api.getMarketInfo(event.value)
      globals.weight = parseFloat(info.sumWeight.amount)
      globals.sumqty = parseFloat(info.sumWeight.amount)
      globals.backing = parseFloat(info.sumBacking.amount)
      //console.log("MarketTick: " + spot)
      dispatch({
        type: TICK,
        block: event.height,
        spot: globals.spot,
        weight: globals.weight,
        sumqty: globals.sumqty,
        backing: globals.backing
      })
      fetchOrderBook(dispatch)
    })
    datafeed.subscribe()
    
    fetchOrderBook(dispatch)
  
    dispatch({
      type: MARKET,
      selection: globals.market,
      spot: globals.spot,
      weight: globals.weight,
      sumqty: globals.sumqty,
      backing: globals.backing
    })
  }
}

export const selectDur = choice => {
  globals.dur = choice
  
  switch (globals.dur) {
    case 300:
      globals.chart.size = 600
      break
    case 900:
      globals.chart.size = 1800
      break
    case 3600:
      globals.chart.size = 7200
      break
    case 14400:
      globals.chart.size = 28800
      break
    case 43200:
      globals.chart.size = 86400
      break
    default:
  }
  
  
  return async dispatch => {
    await updateHistory(dispatch)
    dispatch({
      type: DONELOADING
    })
    
    await fetchOrderBook(dispatch)
    dispatch({
      type: DUR,
      selection: globals.dur,
    })
  }
}

const selectAccount = async () => {
  const block = await api.blockInfo()
  globals.blockNumber = block.block
  const accountInfo = await api.getAccountInfo(globals.account)
  const balance = parseFloat(accountInfo.balance.amount)
  
  globals.trades = []
  
  if (globals.tradeWatch !== undefined) {
    api.unsubscribe(globals.tradeWatch)
  }
  if (globals.tradeEndWatch !== undefined) {
    api.unsubscribe(globals.tradeEndWatch)
  }
  if (globals.tradeCounterpartyWatch !== undefined) {
    api.unsubscribe(globals.tradeCounterpartyWatch)
  }
  if (globals.tradeEndCounterpartyWatch !== undefined) {
    api.unsubscribe(globals.tradeEndCounterpartyWatch)
  }
  
  Object.keys(globals.accountSubscriptions).map(key => {
    //console.log("UNSUBSCRIBE " + globals.accountSubscriptions[key])
    return datafeed.removeMarket(globals.accountSubscriptions[key])
  })
  globals.accountSubscriptions = {}
  
  async function tradeMarketTick(ev) {
    console.log("ev=" + JSON.stringify(ev, null, 2))
    const market = ev.value
    const spot = parseFloat(ev.data.consensus.amount)
    globals.trades.map(trade => {
      if (trade.market === market) {
        trade.spot = spot
        trade.current = (trade.type === 0) ? 
          (spot > trade.strike ? (spot - trade.strike) * trade.qty : 0) :
          (spot < trade.strike ? (trade.strike - spot) * trade.qty : 0)
        if (trade.current > trade.backing) trade.current = trade.backing
        trade.profit = trade.dir === 'long' ? trade.current - trade.premium : trade.premium - trade.current
      }
      return null
    })
    store.dispatch({
      type: TRADELIST
    })
  }
  
  async function processTrade(height, data, dir) {
    const id = data.id
    const type = data.type ? BuyPut : BuyCall
    const market = data.market
    const start = new Date(data.start)
    const end = new Date(data.expiration)
    const strike = parseFloat(data.strike.amount)
    const backing = data.counterParties.reduce((acc, el) => {
      acc += parseFloat(el.backing.amount)
      return acc
    }, 0)
    const qty = parseFloat(data.quantity.amount)
    const prem = parseFloat(data.cost.amount)
    const data2 = await api.getMarketSpot(market)
    const spot = parseFloat(data2.consensus.amount)
    console.log(JSON.stringify(spot))
    var current = (type === 0) ? 
      (spot > strike ? (spot - strike) * qty : 0) :
      (spot < strike ? (strike - spot) * qty : 0) 
    if (current > backing) current = backing
    const profit = dir === 'long' ? current - prem : prem - current
    const trade = {
      id: id,
      dir: dir,
      type: type,
      active: true,
      market: market,
      dur: api.durationReverseLookup[data.duration],
      spot: spot,
      startBlock: height,
      start: start,
      end: end,
      strike: strike,
      backing: backing,
      qty: qty,
      premium: prem,
      current: current,
      profit: profit,
      final: strike
    }
    //console.log("Adding trade: " + JSON.stringify(trade))
    globals.trades.push(trade)
    globals.accountSubscriptions[id] = datafeed.addMarket(market, tradeMarketTick)
  }
  async function processTradeEnd(height, timestamp, id, finalSpots) {
    globals.trades = globals.trades.filter(tr => {
      if (tr.id === id) {
        //console.log("Setting trade to inactive")
        tr.active = false
        tr.end = timestamp
        tr.endBlock = height
        const final = finalSpots[tr.market]
        if ((tr.type === Call && final > tr.strike) || (tr.type === Put && final < tr.strike)) {
          tr.final = finalSpots[tr.market]
        }
      }
      return true;
    })
    const accountInfo = await api.getAccountInfo(globals.account)
    const balance = parseFloat(accountInfo.balance.amount)
    store.dispatch({
      type: ACCOUNT,
      acct: globals.account, 
      balance: balance,
    })
    datafeed.removeMarket(globals.accountSubscriptions[id])
    delete globals.accountSubscriptions[id]
  }
  
  new Promise(async () => {
    // Get past trades
    var startBlock = globals.blockNumber - 43200 / BLOCKTIME
    if (startBlock < 0) startBlock = 0
    var events = await api.history("acct." + globals.account + "='trade.long'", startBlock, globals.blockNumber)
    for (var i=0; i<events.length; i++) {
      var ev = events[i]
      //console.log(JSON.stringify(ev, null, 2))
      await processTrade(ev.block, ev.trade, 'long')
    }
    events = await api.history("acct." + globals.account + "='settle.long'", startBlock, globals.blockNumber)
    for (i=0; i<events.length; i++) {
      ev = events[i]
      for (var j=0; j<ev.trades.length; j++) {
        if (ev.trades[j].long === globals.account) {
          const trade = ev.trades[j].id
          await processTradeEnd(ev.block, ev.timestamp, trade, ev.final)
        }
      }
    }
    events = await api.history("acct." + globals.account + "='trade.short'", startBlock, globals.blockNumber)
    for (i=0; i<events.length; i++) {
      ev = events[i]
      await processTrade(ev.block, ev.trade, 'short')
    }
    events = await api.history("acct." + globals.account + "='settle.short'", startBlock, globals.blockNumber)
    for (i=0; i<events.length; i++) {
      ev = events[i]
      for (j=0; j<ev.trades.length; j++) {
        const trade = ev.trades[j]
        for (var k=0; k<trade.counterparties.length; k++) {
          if (trade.counterparties[k].short === globals.account) {
            await processTradeEnd(ev.block, ev.timestamp, trade.id, ev.final)
          }
        }
      }
    }
    datafeed.subscribe()
    store.dispatch({
      type: TRADELIST
    })
  })
  
  globals.tradeWatch = await api.subscribe("acct." + globals.account + "='trade.long'", async ev => {
    await processTrade(ev.height, ev.data.trade, 'long')
    datafeed.subscribe()
    store.dispatch({
      type: TRADELIST
    })
  })
  globals.tradeEndWatch = await api.subscribe("acct." + globals.account + "='settle.long'", async ev => {
    for (var i=0; i<ev.data.trades.length; i++) {
      if (ev.data.trades[i].long === globals.account) {
        const trade = ev.data.trades[i].id
        await processTradeEnd(ev.height, ev.timestamp, trade, ev.data.final)
      }
    }
    datafeed.subscribe()
    store.dispatch({
      type: TRADELIST
    })
  })
  globals.tradeCounterpartyWatch = await api.subscribe("acct." + globals.account + "='trade.short'", async ev => {
    fetchActiveQuotes(store.dispatch)
    fetchOrderBook(store.dispatch)
    await processTrade(ev.height, ev.data.trade, 'short')
    datafeed.subscribe()
    store.dispatch({
      type: TRADELIST
    })
  })
  globals.tradeEndCounterpartyWatch = await api.subscribe("acct." + globals.account + "='settle.short'", async ev => {
    for (var i=0; i<ev.data.trades.length; i++) {
      const trade = ev.data.trades[i]
      for (var j=0; j<trade.counterparties.length; j++) {
        if (trade.counterparties[j].short === globals.account) {
          await processTradeEnd(ev.height, ev.timestamp, trade.id, ev.data.final)
        }
      }
    }
    datafeed.subscribe()
    store.dispatch({
      type: TRADELIST
    })
  })
  
  fetchActiveQuotes(store.dispatch)

  store.dispatch({
    type: ACCOUNTSELECT,
    acct: globals.account
  })
  store.dispatch({
    type: ACCOUNT,
    acct: globals.account,
    balance: balance,
  })
}

async function fetchOrderBook(dispatch) {
  if (globals.market === undefined || globals.dur === undefined) return
  
  const market = globals.market
  const dur = globals.dur
  
  const totalQty = {}
  const totalWeight = {}
  const obData = await api.getMarketInfo(market)
  for (var i=0; i<globals.durs.length; i++) {
    totalQty[globals.durs[i]] = parseFloat(obData.orderBooks[i].sumWeight.amount)
    totalWeight[globals.durs[i]] = parseFloat(obData.orderBooks[i].sumWeight.amount)
  }
  
  const computePricing = async type => {
    const obj = {}
    obj.maxPrem = 0
    obj.maxCost = 0
    obj.cursorX = 0
    obj.cursorY = 0
    obj.quotes = []
    try {
      const consensusData = await api.getMarketSpot(market)
      const marketSpot = parseFloat(consensusData.consensus.amount)
      const orderBookInfo = await api.getOrderbookInfo(market, api.durationReverseLookup[dur])
      var q1 = 0.0 // quantity
      var c = 0.0 // cost
      if (type === CallAsk) {
        var quotes = orderBookInfo.calls
      } else {
        quotes = orderBookInfo.puts
      }
      for (var i=0; i<quotes.length; i++) {
        const id = parseInt(quotes[i], 10)
        if (id !== 0) {
          const data = await api.getQuote(id)
          const quoteQty = parseFloat(data.quantity.amount)
          const quoteSpot = parseFloat(data.spot.amount)
          const quotePrem = parseFloat(data.premium.amount)
          if (type === CallAsk) {
            var prem = quotePrem - (marketSpot - quoteSpot) / 2
          } else {
            prem = quotePrem + (marketSpot - quoteSpot) / 2
          }
          if (prem < 0) prem = 0
          const q2 = q1 + quoteQty
          if (obj.maxPrem < prem) obj.maxPrem = prem
          const tmp = {
            id: id,
            premium: prem,
            qty: quoteQty,
            c: c,
            q1: q1,
            q2: q2,
          }
          q1 = q2
          c = c + prem * quoteQty 
          if (obj.maxCost < c) obj.maxCost = c
          obj.quotes.push(tmp)
        }
      }
    } catch (err) {
      //console.log("No quotes for " + market + " : " + dur)
    }
    obj.price = qty => {
      if (qty === 0) return 0
      for (var i=0; i<obj.quotes.length; i++) {
        const q = obj.quotes[i]
        if (qty >= q.q1 && qty <= q.q2) {
          const p = (q.c + (qty - q.q1) * q.premium) / qty
          return p
        }
      }
      return obj.maxPrem
    }
    return obj
  }
  
  const calls = await computePricing(CallAsk)
  const puts = await computePricing(PutAsk)
  
  dispatch({
    type: ORDERBOOK,
    totalQty: totalQty,
    totalWeight: totalWeight,
    calls: calls,
    puts: puts,
    cursorVisible: false,
    computeCallPrice: qty => {
      return calls.price(qty)
    },
    computePutPrice: qty => {
      return puts.price(qty)
    },
    setBuyPremium: (q, isCall) => {
      globals.qty = q
      dispatch({
        type: PREMIUMS,
        buy: true,
        qty: q,
        qs: globals.spot,
        prem: isCall ? calls.price(q) : puts.price(q),
        weight: 0,
        indicatedSpot: globals.spot,
        indicatedCallPremium: isCall ? calls.price(q) : 0,
        indicatedPutPremium: isCall ? 0 : puts.price(q) 
      })
    },
    setQuotePremiums: (q, spot, prem, w, ns, c, p) => {
      globals.quote.spot = spot
      globals.quote.premium = prem
      globals.quote.newspot = ns
      dispatch({
        type: PREMIUMS,
        buy: false,
        qty: q,
        qs: spot,
        prem: prem,
        weight: w,
        indicatedSpot: ns,
        indicatedCallPremium: c,
        indicatedPutPremium: p
      })
    }
  })
  
  dispatch({
    type: DONELOADING
  })
  
}

async function fetchActiveQuotes(dispatch) {
  // Get current quotes
  console.log("Fetching quotes for account " + globals.account)
  globals.quotes = []
  //const quoteInfo = await api.getAccountQuotes(globals.account)
  var accountInfo = await api.getAccountInfo(globals.account)
  const quoteInfo = accountInfo.activeQuotes
  for (var i=0; i<quoteInfo.length; i++) {
    const quoteId = quoteInfo[i]
    const quote = await api.getQuote(quoteId)
    globals.quotes.push(quote)
  }
  dispatch({
    type: QUOTELIST
  })
}
    
export const buyParams = () => {
  return {
    qty: globals.qty.toFixed(18),
    market: globals.market,
    dur: globals.dur
  }
}

export const buyCall = () => {
  console.log("buying call")
  return async dispatch => {
    dispatch({
      type: MOUSESTATE,
      mouseState: 0
    })
    const qty = parseFloat(globals.qty.toFixed(6))
    const market = globals.market
    const dur = api.durationReverseLookup[globals.dur]
    const notId = createBuyNotification(dispatch, BuyCall, market, dur, qty)
    try {
      await api.marketTrade(market, dur, "call", qty)
      //console.log("Result=" + JSON.stringify(tx, null, 2))
      setTimeout(() => {
        removeNotification(dispatch, notId)
      }, DIALOG_TIME1)
      createSuccessNotification(dispatch, DIALOG_TIME2, notId)
      const accountInfo = await api.getAccountInfo(globals.account)
      const balance = parseFloat(accountInfo.balance.amount)
      dispatch({
        type: ACCOUNT,
        acct: globals.account, 
        balance: balance
      })
    } catch (err) {
      removeNotification(dispatch, notId)
      createErrorNotification(dispatch, "Buy call failed", err.message)
    }
  }
}

export const buyPut = () => {
  console.log("buying put")
  return async dispatch => {
    dispatch({
      type: MOUSESTATE,
      mouseState: 0
    })
    const qty = parseFloat(globals.qty.toFixed(6))
    const market = globals.market
    const dur = api.durationReverseLookup[globals.dur]
    const notId = createBuyNotification(dispatch, BuyPut, market, dur, qty)
    try {
      await api.marketTrade(market, dur, "put", qty)
      //console.log("Result=" + JSON.stringify(tx, null, 2))
      setTimeout(() => {
        removeNotification(dispatch, notId)
      }, DIALOG_TIME1)
      createSuccessNotification(dispatch, DIALOG_TIME2, notId)
      const accountInfo = await api.getAccountInfo(globals.account)
      const balance = parseFloat(accountInfo.balance.amount)
      dispatch({
        type: ACCOUNT,
        acct: globals.account, 
        balance: balance
      })
    } catch (err) {
      removeNotification(dispatch, notId)
      createErrorNotification(dispatch, "Buy put failed", err.message)
    }
  }
}

export const cancelDialog = () => {
  return async dispatch => {
    dispatch({
      type: MOUSESTATE,
      mouseState: 0
    })
  }
}

function newQuoteParams(dispatch) {
  const prem = globals.quote.premium
  const spot = globals.quote.spot
  const qty = globals.quote.backing / (10 * prem)
  const weight = qty
  globals.quote.newspot = (globals.spot * globals.weight + spot * weight) / (weight + parseFloat(globals.weight))
  var call = prem + (spot - globals.quote.newspot) / 2
  if (call < 0) call = 0
  var put = prem - (spot - globals.quote.newspot) / 2
  if (put < 0) put = 0
  dispatch({
    type: PREMIUMS,
    buy: false,
    qty: qty,
    qs: spot,
    prem: prem,
    weight: weight,
    indicatedSpot: globals.quote.newspot,
    indicatedCallPremium: call,
    indicatedPutPremium: put
  })
}

export const changeQtyCall = event => {
  var qty = parseFloat(event.target.value)
  if (qty < 0 || isNaN(qty)) qty = 0
  if (qty > globals.orderbook.totalQty[globals.dur]) qty = globals.orderbook.totalQty[globals.dur]
  return async dispatch => {
    globals.orderbook.setBuyPremium(qty, true)
    orderBookCursorPos(qty, globals.orderbook.totalQty[globals.dur], globals.spot, true, globals.orderbook.calls.price(qty),
      globals.chart.maxp, globals.chart.minp) 
  }
}

export const changeQtyPut = event => {
  var qty = parseFloat(event.target.value)
  if (qty < 0 || isNaN(qty)) qty = 0
  return async dispatch => {
    globals.orderbook.setBuyPremium(qty, false)
    orderBookCursorPos(qty, globals.orderbook.totalQty[globals.dur], globals.spot, false, globals.orderbook.puts.price(qty),
      globals.chart.maxp, globals.chart.minp) 
  }
}

export const changeBacking = event => {
  var backing = parseFloat(event.target.value)
  if (backing < 0) backing = 0
  return async dispatch => {
    globals.quote.backing = backing.toString()
    dispatch({
      type: QUOTEPARAMS
    })
    newQuoteParams(dispatch)
    const qty = globals.quote.backing / 10 * globals.quote.premium
    chartCursorPos(qty, globals.quote.spot, globals.quote.premium, globals.quote.newspot, globals.chart.maxp, globals.chart.minp)
  }
}

export const changeSpot = event => {
  var spot = parseFloat(event.target.value)
  //var step = parseFloat(event.target.step)
  //spot = step * Math.floor(spot / step)
  if (spot < 0) spot = 0
  return async dispatch => {
    globals.quote.spot = spot.toString()
    dispatch({
      type: QUOTEPARAMS
    })
    newQuoteParams(dispatch)
    const qty = globals.quote.backing / 10 * globals.quote.premium
    chartCursorPos(qty, globals.quote.spot, globals.quote.premium, globals.quote.newspot, globals.chart.maxp, globals.chart.minp)
  }
}

export const changePremium = event => {
  var premium = parseFloat(event.target.value)
  if (premium < 0) premium = 0
  return async dispatch => {
    if (premium > 0) globals.quote.premium = premium.toString()
    dispatch({
      type: QUOTEPARAMS
    })
    newQuoteParams(dispatch)
    const qty = globals.quote.backing / 10 * globals.quote.premium
    chartCursorPos(qty, globals.quote.spot, globals.quote.premium, globals.quote.newspot, globals.chart.maxp, globals.chart.minp)
  }
}

export const placeQuote = () => {
  return async dispatch => {
    dispatch({
      type: MOUSESTATE,
      mouseState: 0
    })
    const market = globals.market
    const dur = globals.dur
    const spot = globals.quote.spot
    const premium = globals.quote.premium
    const backing = globals.quote.backing
    console.log("Placing quote: ")
    console.log("  market: " + market)
    console.log("  dur: " + dur)
    console.log("  spot: " + spot)
    console.log("  premium: " + premium)
    console.log("  backing: " + backing + "(" + typeof backing + ")")
    const notId = createPlaceQuoteNotification(dispatch, market, dur, spot, premium, backing)
    try {
      const tx = await api.createQuote(market, dur, spot, premium, parseFloat(backing))
      setTimeout(() => {
        removeNotification(dispatch, notId)
      }, DIALOG_TIME1)
      createSuccessNotification(dispatch, DIALOG_TIME2, notId)
      const id = tx.data.id
      const data = await api.getQuote(id)
      const weight = data.quantity
      globals.quotes.push({
        id: id,
        provider: data.provider,
        market: market,
        dur: dur,
        spot: spot,
        premium: data.premium,
        backing: data.backing,
        modified: data.modified,
        canModify: data.canModify,
        quantity: data.quantity,
        weight: weight
      })
      dispatch({
        type: QUOTELIST
      })
      const accountInfo = await api.getAccountInfo(globals.account)
      const balance = parseFloat(accountInfo.balance.amount)
      dispatch({
        type: ACCOUNT,
        acct: globals.account, 
        balance: balance,
      })
    } catch (err) {
      removeNotification(dispatch, notId)
      createErrorNotification(dispatch, "Place quote failed", err.message)
    }
  }
}

export const cancelQuote = async (dispatch, id) => {
  console.log("Canceling quote: " + id)
  const notId = createCancelQuoteNotification(dispatch, id)
  try {
    await api.cancelQuote(id)
    setTimeout(() => {
      removeNotification(dispatch, notId)
    }, DIALOG_TIME1)
    createSuccessNotification(dispatch, DIALOG_TIME2, notId)
    globals.quotes = globals.quotes.filter(q => {
      if (q.id !== id) {
        return true
      }
      return false
    })
    dispatch({
      type: QUOTELIST
    })
    const accountInfo = await api.getAccountInfo(globals.account)
    const balance = parseFloat(accountInfo.balance.amount)
    dispatch({
      type: ACCOUNT,
      acct: globals.account, 
      balance: balance
    })
  } catch (err) {
    removeNotification(dispatch, notId)
    createErrorNotification(dispatch, "Cancellation failed", err.message)
  }
}

export const backQuote = async (dispatch, id, amount) => {
  console.log("Backing quote: " + id + " amount=" + amount)
  const notId = createBackQuoteNotification(dispatch, id, amount)
  try {
    await api.depositQuote(id, amount)
    setTimeout(() => {
      removeNotification(dispatch, notId)
    }, DIALOG_TIME1)
    createSuccessNotification(dispatch, DIALOG_TIME2, notId)
    fetchActiveQuotes(dispatch)
    const accountInfo = await api.getAccountInfo(globals.account)
    const balance = parseFloat(accountInfo.balance.amount)
    dispatch({
      type: ACCOUNT,
      acct: globals.account, 
      balance: balance,
    })
  } catch (err) {
    removeNotification(dispatch, notId)
    createErrorNotification(dispatch, "Deposit failed", err.message)
  }
}

export const updateSpot = async (dispatch, id, newspot) => {
  console.log("Updating spot: " + id + " new spot=" + newspot)
  const notId = createUpdateSpotNotification(dispatch, id, newspot)
  try {
    await api.updateQuote(id, newspot, 0)
    setTimeout(() => {
      removeNotification(dispatch, notId)
    }, DIALOG_TIME1)
    createSuccessNotification(dispatch, DIALOG_TIME2, notId)
    fetchActiveQuotes(dispatch)
  } catch (err) {
    removeNotification(dispatch, notId)
    createErrorNotification(dispatch, "Update spot failed", err.message)
  }
}

export const updatePremium = async (dispatch, id, newpremium) => {
  console.log("Updating premium: " + id + " new premium=" + newpremium)
  const notId = createUpdatePremiumNotification(dispatch, id, newpremium)
  try {
    await api.updateQuote(id, 0, newpremium)
    setTimeout(() => {
      removeNotification(dispatch, notId)
    }, DIALOG_TIME1)
    createSuccessNotification(dispatch, DIALOG_TIME2, notId)
    fetchActiveQuotes(dispatch)
  } catch (err) {
    removeNotification(dispatch, notId)
    createErrorNotification(dispatch, "Update premium failed", err.message)
  }
}

export const mouseState = mouseState => {
  return async dispatch => {
    dispatch({
      type: MOUSESTATE,
      mouseState: mouseState
    })
  }
}

export const testBalance = () => {
  console.log("Setting test balance")
  return async dispatch => {
    const notId = createTestTokensNotification(dispatch, 1000)
    await api.depositAccount(globals.account, 1000)

    const accountInfo = await api.getAccountInfo(globals.account)
    const balance = parseFloat(accountInfo.balance.amount)
    setTimeout(() => {
      removeNotification(dispatch, notId)
    }, DIALOG_TIME1)
    createSuccessNotification(dispatch, DIALOG_TIME2, notId)
    dispatch({
      type: ACCOUNT,
      acct: globals.account,
      balance: balance
    })
  }
}

export const settleTrade = async (dispatch, id) => {
  console.log("Settling trade: " + id)
  const notId = createSettleNotification(dispatch, id)
  try {
    await api.settleTrades()
    setTimeout(() => {
      removeNotification(dispatch, notId)
    }, DIALOG_TIME1)
    createSuccessNotification(dispatch, DIALOG_TIME2, notId)
  } catch (err) {
    removeNotification(dispatch, notId)
  }
}

export const newAccount = () => {
  return async dispatch => {
    document.cookie = "mtm.account=;max-age=-99999999;"
    dispatch({
      type: RESETPASSWORD
    })
  }
}

export const choosePassword = () => {
  return async dispatch => {
    dispatch({
      type: PASSWORD
    })
    const password = document.getElementById('password').value
    var keys = await api.generateWallet()
    console.log("keys=" + JSON.stringify(keys))
    await api.createAccount(keys)
    keys.priv = btoa(window.sjcl.encrypt(password, keys.priv))
    document.cookie = "mtm.account=" + JSON.stringify(keys) + ";max-age=31536000;"
    console.log("Creating account on server: " + keys.acct)
    globals.account = keys.acct
    selectAccount()
  }
}

export const enterPassword = () => {
  return async dispatch => {
    dispatch({
      type: PASSWORD
    })
    const password = document.getElementById('password').value
    const checkAccount = document.cookie.split(';').filter(item => {
      return item.indexOf('mtm.account=') >= 0
    }).map(item => {
      return item.slice(item.indexOf('=') + 1)
    })
    const keys = JSON.parse(checkAccount[0])
    try {
      keys.priv = window.sjcl.decrypt(password, atob(keys.priv))
      console.log("Creating account on server: " + keys.acct)
      await api.createAccount(keys)
      globals.account = keys.acct
      selectAccount()
    } catch (err) {
      dispatch({
        type: INVALIDPASSWORD
      })
    }
  }
}
