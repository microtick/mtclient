import {createTradeNotification, 
        createPlaceQuoteNotification,
        createCancelQuoteNotification,
        createBackQuoteNotification,
        createUpdateSpotNotification,
        createUpdatePremiumNotification,
        createSettleNotification,
        createIBCNotification,
        createSuccessNotification,
        createErrorNotification,
        removeNotification} from '../notifications'
import { chartCursorPos, orderBookCursorPos } from '../../containers/trading/chart'
import store from '../../store'
import { init } from '../chain/tendermint'
import { SequentialTaskQueue } from 'sequential-task-queue'
import sjcl from 'sjcl'
import BN from 'bignumber.js'

import api from '../api'
import { SoftwareSigner, LedgerSigner } from 'mtapi'
import CosmosApp from 'ledger-cosmos-js'
import Transport from '@ledgerhq/hw-transport-webusb'

const BLOCKTIME = 5

const DEFAULTDUR = 3600
const DEFAULTCHARTSIZE = 7200

const DIALOG_TIME1 = 1500
const DIALOG_TIME2 = 1750

const SELECT_WALLET = 'app/wallet'
const PASSWORD = 'app/password'
const INVALIDPASSWORD = 'app/invalidpassword'
const RESETPASSWORD = 'app/resetpassword'
const RECOVERACCOUNT = 'app/recoveraccount'
const DONERECOVER = 'app/donerecover'
const MNEMONIC = 'app/mnemonic'
const WRITTENMNEMONIC = 'app/writtenmnemonic'
const MENU = 'app/menu'
const MARKETS = 'microtick/markets'
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
const MOUSEMOVE = 'microtick/mousemove'
const LOCK = 'microtick/lock'
const DONELOADING = 'microtick/loading'
const ENABLELEDGER = 'microtick/ledger'
const INTERACTLEDGER = 'dialog/interactledger'
const CLOSEDIALOG = 'dialog/close'
const SETOBTYPE = 'microtick/orderbooktype'
const IBCDEPOSIT = 'ibc/deposit'
const IBCWITHDRAW = 'ibc/withdraw'
const IBCSUBMIT = 'ibc/submit'

const globals = {
  accountSubscriptions: {},
  dur: DEFAULTDUR,
  markets: [],
  durs: [],
  spot: 0,
  chart: {
    size: DEFAULTCHARTSIZE
  },
  quote: {
    backing: 10,
    weight: 0
  },
  quotes: [],
  orderBookType: 0
}

// eslint-disable-next-line
const BuyCall = 0
// eslint-disable-next-line
const BuyPut = 1
// eslint-disable-next-line
const SellCall = 2
// eslint-disable-next-line
const SellPut = 3

// eslint-disable-next-line
const Call = 0
// eslint-disable-next-line
const Put = 1

const initialState = {
  loading: true,
  ledger: false,
  blocktime: BLOCKTIME,
  balance: 0,
  stake: 0,
  wallet: "none",
  password: {
    prompt: true,
    invalid: false
  },
  mnemonic: {
    prompt: false
  },
  recover: {
    prompt: false
  },
  markets: [],
  market: {
    selected: false,
    symbol: '',
    dur: globals.dur,
    durs: globals.durs,
    type: 0,
    qty: 0,
    premiums: [[0], [0]],
    spot: 0
  },
  chart: {
    mouseState: 0,
    mouseMove: -1,
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
    backing: 10,
    weight: 0,
    list: []
  }
}

api.addTickHandler(async (market, data) => {
  if (market === globals.market) {
    globals.spot = data.consensus
    const info = await api.getMarketInfo(market)
    globals.weight = info.totalWeight
    globals.sumqty = info.totalWeight
    globals.backing = info.totalBacking
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
  if (globals.trades !== undefined) {
    for (var i=0; i<globals.trades.length; i++) {
      const trade = globals.trades[i]
      if (trade.market === market) {
        trade.spot = data.consensus
        trade.current = (trade.type === 0) ? 
          (trade.spot > trade.strike ? (trade.spot - trade.strike) * trade.qty : 0) :
          (trade.spot < trade.strike ? (trade.strike - trade.spot) * trade.qty : 0)
        if (trade.current > trade.backing) trade.current = trade.backing
        trade.profit = trade.dir === 'long' ? trade.current - trade.cost : trade.cost - trade.current
      }
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
      globals.accountInfo = await api.getAccountInfo(globals.account)
      store.dispatch({
        type: ACCOUNT,
        reason: key === "deposit" ? "receive" : "send",
        acct: globals.account, 
        balance: globals.accountInfo.balances.backing,
        stake: globals.accountInfo.balances.stake
      })
    }
    if (key === "trade.start") {
      await processTradeStart(data)
      store.dispatch({
        type: TRADELIST
      })
      const dir = key.slice(6)
      if (dir === "short") {
        await fetchActiveQuotes()
      }
    }
    if (key === "trade.end") {
      await processTradeEnd(data)
      store.dispatch({
        type: TRADELIST
      })
    }
  })
})
    

