import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { mouseState, mouseMoveTrigger, setLock } from '../../modules/microtick'
import { buyCallDialog, buyPutDialog, placeQuoteDialog } from '../../modules/dialog'

// css
import './chart.css'

require('./misc.js')
const lock = require('./lock.png')

const commonName = {
  300: "5 min",
  600: "10 min",
  900: "15 min",
  1200: "20 min",
  1500: "25 min",
  1800: "30 min",
  2700: "45 min",
  3600: "1 hr",
  5400: "1.5 hr",
  7200: "2 hr",
  10800: "3 hr",
  14400: "4 hr",
  21600: "6 hr",
  28800: "8 hr",
  43200: "12 hr",
  64800: "18 hr",
  86400: "1 d"
}

const layout = {}

var minp = 0
var maxp = 0
var calls
var puts
var dynamicWeight = 0
var mouseEnabled = {
  chart: false,
  info: true,
  orderbook: false
}

var randomWalk = []
const RANDOM_HEIGHT = 0.02
const RANDOM_TICKS = 30 

const QUOTE_SCALE = 5

const MOUSESTATE_NONE = 0
const MOUSESTATE_QUOTE = 1
const MOUSESTATE_CALL = 2
const MOUSESTATE_PUT = 3

const isNumber = n => {
  return typeof n === 'number' && !isNaN(n-n)
}

var tokenType = ""

// Standard Normal variate using Box-Muller transform.
const randn_bm = () => {
  var u = 0, v = 0
  while (u === 0) u = Math.random() // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random()
  return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v )
}

export const chartCursorPos = function(qty, spot, prem, newspot) {
  if (typeof spot === 'string') spot = parseFloat(spot)
  if (typeof prem === 'string') prem = parseFloat(prem)
  if (typeof newspot === 'string') newspot = parseFloat(newspot)
  info_qqty = qty
  info_qspot = spot
  info_qprem = prem
  info_newspot = newspot
  const y = layout.height - (spot - minp) * layout.height / (maxp - minp)
  const delta = prem * layout.height / (maxp - minp)
  const qc = document.getElementById('quotecursor')
  if (qc) {
    qc.setAttribute('y1', y)
    qc.setAttribute('y2', y) 
  }
  const qctop = document.getElementById('qctop')
  if (qctop) {
    qctop.setAttribute('y1', y + delta)
    qctop.setAttribute('y2', y + delta) 
  }
  const qcbottom = document.getElementById('qcbottom')
  if (qcbottom) {
    qcbottom.setAttribute('y1', y - delta)
    qcbottom.setAttribute('y2', y - delta) 
  }
  const rtPrice = Math.round10(spot, -4)
  const qtext = document.getElementById('qcspot')
  if (qtext) {
    qtext.innerHTML = "@" + rtPrice + "  ⚖ " + Math.round10(qty, -4)
    const textProps = qtext.getBoundingClientRect()
    qtext.setAttribute('x', layout.width - textProps.width-10)
    qtext.setAttribute('y', y+5)
  }
  const posprem = document.getElementById('posprem')
  if (posprem) {
    //posprem.innerHTML = "Spot + " + Math.round10(prem, -4) + " = " + Math.round10(spot+prem, -4)
    posprem.innerHTML = "⇑ " + Math.round10(prem, -4)
    const textProps = posprem.getBoundingClientRect()
    posprem.setAttribute('x', layout.width - textProps.width-10)
    posprem.setAttribute('y', y-delta-4)
  }
  const negprem = document.getElementById('negprem')
  if (negprem) {
    //negprem.innerHTML = "Spot - " + Math.round10(prem, -4) + " = " + Math.round10(spot-prem, -4)
    negprem.innerHTML = "⇓ " + Math.round10(prem, -4)
    const textProps = negprem.getBoundingClientRect()
    negprem.setAttribute('x', layout.width - textProps.width-10)
    negprem.setAttribute('y', y+delta+14)
  }
  const nstext = document.getElementById('rightamt')
  if (nstext) {
    const nsy = layout.height - layout.height * (newspot - minp) / (maxp - minp)
    nstext.innerHTML = "New spot=@" + Math.round10(newspot, -4)
    nstext.setAttribute('x', layout.chart_ob_left + 5)
    nstext.setAttribute('y', nsy + 5)
  }
}

