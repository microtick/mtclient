import api from '../api'

const globals = {
  id: 0,
  // array of markets
  markets: [],
  // number of instances per market
  count: {},
  // local subscriptions (clients)
  subscriptions: {},
  subscribed: [],
  changed: false
}

async function callback(event) {
  const market = event.value
  Object.keys(globals.subscriptions).map(key => {
    const obj = globals.subscriptions[key]
    if (obj.market === market) {
      obj.cb(event)
    }
    return null
  })
  
}

export const subscribe = async () => {
  if (globals.changed) {
    for (var i=0; i<globals.markets.length; i++) {
      const market = globals.markets[i]
      if (!globals.subscribed.includes[market]) {
        // Subscribe
        console.log("Subscribing: " + market)
        const id = await api.subscribe("mtm.MarketTick='" + market + "'", callback)
        globals.subscribed.push({
          market: market,
          id: id
        })
      }
    }
    globals.subscribed = globals.subscribed.reduce((acc, sub) => {
      if (!globals.markets.includes(sub.market)) {
        // Unsubscribe
        console.log("Unsubscribing: " + sub.market)
        api.unsubscribe(sub.id)
      } else {
        acc.push(sub)
      }
      return acc
    }, [])
  }
  globals.changed = false
}

export const addMarket = (market, cb)  => {
  if (!globals.markets.includes(market)) {
    globals.markets.push(market)
    globals.changed = true
  }
  if (globals.count[market] === undefined) {
    globals.count[market] = 0
  }
  globals.count[market]++
  const id = globals.id++
  globals.subscriptions[id] = {
    market: market,
    cb: cb
  }
  //console.log(JSON.stringify(globals.count))
  //console.log("# subscriptions=" + Object.keys(globals.subscriptions).length)
  return id
}

export const removeMarket = id => {
  if (!(id in globals.subscriptions)) return
  const market = globals.subscriptions[id].market
  globals.count[market]--
  delete globals.subscriptions[id]
  if (globals.count[market] === 0) {
    const index = globals.markets.indexOf(market)
    if (index > -1) {
      globals.markets.splice(index, 1)
      globals.changed = true
    }
  }
  //console.log(JSON.stringify(globals.count))
  //console.log("# subscriptions=" + Object.keys(globals.subscriptions).length)
}
