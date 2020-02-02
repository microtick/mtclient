import {createBuyNotification, 
        createPlaceQuoteNotification,
        createCancelQuoteNotification,
        createBackQuoteNotification,
        createUpdateSpotNotification,
        createUpdatePremiumNotification,
        createSettleNotification,
        createFaucetRequestNotification,
        createSuccessNotification,
        createErrorNotification,
        createFaucetLimitNotification,
        removeNotification} from '../notifications'
import { chartCursorPos, orderBookCursorPos } from '../../containers/trading/chart'
import store from '../../store'
import api from '../api'
import { init } from '../chain/tendermint'
import { SequentialTaskQueue } from 'sequential-task-queue'
import axios from 'axios'

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
  dur: DEFAULTDUR,
  durs: [300, 900, 3600, 14400, 43200],
  spot: 0,
  chart: {
    size: DEFAULTCHARTSIZE
  },
  quote: {
    backing: 100
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
  balance: 0,
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
    backing: 100,
    list: []
  }
}

api.addTickHandler(async (market, data) => {
  if (market === globals.market) {
    globals.spot = data.consensus
    const info = await api.getMarketInfo(market)
    globals.weight = info.sumWeight
    globals.sumqty = info.sumWeight
    globals.backing = info.sumBacking
    store.dispatch({
      type: TICK,
      block: data.height,
      time: data.time,
      spot: globals.spot,
      weight: globals.weight,
      sumqty: globals.sumqty,
      backing: globals.backing
    })
    fetchOrderBook()
  }
  for (var i=0; i<globals.trades.length; i++) {
    const trade = globals.trades[i]
    if (trade.market === market) {
      trade.spot = data.consensus
      trade.current = (trade.type === 0) ? 
        (trade.spot > trade.strike ? (trade.spot - trade.strike) * trade.qty : 0) :
        (trade.spot < trade.strike ? (trade.strike - trade.spot) * trade.qty : 0)
      if (trade.current > trade.backing) trade.current = trade.backing
      trade.profit = trade.dir === 'long' ? trade.current - trade.premium : trade.premium - trade.current
    }
  }
  store.dispatch({
    type: TRADELIST
  })
})

const accountQueue = new SequentialTaskQueue()
api.addAccountHandler(async (key, data) => {
  //console.log(JSON.stringify(data, null, 2))
  accountQueue.push(async () => {
    //console.log("key=" + key + " " + data.height)
    if (key === "deposit" || key === "withdraw") {
      const accountInfo = await api.getAccountInfo(globals.account)
      store.dispatch({
        type: ACCOUNT,
        acct: globals.account, 
        balance: accountInfo.balance,
      })
    }
    if (key.startsWith("trade")) {
      await processTradeStart(data)
      store.dispatch({
        type: TRADELIST
      })
    }
    if (key.startsWith("settle")) {
      await processTradeEnd(data)
      store.dispatch({
        type: TRADELIST
      })
    }
    //if (key.startsWith("quote")) {
      //await fetchActive()
      //await fetchOrderBook()
    //}
  })
})
    

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
        maxp: globals.chart.maxp,
        now: Date.now(),
        dur: globals.dur * 2000
      }
    }
  }
}

async function processTradeStart(trade) {
  //console.log("processTradeStart: " + trade.id)
  //console.log("processTrade=" + JSON.stringify(ev, null, 2))
  const end = new Date(trade.expiration)
  if (Date.parse(end) > Date.now()) {
    const dir = trade.long === globals.account ? 'long' : 'short'
    const id = trade.id
    //console.log("Trade start: " + id)
    const type = trade.option === "call" ? BuyCall : BuyPut
    const market = trade.market
    const start = new Date(trade.start)
    const spot = await api.getMarketSpot(trade.market)
    var current = (type === 0) ? (spot.consensus > trade.strike ? 
      (spot.consensus - trade.strike) * trade.quantity : 0) : 
      (spot.consensus < trade.strike ? (trade.strike - spot.consensus) * trade.quantity : 0) 
    if (current > trade.backing) current = trade.backing
    const profit = dir === 'long' ? current - trade.cost : trade.cost - current
    const tradeData = {
      id: id,
      dir: dir,
      type: type,
      active: true,
      market: market,
      dur: trade.duration,
      spot: spot.consensus,
      startBlock: trade.height,
      start: start, 
      end: end,
      strike: trade.strike,
      backing: trade.backing,
      qty: trade.quantity,
      premium: trade.cost,
      current: current,
      profit: profit,
      final: trade.strike
    }
    globals.trades.push(tradeData)
    globals.accountSubscriptions[id] = market
    await api.subscribe(market)
  }
}