export const orderBookCursorPos = function(qty, totalqty, spot, iscall, price) {
  const cursx = document.getElementById('cursorx')
  const cx = layout.chart_ob_left + qty * layout.chart_ob_width / totalqty
  if (isNaN(cx)) return
  if (cursx) {
    cursx.setAttribute('y1', 0)
    cursx.setAttribute('y2', layout.height) 
    cursx.setAttribute('x1', cx)
    cursx.setAttribute('x2', cx) 
  }
  const cursy = document.getElementById('cursory')
  if (cursy) {
    if (iscall) {
      const cy = layout.height - layout.height * (spot + price - minp) / (maxp - minp)
      cursy.setAttribute('y1', cy)
      cursy.setAttribute('y2', cy)
    } else {
      const py = layout.height - layout.height * (spot - price - minp) / (maxp - minp)
      cursy.setAttribute('y1', py)
      cursy.setAttribute('y2', py)
    }
  }
  const otext = document.getElementById('rightamt')
  if (otext) {
    const sy = layout.height - layout.height * (parseFloat(spot) - minp) / (maxp - minp)
    otext.innerHTML = "⚖ " + Math.round10(qty, -4)
    const textProps = otext.getBoundingClientRect()
    if (cx + textProps.width + 5 > layout.chartwidth) {
      otext.setAttribute('x', cx - textProps.width - 5)
    } else {
      otext.setAttribute('x', cx + 5)
    }
    otext.setAttribute('y', sy + 5)
  }
  const ctext = document.getElementById('leftamt')
  if (ctext) {
    if (iscall) {
      const cp = parseFloat(spot) + price / 2
      const cy = layout.height - layout.height * (cp - minp) / (maxp - minp)
      ctext.innerHTML = "⇑ " + Math.round10(price, -4)
      const textProps = ctext.getBoundingClientRect()
      ctext.setAttribute('x', layout.chart_ob_left + 5)
      ctext.setAttribute('y', cy + 5)
    } else {
      const pp = parseFloat(spot) - price / 2 
      const py = layout.height - layout.height * (pp - minp) / (maxp - minp)
      ctext.innerHTML = "⇓ " + Math.round10(price, -4)
      const textProps = ctext.getBoundingClientRect()
      ctext.setAttribute('x', layout.chart_ob_left + 5)
      ctext.setAttribute('y', py + 5)
    }
  }
  const costamt = document.getElementById('costamt')
  if (costamt) {
    if (iscall) {
      const cp = parseFloat(spot) + price
      const cy = layout.height - layout.height * (cp - minp) / (maxp - minp)
      costamt.innerHTML = Math.round10(qty * price, -6) + " " + tokenType
      const textProps = costamt.getBoundingClientRect()
      if (cx + textProps.width / 2 > layout.chartwidth) {
        costamt.setAttribute('x', cx - textProps.width - 5)
      } else if (cx - textProps.width / 2 - 5 < layout.chart_ob_left) {
        costamt.setAttribute('x', cx + 5)
      } else {
        costamt.setAttribute('x', cx - textProps.width / 2 - 5)
      }
      costamt.setAttribute('y', cy - 4)
    } else {
      const pp = parseFloat(spot - price)
      const py = layout.height - layout.height * (pp - minp) / (maxp - minp)
      costamt.innerHTML = Math.round10(qty * price, -6) + " " + tokenType
      const textProps = costamt.getBoundingClientRect()
      if (cx + textProps.width / 2 > layout.chartwidth) {
        costamt.setAttribute('x', cx - textProps.width - 5)
      } else if (cx - textProps.width / 2 - 5 < layout.chart_ob_left) {
        costamt.setAttribute('x', cx + 5)
      } else {
        costamt.setAttribute('x', cx - textProps.width / 2 - 5)
      }
      costamt.setAttribute('y', py + 14)
    }
  }
  [2,3,4,5,6,7,8,9].map(m => {
    const reward = document.getElementById(m + 'x')
    if (reward) {
      if (iscall) {
        const cp = parseFloat(spot) + m * price
        const cy = layout.height - layout.height * (cp - minp) / (maxp - minp)
        reward.setAttribute('x', cx - 8)
        reward.setAttribute('y', cy + 4)
      } else {
        const pp = parseFloat(spot) - m * price
        const py = layout.height - layout.height * (pp - minp) / (maxp - minp)
        reward.setAttribute('x', cx - 8)
        reward.setAttribute('y', py + 4)
      }
    }
  })
  // update visualizer
  const infocostamt = document.getElementById('infocostamt')
  if (infocostamt) {
    infocostamt.innerHTML = "-" + Math.round10(qty * price, -2) + " " + tokenType
  }
  const infopremamt = document.getElementById('infopremamt') 
  if (infopremamt) {
    infopremamt.innerHTML = Math.round10(price, -2)
  }
  const infoqtyamt = document.getElementById('infoqtyamt')
  if (infoqtyamt) {
    infoqtyamt.innerHTML = "x " + Math.round10(qty, -2)
  }
  // update dialog
  const avgprem = document.getElementById('avg-prem')
  if (avgprem) {
    avgprem.innerHTML = Math.round10(price, -4)
  }
  const buycost = document.getElementById('buy-cost')
  if (buycost) {
    buycost.innerHTML = Math.round10(qty * price, -6) + " " + tokenType
  }
  const ordercall = document.getElementById('ordercall')
  if (ordercall) {
    const sy = layout.height - layout.height * (spot - minp) / (maxp - minp)
    const top = spot + price
    var y2 = layout.height - layout.height * (top - minp) / (maxp - minp)
    ordercall.setAttribute('y', y2)
    ordercall.setAttribute('height', sy - y2)
    //var call = <rect id="ordercall" className="premcall" x={layout.chart_mp_left} y={y2} 
  }
  const orderput = document.getElementById('orderput')
  if (orderput) {
    const sy = layout.height - layout.height * (spot - minp) / (maxp - minp)
    const bottom = spot - price
    y2 = layout.height - layout.height * (bottom - minp) / (maxp - minp)
    orderput.setAttribute('y', sy)
    orderput.setAttribute('height', y2 - sy)
  }
  info_cost = qty * price
  info_qty = qty
  info_prem = price
}

const generateRW = () => {
  // Generate random walk
  randomWalk = []
  var last = 0
  for (var i=0; i<RANDOM_TICKS-1; i++) {
    last = last + Math.floor(randn_bm() * layout.height * RANDOM_HEIGHT)
    randomWalk.push(last)
  }
  const delta = randomWalk[randomWalk.length-1] - randomWalk[0]
  for (i=0; i<randomWalk.length; i++) {
    const adjust = delta * i / randomWalk.length
    randomWalk[i] = randomWalk[i] - adjust
  }
  randomWalk.push(0)
}

const initDynamicView = props => {
  // HACK - gotta save token type into hacky variable because innerHTML can't
  // contain a <span>
  tokenType = props.token
  
  // get layout
  const elem = document.getElementById('chart')
  if (elem === null) return false
  const bounds = elem.getBoundingClientRect()
  layout.chartwidth = bounds.width
  layout.height = bounds.height
  layout.info_left = 0
  layout.info_width = 0
  
  const view = props.view
  minp = view.minp
  maxp = view.maxp
  
  if (props.mousestate === MOUSESTATE_NONE) {
      
    layout.width = layout.chartwidth * 0.75
    layout.chart_mp_left = layout.width
    layout.chart_mp_width = 0
    layout.chart_ob_left = layout.chartwidth * 0.75
    layout.chart_ob_width = layout.chartwidth - layout.chart_ob_left
    
    calls = props.orderbook.calls.quotes
    puts = props.orderbook.puts.quotes
      
  } else if (props.mousestate === MOUSESTATE_QUOTE) {
      
    if (props.dialog.showinline) {
      layout.width = layout.chartwidth * 0.5
      
      const qcspot = document.getElementById('qcspot')
      var textProps = qcspot.getBoundingClientRect()
      qcspot.setAttribute('x', layout.width - textProps.width-10)
      
      const posprem = document.getElementById('posprem')
      textProps = posprem.getBoundingClientRect()
      posprem.setAttribute('x', layout.width - textProps.width-10)
      
      const negprem = document.getElementById('negprem')
      textProps = negprem.getBoundingClientRect()
      negprem.setAttribute('x', layout.width - textProps.width-10)
    } else {
      layout.width = layout.chartwidth * 0.75 - 10
    }
      
    layout.chart_mp_left = layout.width
    layout.chart_mp_width = 10
    layout.chart_ob_left = layout.chartwidth * 0.75
    layout.chart_ob_width = layout.chartwidth - layout.chart_ob_left
    layout.info_left = layout.chart_mp_left + layout.chart_mp_width
    layout.info_width = layout.chart_ob_left - layout.info_left
    
    // check quote heights
    var spot = props.premiums.indicatedSpot
    calls = props.orderbook.calls.quotes.map(quote => {
      const top = spot + QUOTE_SCALE * (quote.premium - (spot - props.spot) / 2)
      if (top > maxp) maxp = top
      return quote
    })
    puts = props.orderbook.puts.quotes.map(quote => {
      const bottom = spot - QUOTE_SCALE * (quote.premium  - (spot - props.spot) / 2)
      if (bottom < minp) minp = bottom
      return quote
    })
    
  } else {
      
    if (props.dialog.showinline) {
      layout.width = layout.chartwidth * 0.5
      layout.info_left = layout.width
      layout.info_width = layout.chart_mp_left - layout.info_left
    } else {
      layout.width = layout.chartwidth * 0.75
    }
      
    layout.chart_mp_left = layout.chartwidth * 0.75
    layout.chart_mp_width = 10
    layout.chart_ob_left = layout.chartwidth * 0.75 + 10
    layout.chart_ob_width = layout.chartwidth - layout.chart_ob_left
    
    spot = props.premiums.indicatedSpot
    
    if (props.dialog.showinline) {
      const reserve = 0.4
      if (props.mousestate === MOUSESTATE_CALL) {
        calls = props.orderbook.calls.quotes.map(quote => {
          const top = spot + QUOTE_SCALE * (quote.premium - (spot - props.spot) / 2)
          if (top > maxp) maxp = top
          return quote
        })
        puts = props.orderbook.puts.quotes
        
        // reserve 40% screen below spot for text
        if (props.spot - minp < (maxp - minp) * reserve) {
          minp = props.spot - (maxp - props.spot) * reserve / (1-reserve)
        }
      }
      if (props.mousestate === MOUSESTATE_PUT) {
        calls = props.orderbook.calls.quotes
        puts = props.orderbook.puts.quotes.map(quote => {
          const bottom = spot - QUOTE_SCALE * (quote.premium  - (spot - props.spot) / 2)
          if (bottom < minp) minp = bottom
          return quote
        })
        
        // reserve 40% screen above spot for text
        if (maxp - props.spot < (maxp - minp) * reserve) {
          maxp = props.spot + (props.spot - minp) * reserve / (1-reserve)
        }
      }
    } else {
      calls = props.orderbook.calls.quotes
      puts = props.orderbook.puts.quotes
    }
  }
  
  var height = maxp - minp
  if (height === 0) height = 1
  minp = minp - height * .05
  maxp = maxp + height * .05
  
  return true
}