function calcMinMax(obj) {
  var mint = obj.chart.ticks.mint
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
    if ((tr.market === globals.market) && (tr.endBlock === undefined || Date.parse(tr.end) >= mint)) {
      if (tr.type === BuyCall) {
        const min = tr.strike
        if (minp > min) minp = min
        const max = tr.strike + tr.premium
        if (maxp < max) maxp = max
      }
      if (tr.type === BuyPut) {
        const min = tr.strike - tr.premium
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
  const start = new Date(trade.start)
  const end = new Date(trade.expiration)
  var active = true
  if (!globals.accountInfo.activeTrades.includes(trade.id)) {
    active = false
  }
  if (Date.parse(end) > Date.now()) {
    active = true
  }
  const spot = await api.getMarketSpot(trade.market)
  var dir, type
  if (globals.account === trade.taker) {
    // Display trade as single entry
    const data = trade.legs.reduce((acc, leg) => {
      var current = (leg.type === "call") ? 
        (spot.consensus > trade.strike ? (spot.consensus - trade.strike) * leg.quantity : 0) : 
        (spot.consensus < trade.strike ? (trade.strike - spot.consensus) * leg.quantity : 0) 
      if (current > trade.backing) current = trade.backing
      const profit = globals.account === leg.long ? current - leg.cost : leg.cost - current
      acc.backing += leg.backing
      acc.qty += leg.quantity
      acc.cost += leg.cost
      acc.current += current
      acc.profit += profit
      return acc
    }, {
      backing: 0,
      qty: 0,
      cost: 0,
      current: 0,
      profit: 0
    })
    if (trade.order === "buy-call") {
      dir = "long"
      type = Call
    }
    if (trade.order === "sell-call") {
      dir = "short"
      type = Call
    }
    if (trade.order === "buy-put") {
      dir = "long"
      type = Put
    }
    if (trade.order === "sell-put") {
      dir = "short"
      type = Put
    }
    const tradeData = {
      id: trade.id,
      taker: true,
      dir: dir,
      type: type,
      order: trade.order,
      active: active,
      market: trade.market,
      dur: trade.duration,
      spot: spot.consensus,
      startBlock: trade.height,
      start: start,
      end: end,
      strike: trade.strike,
      backing: data.backing,
      qty: data.qty,
      premium: data.cost / data.qty,
      cost: data.cost,
      current: data.current,
      profit: data.profit,
      final: trade.strike
    }
    globals.trades.push(tradeData)
  } else {
    // Display individual trade legs
    trade.legs.map(async leg => {
      if (globals.account === leg.long || globals.account === leg.short) {
        var current = (leg.type === "call") ? 
          (spot.consensus > trade.strike ? (spot.consensus - trade.strike) * leg.quantity : 0) : 
          (spot.consensus < trade.strike ? (trade.strike - spot.consensus) * leg.quantity : 0) 
        if (current > trade.backing) current = trade.backing
        const profit = globals.account === leg.long ? current - leg.cost : leg.cost - current
        const tradeData = {
          id: trade.id + "." + leg.leg_id,
          taker: false,
          dir: globals.account === leg.long ? "long" : "short",
          type: leg.type === "call" ? Call : Put,
          active: active,
          market: trade.market,
          dur: trade.duration,
          spot: spot.consensus,
          startBlock: trade.height,
          start: start,
          end: end,
          strike: trade.strike,
          backing: leg.backing,
          qty: leg.quantity,
          premium: leg.premium,
          cost: leg.cost,
          current: current,
          profit: profit,
          final: trade.strike
        }
        globals.trades.push(tradeData)
      }
    })
  }
  globals.accountSubscriptions[trade.id] = trade.market
  await api.subscribe(trade.market)
}

async function processTradeEnd(trade) {
  //console.log("processTradeEnd: " + trade.id)
  globals.trades = globals.trades.filter(async tr => {
    if (tr.id === trade.id) {
      tr.active = false
      //tr.end = ev.timestamp
      tr.endBlock = trade.height
      const final = trade.final
      if ((tr.type === Call && final > tr.strike) || (tr.type === Put && final < tr.strike)) {
        tr.final = final
      }
      globals.accountInfo = await api.getAccountInfo(globals.account)
      store.dispatch({
        type: ACCOUNT,
        reason: "trade",
        acct: globals.account, 
        balance: globals.accountInfo.balances.backing,
        stake: globals.accountInfo.balances.stake
      })
      await api.unsubscribe(globals.accountSubscriptions[trade.id])
      delete globals.accountSubscriptions[trade.id]
    }
    return true
  })
}

export default (state = initialState, action) => {
  //console.log("action=" + action.type)
  //console.log("state=" + JSON.stringify(state,null,2))
  switch (action.type) {
    case SELECT_WALLET:
      return {
        ...state,
        wallet: action.wallet
      }
    case RESETPASSWORD:
      return {
        ...state,
        password: {
          prompt: true,
          invalid: false
        }
      }
    case RECOVERACCOUNT:
      return {
        ...state,
        password: {
          prompt: false
        },
        recover: {
          prompt: true,
          done: action.done
        }
      }
    case DONERECOVER:
      return {
        ...state,
        recover: {
          prompt: false
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
    case MNEMONIC:
      return {
        ...state,
        mnemonic: {
          prompt: true,
          words: action.words,
          done: action.done
        }
      }
    case WRITTENMNEMONIC:
      return {
        ...state,
        mnemonic: {
          prompt: false
        }
      }
    case MARKETS:
      return {
        ...state,
        markets: globals.markets
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
        market: {
          ...state.market,
          durs: action.durs
        },
        orderbook: {
          ...action
        }
      })
    case SETOBTYPE:
      return {
        ...state,
        market: {
          ...state.market,
          type: action.selected
        }
      }
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
        },
        quote: {
          ...state.quote,
          weight: action.weight
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
            mint: action.mint,
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
            ...state.chart.ticks,
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
        stake: action.stake
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
      const qty = globals.quote.backing / (10 * globals.quote.premium)
      return {
        ...state,
        quote: {
          ...state.quote,
          spot: globals.quote.spot,
          premium: globals.quote.premium,
          backing: globals.quote.backing,
          weight: qty
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
    case MOUSEMOVE:
      return {
        ...state,
        chart: {
          ...state.chart,
          mouseMove: action.mouseMove
        }
      }
    case LOCK:
      return {
        ...state,
        chart: {
          ...state.chart,
          lock: action.lock
        }
      }
    case ENABLELEDGER:
      return {
        ...state,
        ledger: true
      }
    default:
      return state
  }
}

async function updateHistory() {
  store.dispatch({
    type: LOADHIST
  })
  const now = Date.now()
  // Get historic data
  const currentBlock = await api.getBlockInfo()
  var startBlock = currentBlock.height - globals.chart.size / BLOCKTIME
  if (startBlock < 0) startBlock = 0
  var min = Number.MAX_VALUE, max = 0
  const currentSpot = await api.getMarketSpot(globals.market)
  const rawHistory = await api.marketHistory(globals.market, startBlock, currentBlock.height, 100)
  const startTime = now - globals.chart.size * 1000
  const filteredHistory = rawHistory.filter(hist => {
    return hist.time > startTime && hist.time < now
  }).map(hist => {
    const value = hist.consensus
    if (min > value) min = value
    if (max < value) max = value
    return {
      block: hist.height,
      time: hist.time,
      value: value
    }
  })
  if (filteredHistory.length === 0) {
    min = globals.spot
    max = globals.spot
  }
  filteredHistory.push({
    block: currentBlock.height,
    time: now,
    value: currentSpot.consensus
  })
  // Insert trade points for display purposes
  if (globals.trades !== undefined && globals.trades.length > 0) {
    var i = 0
    var history = filteredHistory.reduce((acc, hist) => {
      while (i < globals.trades.length && globals.trades[i].startBlock < hist.height) {
        if (globals.trades[i].market === globals.market && globals.trades[i].startBlock >= startBlock) {
          acc.push({
            block: globals.trades[i].startBlock,
            time: globals.trades[i].start.getTime(),
            value: globals.trades[i].strike
          })
        }
        i++
      }
      acc.push(hist)
      return acc
    }, [])
  } else {
    history = filteredHistory
  }
  var height = max - min
  const minp = min - height * .05
  const maxp = max + height * .05
  //console.log("minp=" + minp)
  //console.log("maxp=" + maxp)
  store.dispatch({
    type: HISTORY,
    data: history,
    mint: startTime,
    minb: startBlock,
    maxb: currentBlock.height,
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
    globals.weight = info.totalWeight
    globals.sumqty = info.totalWeight
    globals.backing = info.totalBacking
    
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
    case 600:
      globals.chart.size = 1200
      break
    case 900:
      globals.chart.size = 1800
      break
    case 1800:
      globals.chart.size = 3600
      break
    case 3600:
      globals.chart.size = 7200
      break
    case 7200:
      globals.chart.size = 14400
      break
    case 14400:
      globals.chart.size = 28800
      break
    case 28800:
      globals.chart.size = 43200
      break
    case 43200:
      globals.chart.size = 86400
      break
    case 86400:
      globals.chart.size = 172800
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
  globals.markets = await api.getMarkets()
  store.dispatch({
    type: MARKETS
  })
  
  const block = await api.getBlockInfo()
  globals.blockNumber = block.height
  globals.accountInfo = await api.getAccountInfo(globals.account)
  
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
  
  fetchActiveQuotes()

  store.dispatch({
    type: ACCOUNTSELECT,
    acct: globals.account
  })
  store.dispatch({
    type: ACCOUNT,
    reason: "accountselect",
    acct: globals.account,
    balance: globals.accountInfo.balances.backing,
    stake: globals.accountInfo.balances.stake
  })
  
  if (globals.markets.length > 0) {
    const cb = selectMarket(globals.markets[0].name)
    cb(store.dispatch)
  }
}

async function fetchOrderBook() {
  if (globals.market === undefined || globals.dur === undefined) return
  
  const market = globals.market
  const dur = globals.dur
  
  const totalBacking = {}
  const totalWeight = {}
  const durs = []
  const obData = await api.getMarketInfo(market)
  for (var i=0; i<obData.orderBooks.length; i++) {
    const seconds = api.secondsFromDuration(obData.orderBooks[i].name)
    totalBacking[seconds] = obData.orderBooks[i].sumBacking
    totalWeight[seconds] = obData.orderBooks[i].sumWeight
    durs.push(seconds)
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
      const orderBookInfo = await api.getOrderbookInfo(market, api.durationFromSeconds(dur))
      var q1 = 0.0 // quantity
      var c = 0.0 // cost
      if (globals.orderBookType === 0) {
        if (type === Call) {
          var quotes = orderBookInfo.callAsks
        } else {
          quotes = orderBookInfo.putAsks
        }
      } else {
        if (type === Call) {
          quotes = orderBookInfo.callBids
        } else {
          quotes = orderBookInfo.putBids
        }
      }
      for (var i=0; i<quotes.length; i++) {
        const quote = quotes[i]
        const id = quote.id
        const q2 = q1 + quote.quantity
        if (obj.maxPrem < quote.premium) obj.maxPrem = quote.premium
        if (colormap[id] === undefined) {
          colormap[id] = colorizeCount++
        }
        const tmp = {
          id: id,
          color: colormap[id],
          premium: quote.premium,
          qty: quote.quantity,
          c: c,
          q1: q1,
          q2: q2
        }
        q1 = q2
        c = c + quote.premium * quote.quantity
        if (obj.maxCost < c) obj.maxCost = c
        obj.quotes.push(tmp)
      }
    } catch (err) {
      console.log("Error fetching order book: " + err)
      console.log(err)
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
  
  const calls = await computePricing(Call)
  const puts = await computePricing(Put)
  
  const dispatch = {
    type: ORDERBOOK,
    durs: durs,
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
  }
  
  store.dispatch(dispatch)
  
  // Dynamically update cursor which is not managed by react for speed
  if (globals.mouseState === 2 || globals.mouseState === 3) { // MOUSESTATE_CALL || MOUSESTATE_PUT
    orderBookCursorPos(globals.qty, globals.orderbook.totalWeight[globals.dur], globals.spot, 
      globals.mouseState === 2, 
      globals.mouseState === 2 ? calls.price(globals.qty) : puts.price(globals.qty))
  }
}

async function fetchActiveQuotes() {
  // Get current quotes
  //console.log("Fetching quotes for account " + globals.account)
  const quotes = []
  //const quoteInfo = await api.getAccountQuotes(globals.account)
  globals.accountInfo = await api.getAccountInfo(globals.account)
  const quoteInfo = globals.accountInfo.activeQuotes
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
      premium: data.ask,
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

export const tradeCall = dir => {
  return async dispatch => {
    dispatch({
      type: MOUSESTATE,
      mouseState: 0
    })
    const qty = parseFloat(globals.qty.toFixed(6))
    const market = globals.market
    const dur = api.durationFromSeconds(globals.dur)
    const notId = createTradeNotification(dispatch, dir ? BuyCall : SellCall, market, dur, qty)
    try {
      dispatch({
        type: INTERACTLEDGER,
        value: true
      })
      await api.marketTrade(market, dur, dir ? "buy-call" : "sell-call", qty + "quantity")
      dispatch({
        type: INTERACTLEDGER,
        value: false
      })
      //console.log("Result=" + JSON.stringify(tx, null, 2))
      setTimeout(() => {
        removeNotification(dispatch, notId)
      }, DIALOG_TIME1)
      createSuccessNotification(dispatch, DIALOG_TIME2, notId)
      globals.accountInfo = await api.getAccountInfo(globals.account)
      dispatch({
        type: ACCOUNT,
        reason: "trade",
        acct: globals.account, 
        balance: globals.accountInfo.balances.backing,
        stake: globals.accountInfo.balances.stake
      })
    } catch (err) {
      dispatch({
        type: INTERACTLEDGER,
        value: false
      })
      removeNotification(dispatch, notId)
      if (err !== undefined) createErrorNotification(dispatch, err.message)
    }
  }
}

export const tradePut = dir => {
  return async dispatch => {
    dispatch({
      type: MOUSESTATE,
      mouseState: 0
    })
    const qty = parseFloat(globals.qty.toFixed(6))
    const market = globals.market
    const dur = api.durationFromSeconds(globals.dur)
    const notId = createTradeNotification(dispatch, dir ? BuyPut : SellPut, market, dur, qty)
    try {
      dispatch({
        type: INTERACTLEDGER,
        value: true
      })
      await api.marketTrade(market, dur, dir ? "buy-put" : "sell-put", qty + "quantity")
      dispatch({
        type: INTERACTLEDGER,
        value: false
      })
      //console.log("Result=" + JSON.stringify(tx, null, 2))
      setTimeout(() => {
        removeNotification(dispatch, notId)
      }, DIALOG_TIME1)
      createSuccessNotification(dispatch, DIALOG_TIME2, notId)
      globals.accountInfo = await api.getAccountInfo(globals.account)
      dispatch({
        type: ACCOUNT,
        reason: "trade",
        acct: globals.account, 
        balance: globals.accountInfo.balances.backing,
        stake: globals.accountInfo.balances.stake
      })
    } catch (err) {
      dispatch({
        type: INTERACTLEDGER,
        value: false
      })
      removeNotification(dispatch, notId)
      console.log(err)
      createErrorNotification(dispatch, err.message)
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
  if (globals.orderBookType === 0) {
    var call = prem + (spot - globals.quote.newspot) / 2
    var put = prem - (spot - globals.quote.newspot) / 2
  } else {
    call = (spot - globals.quote.newspot) / 2
    put = (globals.quote.newspot - spot) / 2
  }
  if (call < 0) call = 0
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
  if (qty > globals.orderbook.totalWeight[globals.dur]) qty = globals.orderbook.totalWeight[globals.dur]
  return async dispatch => {
    globals.orderbook.setBuyPremium(qty, false)
    orderBookCursorPos(qty, globals.orderbook.totalWeight[globals.dur], globals.spot, false, globals.orderbook.puts.price(qty))
  }
}

export const changeBacking = event => {
  var backing = parseFloat(event.target.value)
  if (backing < 0) backing = 0
  return async dispatch => {
    globals.quote.backing = backing
    dispatch({
      type: QUOTEPARAMS
    })
    newQuoteParams(dispatch)
    const qty = globals.quote.backing / (10 * globals.quote.premium)
    chartCursorPos(backing, qty, globals.quote.spot, globals.quote.premium, globals.quote.newspot)
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
    const qty = globals.quote.backing / (10 * globals.quote.premium)
    chartCursorPos(globals.quote.backing, qty, globals.quote.spot, globals.quote.premium, globals.quote.newspot)
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
    const qty = globals.quote.backing / (10 * globals.quote.premium)
    chartCursorPos(globals.quote.backing, qty, globals.quote.spot, globals.quote.premium, globals.quote.newspot)
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
      dispatch({
        type: INTERACTLEDGER,
        value: true
      })
      await api.createQuote(market, dur, backing + "dai", spot + "spot", premium + "premium")
      dispatch({
        type: INTERACTLEDGER,
        value: false
      })
      setTimeout(() => {
        removeNotification(dispatch, notId)
      }, DIALOG_TIME1)
      createSuccessNotification(dispatch, DIALOG_TIME2, notId)
      fetchActiveQuotes()
      fetchOrderBook()
      globals.accountInfo = await api.getAccountInfo(globals.account)
      dispatch({
        type: ACCOUNT,
        reason: "quote",
        acct: globals.account, 
        balance: globals.accountInfo.balances.backing,
        stake: globals.accountInfo.balances.stake
      })
    } catch (err) {
      dispatch({
        type: INTERACTLEDGER,
        value: false
      })
      removeNotification(dispatch, notId)
      console.log(err)
      createErrorNotification(dispatch, err.message)
    }
  }
}

export const cancelQuote = async (dispatch, id) => {
  console.log("Canceling quote: " + id)
  const notId = createCancelQuoteNotification(dispatch, id)
  try {
    dispatch({
      type: INTERACTLEDGER,
      value: true
    })
    await api.cancelQuote(id)
    dispatch({
      type: INTERACTLEDGER,
      value: false
    })
    setTimeout(() => {
      removeNotification(dispatch, notId)
    }, DIALOG_TIME1)
    createSuccessNotification(dispatch, DIALOG_TIME2, notId)
    fetchActiveQuotes()
    fetchOrderBook()
    globals.accountInfo = await api.getAccountInfo(globals.account)
    dispatch({
      type: ACCOUNT,
      reason: "quote",
      acct: globals.account, 
      balance: globals.accountInfo.balances.backing,
      stake: globals.accountInfo.balances.stake
    })
  } catch (err) {
    dispatch({
      type: INTERACTLEDGER,
      value: false
    })
    removeNotification(dispatch, notId)
    console.log(err)
    createErrorNotification(dispatch, err.message)
  }
}

export const backQuote = async (dispatch, id, amount) => {
  console.log("Backing quote: " + id + " amount=" + amount)
  const notId = createBackQuoteNotification(dispatch, id, amount)
  try {
    dispatch({
      type: INTERACTLEDGER,
      value: true
    })
    await api.depositQuote(id, amount + "dai")
    dispatch({
      type: INTERACTLEDGER,
      value: false
    })
    setTimeout(() => {
      removeNotification(dispatch, notId)
    }, DIALOG_TIME1)
    createSuccessNotification(dispatch, DIALOG_TIME2, notId)
    fetchActiveQuotes()
    fetchOrderBook()
    globals.accountInfo = await api.getAccountInfo(globals.account)
    dispatch({
      type: ACCOUNT,
      reason: "quote",
      acct: globals.account, 
      balance: globals.accountInfo.balances.backing,
      stake: globals.accountInfo.balances.stake
    })
  } catch (err) {
    dispatch({
      type: INTERACTLEDGER,
      value: false
    })
    removeNotification(dispatch, notId)
    console.log(err)
    createErrorNotification(dispatch, err.message)
  }
}

export const updateSpot = async (dispatch, id, newspot) => {
  console.log("Updating spot: " + id + " new spot=" + newspot)
  const notId = createUpdateSpotNotification(dispatch, id, newspot)
  try {
    dispatch({
      type: INTERACTLEDGER,
      value: true
    })
    await api.updateQuote(id, newspot + "spot", "0premium")
    dispatch({
      type: INTERACTLEDGER,
      value: false
    })
    setTimeout(() => {
      removeNotification(dispatch, notId)
    }, DIALOG_TIME1)
    createSuccessNotification(dispatch, DIALOG_TIME2, notId)
    fetchActiveQuotes()
    fetchOrderBook()
    globals.accountInfo = await api.getAccountInfo(globals.account)
    dispatch({
      type: ACCOUNT,
      reason: "quote",
      acct: globals.account, 
      balance: globals.accountInfo.balances.backing,
      stake: globals.accountInfo.balances.stake
    })
  } catch (err) {
    dispatch({
      type: INTERACTLEDGER,
      value: false
    })
    removeNotification(dispatch, notId)
    console.log(err)
    createErrorNotification(dispatch, err.message)
  }
}

export const updatePremium = async (dispatch, id, newpremium) => {
  console.log("Updating premium: " + id + " new premium=" + newpremium)
  const notId = createUpdatePremiumNotification(dispatch, id, newpremium)
  try {
    dispatch({
      type: INTERACTLEDGER,
      value: true
    })
    await api.updateQuote(id, "0spot", newpremium + "premium")
    dispatch({
      type: INTERACTLEDGER,
      value: false
    })
    setTimeout(() => {
      removeNotification(dispatch, notId)
    }, DIALOG_TIME1)
    createSuccessNotification(dispatch, DIALOG_TIME2, notId)
    fetchActiveQuotes()
    fetchOrderBook()
    globals.accountInfo = await api.getAccountInfo(globals.account)
    dispatch({
      type: ACCOUNT,
      reason: "quote",
      acct: globals.account, 
      balance: globals.accountInfo.balances.backing,
      stake: globals.accountInfo.balances.stake
    })
  } catch (err) {
    dispatch({
      type: INTERACTLEDGER,
      value: false
    })
    removeNotification(dispatch, notId)
    console.log(err)
    createErrorNotification(dispatch, err.message)
  }
}

export const mouseState = mouseState => {
  globals.mouseState = mouseState
  return async dispatch => {
    dispatch({
      type: MOUSESTATE,
      mouseState: mouseState
    })
  }
}

export const mouseMoveTrigger = mouseMove => {
  store.dispatch({
    type: MOUSEMOVE,
    mouseMove: mouseMove
  })
}

export const setLock = lock => {
  store.dispatch({
    type: LOCK,
    lock: lock
  })
}

export const setOrderBookType = t => {
  globals.orderBookType = t
  store.dispatch({
    type: SETOBTYPE,
    selected: t
  })
  fetchOrderBook()
}

export const settleTrade = async (dispatch, id) => {
  console.log("Settling trade: " + id)
  const notId = createSettleNotification(dispatch, id)
  try {
    dispatch({
      type: INTERACTLEDGER,
      value: true
    })
    await api.settleTrade(id)
    dispatch({
      type: INTERACTLEDGER,
      value: false
    })
    setTimeout(() => {
      removeNotification(dispatch, notId)
    }, DIALOG_TIME1)
    createSuccessNotification(dispatch, DIALOG_TIME2, notId)
  } catch (err) {
    dispatch({
      type: INTERACTLEDGER,
      value: false
    })
    removeNotification(dispatch, notId)
    console.log(err)
    createErrorNotification(dispatch, err.message)
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

export const recoverAccount = () => {
  return async dispatch => {
    dispatch({
      type: RECOVERACCOUNT,
      done: async () => {
        const words = []
        for (var i=0; i<24; i++) {
          words.push(document.getElementById("word"+i).value)
        }
        const password = document.getElementById('password').value
        dispatch({
          type: DONERECOVER
        })
        try {
          globals.signer = new SoftwareSigner()
          api.setSigner(globals.signer)
          await globals.signer.initFromMnemonic(words.join(" "), "micro", 0, 0)
          await api.init()
          await init()
          var priv = btoa(sjcl.encrypt(password, globals.signer.priv.toString('hex')))
          document.cookie = "mtm.account=" + JSON.stringify(priv) + ";max-age=31536000;"
          console.log("Creating account on server: " + globals.signer.getAddress())
          globals.account = globals.signer.getAddress()
          selectAccount()
        } catch (err) {
          console.log(err.message)
          dispatch({
            type: SELECT_WALLET,
            value: "none"
          })
        }
      }
    })
  }
}

export const selectWallet = hw => {
  return async dispatch => {
    if (hw) {
      try {
        dispatch({
          type: ENABLELEDGER
        })
        dispatch({
          type: INTERACTLEDGER,
          value: true
        })
        const usb = await Transport.create()
        const cosmos = new CosmosApp(usb)
        globals.signer = new LedgerSigner(cosmos)
        await globals.signer.init("micro", 0, 0)
        api.setSigner(globals.signer)
        await api.init()
        dispatch({
          type: INTERACTLEDGER,
          value: false
        })
        dispatch({
          type: CLOSEDIALOG
        })
        await init()
        console.log("Ledger account=" + globals.signer.getAddress())
        dispatch({
          type: SELECT_WALLET,
          value: "ledger"
        })
        dispatch({
          type: PASSWORD
        })
        globals.account = globals.signer.getAddress()
        selectAccount()
      } catch (err) {
        console.log(err.message)
        console.log(err)
      }
    } else {
      dispatch({
        type: SELECT_WALLET,
        value: "software"
      })
    }
  }
}

export const choosePassword = () => {
  return async dispatch => {
    dispatch({
      type: PASSWORD
    })
    const password = document.getElementById('password').value
    globals.signer = new SoftwareSigner()
    api.setSigner(globals.signer)
    const mnemonic = await globals.signer.generateNewMnemonic()
    dispatch({
      type: MNEMONIC,
      words: mnemonic.split(' '),
      done: () => {
        dispatch({
          type: WRITTENMNEMONIC
        })
      }
    })
    await globals.signer.initFromMnemonic(mnemonic, "micro", 0, 0)
    await api.init()
    await init()
    var priv = btoa(sjcl.encrypt(password, globals.signer.priv.toString('hex')))
    document.cookie = "mtm.account=" + JSON.stringify(priv) + ";max-age=31536000;"
    console.log("Creating account on server: " + globals.signer.getAddress())
    globals.account = globals.signer.getAddress()
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
    const priv = JSON.parse(checkAccount[0])
    try {
      globals.signer = new SoftwareSigner()
      api.setSigner(globals.signer)
      const buf = sjcl.decrypt(password, atob(priv))
      await globals.signer.initFromPrivateKey("micro", Buffer.from(buf, 'hex'))
      console.log("Connecting account: " + globals.signer.getAddress())
      await api.init()
      await init()
      globals.account = globals.signer.getAddress()
      selectAccount()
    } catch (err) {
      dispatch({
        type: INVALIDPASSWORD
      })
    }
  }
}

export const IBCDeposit = () => {
  return async dispatch => {
    const close = () => {
      dispatch({
        type: CLOSEDIALOG
      })
    }
    const submitted = hash => {
      dispatch({
        type: IBCSUBMIT,
        params: {
          hash: hash
        }
      })
    }
    const endpoints = await api.getIBCEndpoints(globals.signer.getPubKey())
    //console.log(JSON.stringify(endpoints, null, 2))
    let defaultParams = {
      transferAmount: 0
    }
    let params = defaultParams
    const update = () => {
      for (var i=0; i<endpoints.length; i++) {
        const ep = endpoints[i]
        if (ep.name === params.chain) {
          params.chainid = ep.chainid
          params.blocktime = ep.blocktime
          params.wallet = ep.address
          if (params.backing) {
            params.tokenlabel = "atom"
            params.tokentype = ep.backingHere
            params.txdenom = ep.backingThere
            params.channel = ep.incoming
            params.balance = ep.backingBalance
            params.mult = ep.backingRatio
          }
          if (params.tick) {
            params.tokenlabel = "tick"
            params.tokentype = ep.tickThere
            params.txdenom = ep.tickThere
            params.channel = ep.outgoing
            params.balance = ep.tickBalance
            params.mult = 1000000
          }
          params.account = ep.account
          params.sequence = ep.sequence
        }
      }
      dispatch({
        type: IBCDEPOSIT,
        params: params,
        handlers: {
          selectTransferAsset: value => {
            params = defaultParams
            if (value) {
              // backing
              params.backing = true
              params.tick = false
              params.chains = endpoints.reduce((acc, ep) => {
                if (ep.incoming !== undefined) {
                  acc.push({
                    value: ep.name,
                    label: ep.name
                  })
                }
                return acc
              }, [])
            } else {
              // tick
              params.backing = false
              params.tick = true
              params.chains = endpoints.reduce((acc, ep) => {
                if (ep.outgoing !== undefined) {
                  acc.push({
                    value: ep.name,
                    label: ep.name
                  })
                }
                return acc
              }, [])
            }
            delete params.chain
            update()
          },
          selectChain: selection => {
            if (selection === null) {
              params = defaultParams
            } else {
              params.chain = selection.value
            }
            update()
          },
          updateTransferAmount: e => {
            const value = parseFloat(e.target.value)
            if (value > params.balance) {
              params.transferAmount = params.balance.toString()
            } else {
              params.transferAmount = value.toString()
            }
            if (Number.isNaN(params.transferAmount)) {
              params.transferAmount = "0"
            }
            update()
          }
        },
        submit: async () => {
          /*
          console.log("Submit IBC Deposit:")
          console.log("Channel: " + params.channel)
          console.log("Sender: " + params.wallet)
          console.log("Receiver: " + globals.account)
          console.log("Amount: " + params.transferAmount)
          console.log("Denom: " + params.tokentype)
          console.log("Auth:")
          console.log("  Chain ID: " + params.chainid)
          console.log("  Account: " + params.account)
          console.log("  Sequence: " + params.sequence)
          */
          close()
          const notId = createIBCNotification(dispatch)
          try {
            dispatch({
              type: INTERACTLEDGER,
              value: true
            })
            // submit an IBC request, supplying the auth for the external chain
            const amt = new BN(params.transferAmount).multipliedBy(params.mult).toFixed(0)
            const res = await api.IBCDeposit(params.channel, globals.blockNumber + 25, params.blocktime + 3600000, params.wallet, globals.account, 
              amt, params.txdenom, {
                chainid: params.chainid,
                account: params.account,
                sequence: params.sequence
              })
            removeNotification(dispatch, notId)
            submitted(res.hash)
          } catch (err) {
            dispatch({
              type: INTERACTLEDGER,
              value: false
            })
            removeNotification(dispatch, notId)
            if (err !== undefined) createErrorNotification(dispatch, err.message)
          }
        },
      })
    }
    update()
  }
}

export const IBCWithdraw = () => {
  return async dispatch => {
    const close = () => {
      dispatch({
        type: CLOSEDIALOG
      })
    }
    const submitted = hash => {
      dispatch({
        type: IBCSUBMIT,
        params: {
          hash: hash
        }
      })
    }
    const acctInfo = await api.getAccountInfo()
    const endpoints = await api.getIBCEndpoints(globals.signer.getPubKey())
    //console.log(JSON.stringify(endpoints, null, 2))
    let defaultParams = {
      transferAmount: 0,
    }
    let params = defaultParams
    const update = () => {
      for (var i=0; i<endpoints.length; i++) {
        const ep = endpoints[i]
        if (ep.name === params.chain) {
          params.chainid = ep.chainid
          params.blocktime = ep.blocktime
          params.blockheight = ep.blockheight
          if (params.backing) {
            params.tokenlabel = "atom"
            params.tokentype = ep.backingHere
            params.channel = ep.incoming
          }
          if (params.tick) {
            params.tokenlabel = "tick"
            params.tokentype = "stake"
            params.channel = ep.outgoing
          }
          params.account = ep.account
          params.sequence = ep.sequence
        }
      }
      dispatch({
        type: IBCWITHDRAW,
        params: params,
        handlers: {
          selectTransferAsset: value => {
            params = defaultParams
            if (value) {
              // backing
              params.backing = true
              params.tick = false
              params.balance = acctInfo.balances.backing
              params.chains = endpoints.reduce((acc, ep) => {
                if (ep.incoming !== undefined) {
                  acc.push({
                    value: ep.name,
                    label: ep.name
                  })
                }
                return acc
              }, [])
            } else {
              // tick
              params.backing = false
              params.tick = true
              params.balance = acctInfo.balances.stake
              params.chains = endpoints.reduce((acc, ep) => {
                if (ep.outgoing !== undefined) {
                  acc.push({
                    value: ep.name,
                    label: ep.name
                  })
                }
                return acc
              }, [])
            }
            delete params.chain
            update()
          },
          selectChain: selection => {
            if (selection === null) {
              params = defaultParams
            } else {
              params.chain = selection.value
              for (var i=0; i<endpoints.length; i++) {
                const ep = endpoints[i]
                if (ep.name === selection.value) {
                  params.wallet = ep.address
                  params.tickThere = ep.tickThere
                }
              }
            }
            update()
          },
          updateTransferAmount: e => {
            const value = parseFloat(e.target.value)
            if (value > params.balance) {
              params.transferAmount = params.balance.toString()
            } else {
              params.transferAmount = value.toString()
            }
            if (Number.isNaN(params.transferAmount)) {
              params.transferAmount = "0"
            }
            update()
          }
        },
        submit: async () => {
          const amt = new BN(params.transferAmount).multipliedBy(1000000).toFixed(0)
          console.log("Submit IBC Withdrawal:")
          console.log("Channel: " + params.channel)
          console.log("Sender: " + globals.account)
          console.log("Receiver: " + params.wallet)
          console.log("Amount: " + amt)
          console.log("Denom: " + params.tokentype)
          close()
          const notId = createIBCNotification(dispatch)
          try {
            dispatch({
              type: INTERACTLEDGER,
              value: true
            })
            // submit an IBC request from this chain
            const res = await api.IBCWithdrawal(params.channel, params.blockheight + 25, params.blocktime + 3600000, globals.account, params.wallet,
              amt, params.tokentype)
            removeNotification(dispatch, notId)
            submitted(res.hash)
          } catch (err) {
            dispatch({
              type: INTERACTLEDGER,
              value: false
            })
            removeNotification(dispatch, notId)
            if (err !== undefined) createErrorNotification(dispatch, err.message)
          }
        },
      })
    }
    update()
  }
}