async function processTradeEnd(trade) {
  //console.log("processTradeEnd: " + trade.id)
  //console.log("Trade end: " + trade.id)
  globals.trades = globals.trades.filter(async tr => {
    if (tr.id === trade.id) {
      tr.active = false
      //tr.end = ev.timestamp
      tr.endBlock = trade.height
      const final = trade.final
      if ((tr.type === Call && final > tr.strike) || (tr.type === Put && final < tr.strike)) {
        tr.final = final
      }
      const accountInfo = await api.getAccountInfo(globals.account)
      store.dispatch({
        type: ACCOUNT,
        acct: globals.account, 
        balance: accountInfo.balance,
      })
      await api.unsubscribe(globals.accountSubscriptions[trade.id])
      delete globals.accountSubscriptions[trade.id]
    }
    return true;
  })
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
          time: el.time,
          value: el.value
        })
        return res
      }, [])
      newdata.push({
        block: action.block,
        time: action.time,
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
              time: last.time,
              value: last.value
            })
            last = null
          }
          res.push({
            block: el.block,
            time: el.time,
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

async function updateHistory() {
  store.dispatch({
    type: LOADHIST
  })
  // Get historic data
  const currentBlock = await api.blockInfo()
  var startBlock = currentBlock.block - globals.chart.size / BLOCKTIME
  if (startBlock < 0) startBlock = 0
  var min = Number.MAX_VALUE, max = 0
  const currentSpot = await api.getMarketSpot(globals.market)
  const rawHistory = await api.marketHistory(globals.market, startBlock, currentBlock.block, 100)
  const history = rawHistory.map(hist => {
    const value = hist.consensus
    if (min > value) min = value
    if (max < value) max = value
    return {
      block: hist.height,
      time: hist.time,
      value: value
    }
  })
  if (history.length === 0) {
    min = globals.spot
    max = globals.spot
  }
  history.push({
    block: currentBlock.block,
    time: Date.now(),
    value: currentSpot.consensus
  })
  var height = max - min
  const minp = min - height * .05
  const maxp = max + height * .05
  //console.log("minp=" + minp)
  //console.log("maxp=" + maxp)
  store.dispatch({
    type: HISTORY,
    data: history,
    minb: startBlock,
    maxb: currentBlock.block,
    minp: minp,
    maxp: maxp
  })
  store.dispatch({
    type: DONELOADING
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
    globals.spot = info.consensus
    globals.weight = info.sumWeight
    globals.sumqty = info.sumWeight
    globals.backing = info.sumBacking
    
    updateHistory()
    
    // Unsubscribe previous watch
    if (globals.marketSubscription !== undefined) api.unsubscribe(globals.marketSubscription)
    
    // Subscribe MarketTick events
    //var lastId = 0
    globals.marketSubscription = globals.market
    api.subscribe(globals.market)
    
    fetchOrderBook()
  
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
    await updateHistory()
    await fetchOrderBook()
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
  
  globals.trades = []
  
  Object.keys(globals.accountSubscriptions).map(key => {
    //console.log("UNSUBSCRIBE " + globals.accountSubscriptions[key])
    return api.unsubscribe(globals.accountSubscriptions[key])
  })
  globals.accountSubscriptions = {}
  
  // Trigger past trade events
  var startBlock = globals.blockNumber - (43200 * 3) / BLOCKTIME
  if (startBlock < 0) startBlock = 0
  api.accountSync(startBlock, globals.blockNumber)
  
  fetchActive()

  store.dispatch({
    type: ACCOUNTSELECT,
    acct: globals.account
  })
  store.dispatch({
    type: ACCOUNT,
    acct: globals.account,
    balance: accountInfo.balance,
  })
}

async function fetchOrderBook() {
  if (globals.market === undefined || globals.dur === undefined) return
  
  const market = globals.market
  const dur = globals.dur
  
  const totalBacking = {}
  const totalWeight = {}
  const obData = await api.getMarketInfo(market)
  for (var i=0; i<globals.durs.length; i++) {
    totalBacking[globals.durs[i]] = obData.orderBooks[i].sumBacking
    totalWeight[globals.durs[i]] = obData.orderBooks[i].sumWeight
  }
  
  var colorizeCount = 0
  const colormap = {}
  
  const computePricing = async type => {
    const obj = {}
    obj.maxPrem = 0
    obj.maxCost = 0
    obj.cursorX = 0
    obj.cursorY = 0
    obj.quotes = []
    try {
      const consensusData = await api.getMarketSpot(market)
      const marketSpot = consensusData.consensus
      const orderBookInfo = await api.getOrderbookInfo(market, api.durationFromSeconds(dur))
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
          const data = await api.getLiveQuote(id)
          const quoteQty = data.quantity
          const quoteSpot = data.spot
          const quotePrem = data.premium
          if (type === CallAsk) {
            var prem = quotePrem - (marketSpot - quoteSpot) / 2
          } else {
            prem = quotePrem + (marketSpot - quoteSpot) / 2
          }
          if (prem < 0) prem = 0
          const q2 = q1 + quoteQty
          if (obj.maxPrem < prem) obj.maxPrem = prem
          if (colormap[id] === undefined) {
            colormap[id] = colorizeCount++
          }
          const tmp = {
            id: id,
            color: colormap[id],
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
      console.log("Error fetching order book: " + err)
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
  
  store.dispatch({
    type: ORDERBOOK,
    totalBacking: totalBacking,
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
      store.dispatch({
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
      store.dispatch({
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
}

async function fetchActive() {
  // Get current quotes
  //console.log("Fetching quotes for account " + globals.account)
  const quotes = []
  //const quoteInfo = await api.getAccountQuotes(globals.account)
  var accountInfo = await api.getAccountInfo(globals.account)
  const quoteInfo = accountInfo.activeQuotes
  for (var i=0; i<quoteInfo.length; i++) {
    const quoteId = quoteInfo[i]
    //console.log("Quote=" + quoteId)
    const data = await api.getLiveQuote(quoteId)
    quotes.push({
      id: quoteId,
      provider: data.provider,
      market: data.market,
      dur: data.duration,
      spot: data.spot,
      premium: data.premium,
      backing: data.backing,
      modified: new Date(data.modified),
      canModify: new Date(data.canModify),
      quantity: data.quantity,
      weight: data.quantity
    })
  }
  globals.quotes = quotes
  store.dispatch({
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
  return async dispatch => {
    dispatch({
      type: MOUSESTATE,
      mouseState: 0
    })
    const qty = parseFloat(globals.qty.toFixed(6))
    const market = globals.market
    const dur = api.durationFromSeconds(globals.dur)
    const notId = createBuyNotification(dispatch, BuyCall, market, dur, qty)
    try {
      await api.marketTrade(market, dur, "call", qty + "quantity")
      //console.log("Result=" + JSON.stringify(tx, null, 2))
      setTimeout(() => {
        removeNotification(dispatch, notId)
      }, DIALOG_TIME1)
      createSuccessNotification(dispatch, DIALOG_TIME2, notId)
      const accountInfo = await api.getAccountInfo(globals.account)
      dispatch({
        type: ACCOUNT,
        acct: globals.account, 
        balance: accountInfo.balance
      })
    } catch (err) {
      const msg = "" + err
      console.log("Buy call failed: " + msg)
      removeNotification(dispatch, notId)
      const accountInfo = await api.getAccountInfo(globals.account)
      if (accountInfo.balance === 0) {
        createErrorNotification(dispatch, "Buy call failed: check account balance")
      } else if (msg.includes("Insufficient funds")) {
        createErrorNotification(dispatch, "Buy call failed: insufficient funds")
      } else {
        createErrorNotification(dispatch, "Buy call failed: " + msg)
      }
    }
  }
}

export const buyPut = () => {
  return async dispatch => {
    dispatch({
      type: MOUSESTATE,
      mouseState: 0
    })
    const qty = parseFloat(globals.qty.toFixed(6))
    const market = globals.market
    const dur = api.durationFromSeconds(globals.dur)
    const notId = createBuyNotification(dispatch, BuyPut, market, dur, qty)
    try {
      await api.marketTrade(market, dur, "put", qty + "quantity")
      //console.log("Result=" + JSON.stringify(tx, null, 2))
      setTimeout(() => {
        removeNotification(dispatch, notId)
      }, DIALOG_TIME1)
      createSuccessNotification(dispatch, DIALOG_TIME2, notId)
      const accountInfo = await api.getAccountInfo(globals.account)
      dispatch({
        type: ACCOUNT,
        acct: globals.account, 
        balance: accountInfo.balance
      })
    } catch (err) {
      const msg = "" + err
      console.log("Buy put failed: " + msg)
      removeNotification(dispatch, notId)
      const accountInfo = await api.getAccountInfo(globals.account)
      if (accountInfo.balance === 0) {
        createErrorNotification(dispatch, "Buy put failed: check account balance")
      } else {
        createErrorNotification(dispatch, "Buy put failed: " + JSON.stringify(err))
      }
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
  globals.quote.newspot = (globals.spot * globals.weight + spot * weight) / (weight + globals.weight)
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
  if (qty > globals.orderbook.totalWeight[globals.dur]) qty = globals.orderbook.totalWeight[globals.dur]
  return async dispatch => {
    globals.orderbook.setBuyPremium(qty, true)
    orderBookCursorPos(qty, globals.orderbook.totalWeight[globals.dur], globals.spot, true, globals.orderbook.calls.price(qty))
  }
}

export const changeQtyPut = event => {
  var qty = parseFloat(event.target.value)
  if (qty < 0 || isNaN(qty)) qty = 0
  return async dispatch => {
    globals.orderbook.setBuyPremium(qty, false)
    orderBookCursorPos(qty, globals.orderbook.totalWeight[globals.dur], globals.spot, false, globals.orderbook.puts.price(qty))
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
    chartCursorPos(qty, globals.quote.spot, globals.quote.premium, globals.quote.newspot)
  }
}

export const changeSpot = event => {
  var spot = parseFloat(event.target.value)
  //var step = parseFloat(event.target.step)
  //spot = step * Math.floor(spot / step)
  if (spot < 0) spot = 0
  return async dispatch => {
    globals.quote.spot = spot
    dispatch({
      type: QUOTEPARAMS
    })
    newQuoteParams(dispatch)
    const qty = globals.quote.backing / 10 * globals.quote.premium
    chartCursorPos(qty, globals.quote.spot, globals.quote.premium, globals.quote.newspot)
  }
}

export const changePremium = event => {
  var premium = parseFloat(event.target.value)
  if (premium < 0) premium = 0
  return async dispatch => {
    globals.quote.premium = premium
    dispatch({
      type: QUOTEPARAMS
    })
    newQuoteParams(dispatch)
    const qty = globals.quote.backing / 10 * globals.quote.premium
    chartCursorPos(qty, globals.quote.spot, globals.quote.premium, globals.quote.newspot)
  }
}

export const placeQuote = () => {
  return async dispatch => {
    dispatch({
      type: MOUSESTATE,
      mouseState: 0
    })
    const market = globals.market
    const dur = api.durationFromSeconds(globals.dur)
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
      await api.createQuote(market, dur, backing + "fox", spot + "spot", premium + "premium")
      setTimeout(() => {
        removeNotification(dispatch, notId)
      }, DIALOG_TIME1)
      createSuccessNotification(dispatch, DIALOG_TIME2, notId)
      fetchActive()
      fetchOrderBook()
      const accountInfo = await api.getAccountInfo(globals.account)
      dispatch({
        type: ACCOUNT,
        acct: globals.account, 
        balance: accountInfo.balance,
      })
    } catch (err) {
      removeNotification(dispatch, notId)
      const accountInfo = await api.getAccountInfo(globals.account)
      if (accountInfo.balance === 0) {
        createErrorNotification(dispatch, "Place quote failed: check account balance")
      } else {
        createErrorNotification(dispatch, "Place quote failed: " + JSON.stringify(err))
      }
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
    fetchActive()
    fetchOrderBook()
    const accountInfo = await api.getAccountInfo(globals.account)
    dispatch({
      type: ACCOUNT,
      acct: globals.account, 
      balance: accountInfo.balance
    })
  } catch (err) {
    console.log(err.message)
    const msg = "" + err
    removeNotification(dispatch, notId)
    createErrorNotification(dispatch, "Cancellation failed", msg)
  }
}

export const backQuote = async (dispatch, id, amount) => {
  console.log("Backing quote: " + id + " amount=" + amount)
  const notId = createBackQuoteNotification(dispatch, id, amount)
  try {
    await api.depositQuote(id, amount + "fox")
    setTimeout(() => {
      removeNotification(dispatch, notId)
    }, DIALOG_TIME1)
    createSuccessNotification(dispatch, DIALOG_TIME2, notId)
    fetchActive()
    fetchOrderBook()
    const accountInfo = await api.getAccountInfo(globals.account)
    dispatch({
      type: ACCOUNT,
      acct: globals.account, 
      balance: accountInfo.balance,
    })
  } catch (err) {
    const msg = "" + err
    removeNotification(dispatch, notId)
    createErrorNotification(dispatch, "Deposit failed", msg)
  }
}

export const updateSpot = async (dispatch, id, newspot) => {
  console.log("Updating spot: " + id + " new spot=" + newspot)
  const notId = createUpdateSpotNotification(dispatch, id, newspot)
  try {
    await api.updateQuote(id, newspot + "spot", "0premium")
    setTimeout(() => {
      removeNotification(dispatch, notId)
    }, DIALOG_TIME1)
    createSuccessNotification(dispatch, DIALOG_TIME2, notId)
    fetchActive()
    fetchOrderBook()
  } catch (err) {
    const msg = "" + err
    removeNotification(dispatch, notId)
    createErrorNotification(dispatch, "Update spot failed", msg)
  }
}

export const updatePremium = async (dispatch, id, newpremium) => {
  console.log("Updating premium: " + id + " new premium=" + newpremium)
  const notId = createUpdatePremiumNotification(dispatch, id, newpremium)
  try {
    await api.updateQuote(id, "0spot", newpremium + "premium")
    setTimeout(() => {
      removeNotification(dispatch, notId)
    }, DIALOG_TIME1)
    createSuccessNotification(dispatch, DIALOG_TIME2, notId)
    fetchActive()
    fetchOrderBook()
  } catch (err) {
    const msg = "" + err
    removeNotification(dispatch, notId)
    createErrorNotification(dispatch, "Update premium failed", msg)
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

export const settleTrade = async (dispatch, id) => {
  console.log("Settling trade: " + id)
  const notId = createSettleNotification(dispatch, id)
  try {
    await api.settleTrade(id)
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
    await api.init()
    await init()
    var keys = await api.getWallet()
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
      console.log("Connecting account: " + keys.acct)
      await api.init(keys)
      await init()
      globals.account = keys.acct
      selectAccount()
    } catch (err) {
      dispatch({
        type: INVALIDPASSWORD
      })
    }
  }
}

export const requestTokens = () => {
  return async dispatch => {
    console.log("Request tokens")
    const notId = createFaucetRequestNotification(dispatch, globals.account)
    try {
      const res = await axios.get(process.env.MICROTICK_FAUCET + "/" + globals.account)
      console.log(JSON.stringify(res.data, null, 2))
      if (res.data !== "success") {
        if (res.data.startsWith("failure: ")) {
          const error = res.data.slice(9)
          if (error.startsWith("locked")) {
            removeNotification(dispatch, notId)
            createErrorNotification(dispatch, "Faucet request failed: " + error)
          }
          if (error.startsWith("limit")) {
            removeNotification(dispatch, notId)
            createFaucetLimitNotification(dispatch)
          }
        }
      } else {
        setTimeout(() => {
          removeNotification(dispatch, notId)
        }, DIALOG_TIME1)
        createSuccessNotification(dispatch, DIALOG_TIME2, notId)
      }
    } catch (err) {
      const msg = "" + err
      removeNotification(dispatch, notId)
      createErrorNotification(dispatch, "Faucet request failed", msg)
    }
  }
}