const buildBackground = props => {
  
  const chMouseMove = event => {
    //const sy = height - height * (props.spot - props.minp) / (props.maxp - props.minp)
    var bounds = event.target.getBoundingClientRect()
    var x = event.clientX - bounds.left 
    if (x > layout.width) x = layout.width
    var delta = ((layout.width - x) / 4 + 2)
    var y = event.clientY - bounds.top
    
    const backing = props.quote.backing
    var price = minp - (y - layout.height) * (maxp - minp) / layout.height
    var prem = delta * (maxp - minp) / layout.height
    
    const back = isNaN(props.orderbook.totalBacking[props.dur]) ? 0 : props.orderbook.totalBacking[props.dur]
    const wt = isNaN(props.orderbook.totalWeight[props.dur]) ? 0 : props.orderbook.totalWeight[props.dur]
    const partialprem = wt === 0 ? 0 : back / (props.constants.LEVERAGE * wt)      
    
    if (prem > partialprem * QUOTE_SCALE) {
      prem = partialprem * QUOTE_SCALE 
    }
    
    const qty = backing / (props.constants.LEVERAGE * prem)
    const weight = qty
    var newspot = (props.spot * props.weight + price * weight) / (weight + props.weight)
    
    if (price > newspot + 2 * prem) {
      newspot = props.spot + 2 * backing / (props.constants.LEVERAGE * props.weight)
      price = newspot + 2 * prem
    }
    if (price < newspot - 2 * prem) {
      newspot = props.spot - 2 * backing / (props.constants.LEVERAGE * props.weight)
      price = newspot - 2 * prem
    }
    
    //console.log("spot=" + props.spot)
    //console.log("newspot=" + newspot)
    //console.log("prem=" + prem)
    
    //console.log("backing= " + backing)
    //console.log("price=" + price)
    //console.log("weight=" + weight)
    //console.log("market weight=" + props.weight)
    
    var call = prem + (price - newspot) / 2
    if (call < 0) call = 0
    var put = prem - (price - newspot) / 2
    if (put < 0) put = 0
    
    dynamicWeight = weight
    props.orderbook.setQuotePremiums(qty, price, prem, weight, newspot, call, put)
    chartCursorPos(qty, price, prem, newspot, minp)
  }
  
  const chMouseClick = event => {
    if (props.dialog.showinline) return
    props.placeQuoteDialog()
  }
  
  const obMouseMove = event => {
    var bounds = event.target.getBoundingClientRect()
    var x = event.clientX - bounds.left 
    if (x < layout.chart_ob_left) x = layout.chart_ob_left
    const y = event.clientY - bounds.top
    const qty = (x - layout.chart_ob_left) * props.orderbook.totalWeight[props.dur] / layout.chart_ob_width
    const sy = layout.height - layout.height * (parseFloat(props.spot) - minp) / (maxp - minp)
    const callprice = props.orderbook.calls.price(qty)
    const putprice = props.orderbook.puts.price(qty)
    if (props.mousestate === MOUSESTATE_CALL) {
      props.orderbook.setBuyPremium(qty, true)
    } 
    if (props.mousestate === MOUSESTATE_PUT) {
      props.orderbook.setBuyPremium(qty, false)
    }
    orderBookCursorPos(qty, props.orderbook.totalWeight[props.dur], props.spot, y <= sy, y <= sy ? callprice : putprice)
  }
  
  const obMouseClick = event => {
    if (props.dialog.showinline) return
    var bounds = event.target.getBoundingClientRect()
    const y = event.clientY - bounds.top
    const sy = layout.height - layout.height * (parseFloat(props.spot) - minp) / (maxp - minp)
    if (y <= sy) {
      props.buyCallDialog()
    } else {
      props.buyPutDialog()
    }
  }
  
  const mouseEnter = event => {
    if (props.dialog.showinline) return
    
    const bounds = event.target.getBoundingClientRect()
    const x = event.clientX - bounds.left
    const y = event.clientY - bounds.top
    
    if (x <= layout.width) {
      props.mouseState(MOUSESTATE_QUOTE)
    } 
    if (x >= layout.chart_ob_left) {
      const sy = layout.height - layout.height * (parseFloat(props.spot) - minp) / (maxp - minp)
      if (y <= sy) {
        props.mouseState(MOUSESTATE_CALL)
      } else {
        props.mouseState(MOUSESTATE_PUT)
      }
    }
  }
  
  const mouseLeave = event => {
    if (props.dialog.showinline) return
    props.mouseState(MOUSESTATE_NONE)
  }
  
  const mouseMove = event => {
    const bounds = event.target.getBoundingClientRect()
    const x = event.clientX - bounds.left
    const y = event.clientY - bounds.top
    
    if (props.dialog.showinline) {
      if (x >= layout.info_left && x < layout.info_left+layout.info_width) { 
        if (mouseEnabled.info) {
          generateRW()
          mouseMoveTrigger(y)
        }
      }
      if (props.mousestate === MOUSESTATE_QUOTE) {
        if (x <= layout.width && mouseEnabled.chart) {
          chMouseMove(event)
        }
      } else {
        if (x >= layout.chart_ob_left && mouseEnabled.orderbook) {
          obMouseMove(event)
        }
      }
      return
    }
    
    if (x <= layout.width) {
      props.mouseState(MOUSESTATE_QUOTE)
    } 
    if (x >= layout.chart_ob_left) {
      const sy = layout.height - layout.height * (parseFloat(props.spot) - minp) / (maxp - minp)
      if (y <= sy) {
        props.mouseState(MOUSESTATE_CALL)
      } else {
        props.mouseState(MOUSESTATE_PUT)
      }
    }
    
    if (props.mousestate === MOUSESTATE_QUOTE) {
      chMouseMove(event)
    } else {
      obMouseMove(event)
    }
  }
  
  const mouseClick = event => {
    if (randomWalk.length === 0) generateRW()
    if (props.dialog.showinline) {
      const bounds = event.target.getBoundingClientRect()
      const x = event.clientX - bounds.left
      if (props.mousestate === MOUSESTATE_QUOTE) {
        if (x <= layout.width) {
          mouseEnabled.chart = !mouseEnabled.chart
        } else if (x >= layout.info_left && x < layout.info_left + layout.info_width) {
          mouseEnabled.info = !mouseEnabled.info
        }
        setLock({
          chart: !mouseEnabled.chart,
          info: !mouseEnabled.info,
          orderbook: true
        })
      } else {
        if (x >= layout.info_left && x < layout.info_left + layout.info_width) { 
          mouseEnabled.info = !mouseEnabled.info
        }
        if (x >= layout.chart_ob_left) {
          mouseEnabled.orderbook = !mouseEnabled.orderbook
        }
        setLock({
          chart: true,
          info: !mouseEnabled.info,
          orderbook: !mouseEnabled.orderbook
        })
      }
    } else {
      mouseEnabled.chart = false
      mouseEnabled.info = true
      mouseEnabled.orderbook = false
      setLock({
        chart: !mouseEnabled.chart,
        info: !mouseEnabled.info,
        orderbook: !mouseEnabled.orderbook
      })
    }
    if (props.mousestate === MOUSESTATE_QUOTE) {
      chMouseClick(event)
    } else {
      obMouseClick(event)
    }
  }
  
  const right = layout.chart_ob_left + layout.chart_ob_width
  return <g>
    <rect id="chartback" x={0} width={layout.chartwidth} y={0} height={layout.height}
      onMouseEnter={mouseEnter} onMouseLeave={mouseLeave} 
      onMouseMove={mouseMove} onClick={mouseClick}/>
      
    <text className="info" x={layout.chart_ob_left+20} y={15}>Order Book</text>
    <text id="axis_quantity" x={layout.chart_ob_left+20} y={layout.height-20}>quantity</text>
    <line className="axis_qty" x1={layout.chart_mp_left+2} y1={layout.height-10} x2={right-2} y2={layout.height-10}/>
    <line className="axis_qty_tip" x1={right-2} y1={layout.height-10} x2={right-5} y2={layout.height-7}/>
    <line className="axis_qty_tip" x1={right-2} y1={layout.height-10} x2={right-5} y2={layout.height-13}/>
  </g>
}

const buildTimeGrid = props => {
  const view = props.view
  if (props.chartsize === 600) {
    var grids = [ 300, 600 ]
  } else if (props.chartsize === 1200) {
    grids = [ 300, 600, 900, 1200 ]
  } else if (props.chartsize === 1800) {
    grids = [ 300, 600, 900, 1200, 1500, 1800 ]
  } else if (props.chartsize === 3600) {
    grids = [ 900, 1800, 2700, 3600 ]
  } else if (props.chartsize === 7200) {
    grids = [ 1800, 3600, 5400, 7200 ]
  } else if (props.chartsize === 14400) {
    grids = [ 3600, 7200, 10800, 14400 ]
  } else if (props.chartsize === 28800) {
    grids = [ 7200, 14400, 21600, 28800 ]
  } else if (props.chartsize === 43200) {
    grids = [ 10800, 21600, 32400, 43200 ]
  } else if (props.chartsize === 86400) {
    grids = [ 21600, 43200, 64800, 86400 ]
  } else if (props.chartsize === 172800) {
    grids = [ 43200, 86400, 129600, 172800 ]
  } else {
    grids = [ 5000, 10000, 15000 ]
  }
  if (view.minb !== null && !isNaN(view.minb) && view.maxb > view.minb) {
    const rules = []
    const text = []
    for (var i in grids) {
      let clz = "gridrule"
      if (grids[i] === props.dur) {
        clz += " heavy"
      }
      const grid = grids[i] / props.blocktime
      const x = layout.width * ((view.maxb-grid) - view.minb) / (view.maxb - view.minb)
      rules.push(<line key={i} className={clz} x1={x} y1={0} x2={x} y2={layout.height}/>)
      text.push(<text key={i} className="gridtext" x={x+5} y={layout.height-4}>{commonName[grids[i]]}</text>)
    }
    return <g>
      <line className="gridrule" x1={layout.width} y1={0} x2={layout.width} y2={layout.height}/>
      {rules}
      {text}
    </g>
  }
}

const buildPriceGrid = props => {
  //console.log("minp=" + minp)
  //console.log("maxp=" + maxp)
  var div = layout.height / 40;
  var delta = Math.log10((maxp - minp) / div);
  //console.log("delta=" + delta);
  var floor = Math.floor(delta);
  //console.log("floor=" + floor);
  var frac = delta - floor;
  var base = 2;
  if (frac > 0.3010 && frac <= 0.6942) base = 5;
  if (frac > 0.6942) base = 10;
  //console.log("base=" + base);
  var inc = Math.pow(10, Math.log10(base) + floor);
  //console.log("inc=" + inc);
  var start = (Math.floor(minp / inc) + 1) * inc;
  var tics = [];
  while (start < maxp) {
      tics.push(Math.round10(start, floor-1));
      start += inc;
  }
  //console.log("tics=" + tics)
  const grids = tics.map((tic, i) => {
    const y = layout.height - layout.height * (tic - minp) / (maxp - minp)
    return <g key={i}>
      <line className="gridrule" x1={0} x2={layout.width} y1={y} y2={y}/>
      <text className="gridtext" x="5" y={y-4}>{tic}</text>
    </g>
  })
  return <g className="grid">
    {grids}
  </g>
}

// use to propagate to info window
var lasty

const buildPriceOverlay = props => {
  const view = props.view
  const data = props.data
  //console.log("view=" + JSON.stringify(view))
  const mint = view.now - view.dur
  if (data.length > 0) {
    const points = data.map((p, i) => {
      const x = layout.width * (p.time - mint) / view.dur
      //const x2 = width * (p.block - view.minb) / (view.maxb - view.minb)
      //console.log("x=" + x)
      const y = layout.height - layout.height * (p.value - minp) / (maxp - minp)
      return <circle className="spot" key={i} cx={x} cy={y}/>
    })
    var curx = 0
    if (data.length > 0) {
      lasty = layout.height - layout.height * (data[0].value - minp) / (maxp - minp)
    } else {
      lasty = layout.height - layout.height * (props.spot - minp) / (maxp - minp)
    }
    const lines = data.map((p, i) => {
      const x = layout.width * (p.time - mint) / view.dur
      //const x = width * (p.block - view.minb) / (view.maxb - view.minb)
      const y = layout.height - layout.height * (p.value - minp) / (maxp - minp)
      const linegr = <g key={i}>
        <line className="spot" x1={curx} x2={x} y1={lasty} y2={lasty}/>
        <line className="spot"  x1={x} x2={x} y1={lasty} y2={y}/>
      </g>
      curx = x
      lasty = y
      return linegr
    })
    lines.push(<line className="spot" key={data.length+2} x1={curx} x2={layout.width+2} y1={lasty} y2={lasty}/>)
    return <g>
      <g>
        {lines}
      </g>
      <g>
        {points}
      </g>
    </g>
  } 
}

var info_cost
var info_qty
var info_prem

var info_qspot
var info_qprem
var info_qqty
var info_newspot

const buildInfoOverlay = props => {
  var movx = 0
  var movy = 0
  if (layout.info_width > 0) {
    movx = layout.info_left
    if (props.mousestate === MOUSESTATE_QUOTE) {
      var spot = props.premiums.indicatedSpot
      if (!isNumber(spot)) spot = props.spot
      var tmpy1 = layout.height - layout.height * (spot - minp) / (maxp - minp)
    } else {
      tmpy1 = lasty
    }
    const strike_price = minp - (tmpy1 - layout.height) * (maxp - minp) / layout.height
    if (props.dialog.showinline && props.mousemove > 0) {
      var tmpy2 = props.mousemove
    } else {
      tmpy2 = tmpy1
    }
    const settle_price = minp - (tmpy2 - layout.height) * (maxp - minp) / layout.height
    movy = tmpy1
    
    if (randomWalk.length > 2) {
      const inc = layout.info_width / randomWalk.length
      var info = [
        <line key="mt0" className="spot" x1={layout.info_left} y1={tmpy1} x2={layout.info_left+inc/2} y2={tmpy1}/>
      ]
      for (var i=0,x=layout.info_left+inc/2; x+inc<layout.info_left+layout.info_width && i<randomWalk.length; i++,x+=inc) {
        const r = randomWalk[i]
        const y = r + tmpy1 + (tmpy2 - tmpy1) * (x - layout.info_left) / layout.info_width 
        const tmp = <g key={i}>
          <line className="spot" x1={x} y1={movy} x2={x} y2={y}/>
          <line className="spot" x1={x} y1={y} x2={x+inc} y2={y}/>
        </g>
        movx = x + inc
        movy = y
        info.push(tmp)
      }
      info.push(<g key="mt1">
          <line className="spot" x1={movx} y1={movy} x2={movx} y2={tmpy2}/>
          <line className="spot" x1={movx} y1={tmpy2} x2={layout.info_left + layout.info_width} y2={tmpy2}/>
        </g>
      )
    }
    
    const info_y2 = layout.info_left + layout.info_width
    if (props.mousestate === MOUSESTATE_QUOTE) {
      var priceAsCall = info_qprem - (info_newspot - info_qspot) / 2
      var priceAsPut = info_qprem + (info_newspot - info_qspot) / 2
      if (priceAsCall < 0) priceAsCall = 0
      if (priceAsPut < 0) priceAsPut = 0
      var profitAsCall = info_qqty * (priceAsCall - (settle_price - strike_price > 0 ? settle_price - strike_price : 0))
      var profitAsPut = info_qqty * (priceAsPut - (strike_price - settle_price > 0 ? strike_price - settle_price : 0))
      var premiumAsCall = priceAsCall * info_qqty
      var premiumAsPut = priceAsPut * info_qqty
      if (profitAsCall < -props.quote.backing) profitAsCall = -props.quote.backing
      if (profitAsPut < -props.quote.backing) profitAsPut = -props.quote.backing
    }
    if (props.mousestate === MOUSESTATE_QUOTE) {
      var retcall = (settle_price - strike_price) * info_qqty
      if (retcall < 0) retcall = 0
      var retput = (strike_price - settle_price) * info_qqty
      if (retput < 0) retput = 0
      var payout = <rect className="payout" x={info_y2-10} y={tmpy1>tmpy2?tmpy2:tmpy1} width={10} height={tmpy1>tmpy2?tmpy1-tmpy2:tmpy2-tmpy1}/>
    }
    if (props.mousestate === MOUSESTATE_CALL) {
      var infoclass = "call"
      if (settle_price > strike_price) {
        var ret = (settle_price - strike_price) * info_qty
      } else {
        ret = 0
      }
      payout = <rect className="payout" x={info_y2-10} y={tmpy2} width={10} height={tmpy1>tmpy2?tmpy1-tmpy2:0}/>
    } 
    if (props.mousestate === MOUSESTATE_PUT) {
      infoclass = "put"
      if (strike_price > settle_price) {
        ret = (strike_price - settle_price) * info_qty
      } else {
        ret = 0
      }
      payout = <rect className="payout" x={info_y2-10} y={tmpy1} width={10} height={tmpy2>tmpy1?tmpy2-tmpy1:0}/>
    }
    window.requestAnimationFrame(() => {
      const infotitle = document.getElementById('infotitle')
      if (infotitle) {
        var textProps = infotitle.getBoundingClientRect()
        infotitle.setAttribute('x', layout.info_left + (layout.info_width - textProps.width)/2)
      }
      const infotime = document.getElementById('infotime')
      if (infotime) {
        textProps = infotime.getBoundingClientRect()
        infotime.setAttribute('x', layout.info_left + (layout.info_width - textProps.width)/2)
      }
      const infoqtyamt = document.getElementById('infoqtyamt')
      if (infoqtyamt) {
        textProps = infoqtyamt.getBoundingClientRect()
        infoqtyamt.setAttribute('x', layout.info_left + layout.info_width - textProps.width - 5)
      }
      const infopremamt = document.getElementById('infopremamt')
      if (infopremamt) {
        textProps = infopremamt.getBoundingClientRect()
        infopremamt.setAttribute('x', layout.info_left + layout.info_width - textProps.width - 5)
      }
      const infocostamt = document.getElementById('infocostamt')
      if (infocostamt) {
        textProps = infocostamt.getBoundingClientRect()
        infocostamt.setAttribute('x', layout.info_left + layout.info_width - textProps.width - 5)
      }
      const inforeturnamt = document.getElementById('inforeturnamt')
      if (inforeturnamt) {
        textProps = inforeturnamt.getBoundingClientRect()
        inforeturnamt.setAttribute('x', layout.info_left + layout.info_width - textProps.width - 5)
      }
      const inforeturnamt2 = document.getElementById('inforeturnamt2')
      if (inforeturnamt2) {
        textProps = inforeturnamt2.getBoundingClientRect()
        inforeturnamt2.setAttribute('x', layout.info_left + layout.info_width - textProps.width - 5)
      }
      const infoprofitamt = document.getElementById('infoprofitamt')
      if (infoprofitamt) {
        textProps = infoprofitamt.getBoundingClientRect()
        infoprofitamt.setAttribute('x', layout.info_left + layout.info_width - textProps.width - 5)
      }
      const callpriceamt = document.getElementById('callpriceamt')
      if (callpriceamt) {
        textProps = callpriceamt.getBoundingClientRect()
        callpriceamt.setAttribute('x', layout.info_left + layout.info_width - textProps.width - 5)
      }
      const callpremiumamt = document.getElementById('callpremiumamt')
      if (callpremiumamt) {
        textProps = callpremiumamt.getBoundingClientRect()
        callpremiumamt.setAttribute('x', layout.info_left + layout.info_width - textProps.width - 5)
      }
      const callprofitamt = document.getElementById('callprofitamt')
      if (callprofitamt) {
        textProps = callprofitamt.getBoundingClientRect()
        callprofitamt.setAttribute('x', layout.info_left + layout.info_width - textProps.width - 5)
      }
      const putpriceamt = document.getElementById('putpriceamt')
      if (putpriceamt) {
        textProps = putpriceamt.getBoundingClientRect()
        putpriceamt.setAttribute('x', layout.info_left + layout.info_width - textProps.width - 5)
      }
      const putpremiumamt = document.getElementById('putpremiumamt')
      if (putpremiumamt) {
        textProps = putpremiumamt.getBoundingClientRect()
        putpremiumamt.setAttribute('x', layout.info_left + layout.info_width - textProps.width - 5)
      }
      const putprofitamt = document.getElementById('putprofitamt')
      if (putprofitamt) {
        textProps = putprofitamt.getBoundingClientRect()
        putprofitamt.setAttribute('x', layout.info_left + layout.info_width - textProps.width - 5)
      }
    })
    if (props.mousestate === MOUSESTATE_CALL || props.mousestate === MOUSESTATE_PUT) {
      const starty = props.mousestate === MOUSESTATE_CALL ? layout.height - 140 : 40
      return <g id="info">
        <rect id="infoback" x={layout.info_left} y={0} width={layout.info_width} height={layout.height}/>
        {payout}
        {info}
        <line id="strikeline" x1={layout.info_left} y1={tmpy1} x2={info_y2} y2={tmpy1}/>
        <line id="settleline" x1={0} y1={tmpy2} x2={layout.chart_ob_left+layout.chart_ob_width} y2={tmpy2}/>
        <text id="infotitle" x={layout.info_left+20} y={15}>Outcome Visualizer</text>
        <text className="inforeturn" x={layout.info_left+5} y={starty}>Projected payout</text>
        <text id="inforeturnamt" className="inforeturn" x={layout.info_left+5} y={starty}>{Math.round10(ret,-2)} {tokenType}</text>
        <text x={layout.info_left+15} y={starty+18}>Avg Premium</text>
        <text id="infopremamt" x={layout.info_left+5} y={starty+18}>{Math.round10(info_prem,-2)}</text>
        <text x={layout.info_left+15} y={starty+36}>Quantity</text>
        <text id="infoqtyamt" x={layout.info_left+5} y={starty+36}>x {Math.round10(info_qty,-2)}</text>
        <text className={"infocost"+infoclass} x={layout.info_left+5} y={starty+54}>Position cost</text>
        <text id="infocostamt" className={"infocost"+infoclass} x={layout.info_left+5} y={starty+54}>- {Math.round10(info_cost,-2)} {tokenType}</text>
        <text className="infoprofit" x={layout.info_left+5} y={starty+72}>Projected profit</text>
        <text id="infoprofitamt" className="infoprofit" x={layout.info_left+5} y={starty+72}>= {Math.round10(ret-info_cost,-2)} {tokenType}</text>
        <text id="infotime" x={layout.info_left+5} y={layout.height-20}>{commonName[props.dur]} duration</text>
        <line className="futuretime" x1={layout.info_left+2} y1={layout.height-10} x2={info_y2-2} y2={layout.height-10}/>
        <line className="futuretimetip" x1={layout.info_left+2} y1={layout.height-10} x2={layout.info_left+5} y2={layout.height-7}/>
        <line className="futuretimetip" x1={layout.info_left+2} y1={layout.height-10} x2={layout.info_left+5} y2={layout.height-13}/>
        <line className="futuretimetip" x1={info_y2-2} y1={layout.height-10} x2={info_y2-5} y2={layout.height-7}/>
        <line className="futuretimetip" x1={info_y2-2} y1={layout.height-10} x2={info_y2-5} y2={layout.height-13}/>
      </g>
    } else {
      const startcall = 40
      const startput = layout.height - 110
      return <g id="info">
        <rect id="infoback" x={layout.info_left} y={0} width={layout.info_width} height={layout.height}/>
        {payout}
        {info}
        <line id="strikeline" x1={layout.info_left} y1={tmpy1} x2={info_y2} y2={tmpy1}/>
        <line id="settleline" x1={0} y1={tmpy2} x2={layout.chart_ob_left+layout.chart_ob_width} y2={tmpy2}/>
        <text id="infotitle" className="info" x={layout.info_left+20} y={15}>Outcome Visualizer</text> 
        <text x={layout.info_left+5} y={startcall}>Call quote</text>
        <text id="callpriceamt" x={layout.info_left+5} y={startcall}>{Math.round10(priceAsCall,-2)}</text>
        <text className="tradecall" x={layout.info_left+5} y={startcall+18}>Call premium</text>
        <text id="callpremiumamt" className="tradecall" x={layout.info_left+5} y={startcall+18}>{Math.round10(premiumAsCall,-2)} {tokenType}</text>
        <text className="inforeturn" x={layout.info_left+5} y={startcall+36}>Projected payout</text>
        <text id="inforeturnamt" className="inforeturn" x={layout.info_left+5} y={startcall+36}>{Math.round10(retcall,-2)} {tokenType}</text>
        <text className="infoprofit" x={layout.info_left+5} y={startcall+54}>Call profit</text>
        <text id="callprofitamt" className="infoprofit" x={layout.info_left+5} y={startcall+54}>{Math.round10(profitAsCall,-2)} {tokenType}</text>
        
        <text x={layout.info_left+5} y={startput}>Put quote</text>
        <text id="putpriceamt" x={layout.info_left+5} y={startput}>{Math.round10(priceAsPut,-2)}</text>
        <text className="tradeput" x={layout.info_left+5} y={startput+18}>Put premium</text>
        <text id="putpremiumamt" className="tradeput" x={layout.info_left+18} y={startput+18}>= {Math.round10(premiumAsPut,-2)} {tokenType}</text>
        <text className="inforeturn" x={layout.info_left+5} y={startput+36}>Projected payout</text>
        <text id="inforeturnamt2" className="inforeturn" x={layout.info_left+5} y={startput+36}>{Math.round10(retput,-2)} {tokenType}</text>
        <text className="infoprofit" x={layout.info_left+5} y={startput+54}>Put profit</text>
        <text id="putprofitamt" className="infoprofit" x={layout.info_left+5} y={startput+54}>= {Math.round10(profitAsPut,-2)} {tokenType}</text>
        
        <text id="infotime" x={layout.info_left+5} y={layout.height-20}>{commonName[props.dur]} duration</text>
        <line className="futuretime" x1={layout.info_left+2} y1={layout.height-10} x2={info_y2-2} y2={layout.height-10}/>
        <line className="futuretimetip" x1={layout.info_left+2} y1={layout.height-10} x2={layout.info_left+5} y2={layout.height-7}/>
        <line className="futuretimetip" x1={layout.info_left+2} y1={layout.height-10} x2={layout.info_left+5} y2={layout.height-13}/>
        <line className="futuretimetip" x1={info_y2-2} y1={layout.height-10} x2={info_y2-5} y2={layout.height-7}/>
        <line className="futuretimetip" x1={info_y2-2} y1={layout.height-10} x2={info_y2-5} y2={layout.height-13}/>
      </g>
    }
  }
  return <g id="info"></g>
}

const buildTradesOverlay = props => {
  const view = props.view
  const mint = view.now - view.dur
  const t = props.trades.filter(t => {
    return t.market === props.market
  }).map((t, i) => {
    const strike = t.strike
    const sum = t.type === 0 ? 
      parseFloat(t.strike) + parseFloat(t.premium) / parseFloat(t.qty) : 
      parseFloat(t.strike) - parseFloat(t.premium) / parseFloat(t.qty)
    const x1 = layout.width * (t.start.getTime() - mint) / view.dur
    //const x1 = width * (t.startBlock - view.minb) / (view.maxb - view.minb)
    if (t.endBlock !== undefined) {
      var x2 = layout.width * (t.end.getTime() - mint) / view.dur
      //var x2 = width * (t.endBlock - view.minb) / (view.maxb - view.minb)
    } else {
      x2 = layout.width
    }
    const y1 = layout.height - layout.height * (strike - minp) / (maxp - minp)
    const y2 = layout.height - layout.height * (sum - minp) / (maxp - minp)
    const yfinal = layout.height - layout.height * (t.final - minp) / (maxp - minp)
    var clz = t.type === 0 ? "call" : "put"
    const x = x1 < x2 ? x1 : x2
    const y = y1 < y2 ? y1 : y2
    const w = x2 > layout.width ? layout.width - x1 : x2 - x1
    const h = y1 < y2 ? y2 - y1 : y1 - y2
    if (!t.active) clz = "inactive"
    if (x1 === x2) {
      var begin = <line className={clz + " begin"} x1={x1} x2={x1} y1={y1} y2={y2}/>
    }
    if (x2 < layout.width) {
      var end = <g>
        <line className={clz + " tradebase " + t.dir} x1={x2} y1={y1} x2={x2} y2={yfinal}/>
        <line className={clz + " tradebase"} x1={x2-3} x2={x2+3} y1={yfinal-3} y2={yfinal+3}/>
        <line className={clz + " tradebase"} x1={x2-3} x2={x2+3} y1={yfinal+3} y2={yfinal-3}/>
      </g>
    }
    return <g key={i}>
      {begin}
      <rect className={clz} x={x} y={y} width={w} height={h}/>
      <line className={clz + " tradebase " + t.dir} x1={x1} y1={y1} x2={x2 > layout.width ? layout.width : x2} y2={y1}/>
      <circle className={clz} cx={x1} cy={y1}/>
      {end}
    </g>
  })
  return <g>
    {t}
  </g>
}

const buildForeground = props => {
  if (props.mousestate === MOUSESTATE_QUOTE) {
    var ret = <g>
      <line id="quotecursor" className="cursor" x1={0} y1={0} x2={layout.width} y2={0}/>
      <line id="qctop" className="cursor" x1={0} y1={0} x2={layout.width} y2={0}/>
      <line id="qcbottom" className="cursor" x1={0} y1={0} x2={layout.width} y2={0}/>
      <text id="qcspot" className="ordertip" x={0} y={0}></text>
      <text id="posprem" className="ordertip" x={0} y={0}></text>
      <text id="negprem" className="ordertip" x={0} y={0}></text>
    </g>
  }
  if (props.mousestate === MOUSESTATE_CALL || props.mousestate === MOUSESTATE_PUT) {
    if (props.mousestate === MOUSESTATE_CALL) {
      var costclass = "call"
    }
    if (props.mousestate === MOUSESTATE_PUT) {
      costclass = "put"
    }
    if (props.dialog.showinline) {
      var mults = <g>
        <text id="2x" className="reward" x={0} y={0}>2x</text>
        <text id="3x" className="reward" x={0} y={0}>3x</text>
        <text id="4x" className="reward" x={0} y={0}>4x</text>
        <text id="5x" className="reward" x={0} y={0}>5x</text>
        <text id="6x" className="reward" x={0} y={0}>6x</text>
        <text id="7x" className="reward" x={0} y={0}>7x</text>
        <text id="8x" className="reward" x={0} y={0}>8x</text>
        <text id="9x" className="reward" x={0} y={0}>9x</text>
      </g>
    }
    ret = <g>
      <line id="cursorx" className="cursor" x1={layout.chart_ob_left} y1={0} x2={layout.chart_ob_left} y2={layout.height}/>
      <line id="cursory" className={"cursor " + costclass} x1={layout.chart_ob_left} y1={0} x2={layout.chart_ob_left + layout.chart_ob_width -1} y2={0}/>
      <text id="leftamt" className="ordertip" x={0} y={0}></text>
      <text id="rightamt" className="ordertip" x={0} y={0}></text>
      <text id="costamt" className={"ordertip " + costclass} x={0} y={0}></text>
      {mults}
    </g>
  }
  return ret
}

const buildOrderbookSpot = props => {
  const sy = layout.height - layout.height * (props.spot - minp) / (maxp - minp)
  const mid = layout.chart_mp_left + layout.chart_mp_width / 2
  const right = layout.chart_mp_left + layout.chart_mp_width
  if (props.premiums && props.mousestate === MOUSESTATE_QUOTE) {
    var spot = props.premiums.indicatedSpot
    if (!isNumber(spot)) spot = props.spot
    const yspot = layout.height - layout.height * (spot - minp) / (maxp - minp)
    return <g id="spotpointer">
      <line x1={layout.chart_mp_left} x2={mid} y1={sy} y2={sy}/>
      <line x1={mid} y1={yspot} x2={mid} y2={sy}/>
      <line x1={mid} y1={yspot} x2={right} y2={yspot}/>
      <line x1={right} y1={yspot} x2={right-3} y2={yspot-3}/>
      <line x1={right} y1={yspot} x2={right-3} y2={yspot+3}/>
    </g>
  }
}

const buildOrderbookPremiums = props => {
  const premiums = props.premiums
  if (premiums && (props.mousestate === MOUSESTATE_CALL || props.mousestate === MOUSESTATE_PUT)) {
    if (premiums.buy) {
      var spot = props.spot
    } else {
      spot = premiums.indicatedSpot
    }
    
    // Spot
    const sy = layout.height - layout.height * (spot - minp) / (maxp - minp)
    // Call
    if (props.mousestate === MOUSESTATE_CALL && isNumber(premiums.indicatedCallPremium)) {
      const top = spot + premiums.indicatedCallPremium
      var y2 = layout.height - layout.height * (top - minp) / (maxp - minp)
      var call = <rect id="ordercall" className="premcall" x={layout.chart_mp_left} y={y2} 
        width={layout.chart_mp_width} height={sy-y2}/>
    }
    // Put
    if (props.mousestate === MOUSESTATE_PUT && isNumber(premiums.indicatedPutPremium)) {
      const bottom = spot - parseFloat(premiums.indicatedPutPremium)
      y2 = layout.height - layout.height * (bottom - minp) / (maxp - minp)
      var put = <rect id="orderput" className="premput" x={layout.chart_mp_left} y={sy} 
        width={layout.chart_mp_width} height={y2-sy}/>
    }
    return <g id="selprem">
      {call}
      {put}
    </g>
  }
}

const buildOrderBook = props => {
  if (props.orderbook.totalWeight[props.dur] > 0) {
    if (props.premiums.buy || props.mousestate !== MOUSESTATE_QUOTE) {
      var spot = props.spot
      var sy = layout.height - layout.height * (spot - minp) / (maxp - minp)
      var callquoterects = calls.map((quote, id) => {
        const x1 = layout.chart_ob_left + quote.q1 * layout.chart_ob_width / props.orderbook.totalWeight[props.dur]
        const x2 = layout.chart_ob_left + quote.q2 * layout.chart_ob_width / props.orderbook.totalWeight[props.dur] 
        const top = parseFloat(spot) + quote.premium
        const y2 = layout.height - layout.height * (top - minp) / (maxp - minp)
        return <rect key={id} className={"quote" + (quote.color % 8)} x={x1} y={y2} width={x2-x1} height={sy-y2}/>
      })
      var putquoterects = puts.map((quote, id) => {
        const x1 = layout.chart_ob_left + quote.q1 * layout.chart_ob_width / props.orderbook.totalWeight[props.dur]
        const x2 = layout.chart_ob_left + quote.q2 * layout.chart_ob_width / props.orderbook.totalWeight[props.dur]
        const bottom = parseFloat(spot) - quote.premium
        const y2 = layout.height - layout.height * (bottom - minp) / (maxp - minp)
        return <rect key={id} className={"quote" + (quote.color % 8)} x={x1} y={sy} width={x2-x1} height={y2-sy}/>
      })
    } else {
      spot = props.premiums.indicatedSpot
      if (!isNumber(spot)) spot = props.spot
      sy = layout.height - layout.height * (spot - minp) / (maxp - minp)
      const totalWeight = parseFloat(props.orderbook.totalWeight[props.dur]) + dynamicWeight
      var shift = layout.chart_ob_width * dynamicWeight / totalWeight
      if (!isNumber(shift)) shift = 0
      var leftX = layout.chart_ob_left
      callquoterects = calls.map((quote, id) => {
        var x1 = layout.chart_ob_left + quote.q1 * layout.chart_ob_width / totalWeight
        var x2 = layout.chart_ob_left + quote.q2 * layout.chart_ob_width / totalWeight
        const callPremium = quote.premium - (spot - props.spot) / 2
        if (props.premiums.indicatedCallPremium < callPremium) {
          x1 += shift
          x2 += shift
        } else {
          leftX = x2
        }
        const top = parseFloat(spot) + callPremium
        const y2 = layout.height - layout.height * (top - minp) / (maxp - minp)
        return <rect key={id} className={"quote" + (quote.color % 8)} x={x1} y={y2} width={x2-x1} height={sy-y2}/>
      })
      var quoteTop = spot
      if (isNumber(props.premiums.indicatedCallPremium)) quoteTop += props.premiums.indicatedCallPremium
      var y3 = layout.height - layout.height * (quoteTop - minp) / (maxp - minp)
      callquoterects.push(<rect key="callquote" id="callquote" x={leftX} y={y3} width={shift} height={sy-y3}/>)
      leftX = layout.chart_ob_left
      putquoterects = puts.map((quote, id) => {
        var x1 = layout.chart_ob_left + quote.q1 * layout.chart_ob_width / totalWeight
        var x2 = layout.chart_ob_left + quote.q2 * layout.chart_ob_width / totalWeight
        const putPremium = quote.premium + (spot - props.spot) / 2
        if (props.premiums.indicatedPutPremium < putPremium) {
          x1 += shift
          x2 += shift
        } else {
          leftX = x2
        }
        const bottom = parseFloat(spot) - putPremium
        const y2 = layout.height - layout.height * (bottom - minp) / (maxp - minp)
        return <rect key={id} className={"quote" + (quote.color % 8)} x={x1} y={sy} width={x2-x1} height={y2-sy}/>
      })
      var quoteBottom = spot
      if (isNumber(props.premiums.indicatedPutPremium)) quoteBottom -= props.premiums.indicatedPutPremium
      y3 = layout.height - layout.height * (quoteBottom - minp) / (maxp - minp)
      putquoterects.push(<rect key="putquote" id="putquote" x={leftX} y={sy} width={shift} height={y3-sy}/>)
    }
    window.requestAnimationFrame(() => {
      const qty = props.premiums.qty
      if (props.mousestate === MOUSESTATE_CALL) {
        const callprice = props.orderbook.calls.price(qty)
        orderBookCursorPos(qty, props.orderbook.totalWeight[props.dur], props.spot, true, callprice)
      }
      if (props.mousestate === MOUSESTATE_PUT) {
        const putprice = props.orderbook.puts.price(qty)
        orderBookCursorPos(qty, props.orderbook.totalWeight[props.dur], props.spot, false, putprice)
      }
    })
    return <g id="orderbook">
      <g>{callquoterects}</g>
      <g>{putquoterects}</g>
      <line className="spot" x1={layout.chart_ob_left} x2={layout.chart_ob_left+layout.chart_ob_width} y1={sy} y2={sy}/>
    </g>
  }
}

class Chart extends React.Component {
  
  resize() {
    this.forceUpdate()
  }
  
  componentDidMount() {
    window.addEventListener('resize', this.resize.bind(this))
  }
  
  componentWillUnmount() {
    window.removeEventListener('resize', this.resize)
  }
  
  render() {
    const props = this.props
    
    if (!props.loading && props.orderbook) {
      initDynamicView(props)
      //console.log("build background")
      const background = buildBackground(props)
      //console.log("build time grid")
      const timegrid = buildTimeGrid(props)
      //console.log("build price grid")
      const pricegrid = buildPriceGrid(props)
      //console.log("build price overlay")
      const data = buildPriceOverlay(props)
      const info = buildInfoOverlay(props)
      //console.log("build trades overlay")
      const trades = buildTradesOverlay(props)
      //console.log("build orderbook spot")
      const spot = buildOrderbookSpot(props)
      //console.log("build orderbook premiums")
      const prems = buildOrderbookPremiums(props)
      //console.log("build orderbook")
      const orderbook = buildOrderBook(props)
      //console.log("build foreground")
      const foreground = buildForeground(props)
      if (props.dialog.showinline && props.lock !== undefined) {
        if (props.mousestate === MOUSESTATE_QUOTE && props.lock.chart) {
          var chlock = <image href={lock} x={0} y={2} width={16} height={16}/>
        } 
        if ((props.mousestate === MOUSESTATE_CALL || props.mousestate === MOUSESTATE_PUT) && props.lock.orderbook) {
          var oblock = <image href={lock} x={layout.chart_mp_left} y={2} width={16} height={16}/>
        }
        if (props.lock.info) {
          var infolock = <image href={lock} x={layout.info_left} y={2} width={16} height={16}/>
        }
      }
      var chart =
        <div id="chartwrap">
          <svg id="chart" width="640" height="480">
            {background}
            {oblock}
            {timegrid}
            {pricegrid}
            {chlock}
            {trades}
            {data}
            {spot}
            {prems}
            {orderbook}
            {info}
            {infolock}
            {foreground}
          </svg>
        </div>
      return chart
    }
    if (props.selected) {
      return <div id="chartwrap">
        <svg id="chart" width="640" height="480">
        </svg>
      </div>
    }
    return null
  }
}

const mapStateToProps = state => ({
  constants: state.app.constants,
  loading: state.microtick.loading,
  blocktime: state.microtick.blocktime,
  selected: state.microtick.market.selected,
  spot: state.microtick.market.spot,
  data: state.microtick.chart.ticks.data,
  spots: state.microtick.chart.spots.data,
  view: state.microtick.chart.view,
  chartsize: state.microtick.chart.size,
  orderbook: state.microtick.orderbook,
  premiums: state.microtick.premiums,
  dur: state.microtick.market.dur,
  market: state.microtick.market.symbol,
  weight: state.microtick.market.weight,
  trades: state.microtick.trade.list,
  quote: state.microtick.quote,
  mousestate: state.microtick.chart.mouseState,
  mousemove: state.microtick.chart.mouseMove,
  lock: state.microtick.chart.lock,
  dialog: state.dialog
})

const mapDispatchToProps = dispatch => bindActionCreators({
  buyCallDialog, buyPutDialog, placeQuoteDialog, mouseState
}, dispatch)

export default connect(
  mapStateToProps, 
  mapDispatchToProps
)(Chart)
