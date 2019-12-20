import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { mouseState } from '../../modules/microtick'
import { buyCallDialog, buyPutDialog, placeQuoteDialog } from '../../modules/dialog'

// css
import './chart.css'

require('./misc.js')

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

const chartwidth = 1000
const width = 800
const height = 500

// Selected premiums
const chart_mp_left = 800
const chart_mp_width = 10

// Orderbook
const chart_ob_left = 810
const chart_ob_width = 190

var minp
var maxp
var calls
var puts
var dynamicWeight

const buildTimeGrid = props => {
  const view = props.view
  if (props.chartsize === 600) {
    var grids = [ 300, 600 ]
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
  } else if (props.chartsize === 86400) {
    grids = [ 21600, 43200, 64800, 86400 ]
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
      const x = width * ((view.maxb-grid) - view.minb) / (view.maxb - view.minb)
      rules.push(<line key={i} className={clz} x1={x} y1={0} x2={x} y2={height}/>)
      text.push(<text key={i} className="gridtext" x={x+5} y={height-4}>{commonName[grids[i]]}</text>)
    }
    return <g>
      <line className="gridrule" x1={width} y1={0} x2={width} y2={height}/>
      {rules}
      {text}
    </g>
  }
  /*
    <line className="gridrule" x1={x500} y1={0} x2={x500} y2={height}/>
    <text className="gridtext" x={x500+5} y={height-4}>500</text>
    <line className="gridrule" x1={x1000} y1={0} x2={x1000} y2={height}/>
    <text className="gridtext" x={x1000+5} y={height-4}>1000</text>
  */
}

const buildPriceGrid = props => {
  //console.log("minp=" + minp)
  //console.log("maxp=" + maxp)
  var div = height / 40;
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
    const y = height - height * (tic - minp) / (maxp - minp)
    return <g key={i}>
      <line className="gridrule" x1={0} x2={width} y1={y} y2={y}/>
      <text className="gridtext" x="5" y={y-4}>{tic}</text>
    </g>
  })
  return <g className="grid">
    {grids}
  </g>
}

const buildPriceOverlay = props => {
  const view = props.view
  const data = props.data
  //console.log("view=" + JSON.stringify(view))
  //console.log("data=" + JSON.stringify(data))
  const mint = view.now - view.dur
  if (data.length > 0) {
    const points = data.map((p, i) => {
      const x = width * (p.time - mint) / view.dur
      //const x2 = width * (p.block - view.minb) / (view.maxb - view.minb)
      //console.log("x=" + x + " x2=" + x2)
      const y = height - height * (p.value - minp) / (maxp - minp)
      return <circle className="spot" key={i} cx={x} cy={y}/>
    })
    var curx = 0
    if (data.length > 0) {
      var lasty = height - height * (data[0].value - minp) / (maxp - minp)
    } else {
      lasty = height - height * (props.spot - minp) / (maxp - minp)
    }
    const lines = data.map((p, i) => {
      const x = width * (p.time - mint) / view.dur
      //const x = width * (p.block - view.minb) / (view.maxb - view.minb)
      const y = height - height * (p.value - minp) / (maxp - minp)
      const linegr = <g key={i}>
        <line className="spot" key={0} x1={curx} x2={x} y1={lasty} y2={lasty}/>
        <line className="spot" key={1} x1={x} x2={x} y1={lasty} y2={y}/>
      </g>
      curx = x
      lasty = y
      return linegr
    })
    lines.push(<line className="spot" key={data.length+2} x1={curx} x2={width+2} y1={lasty} y2={lasty}/>)
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
    const x1 = width * (t.start.getTime() - mint) / view.dur
    //const x1 = width * (t.startBlock - view.minb) / (view.maxb - view.minb)
    if (t.endBlock !== undefined) {
      var x2 = width * (t.end.getTime() - mint) / view.dur
      //var x2 = width * (t.endBlock - view.minb) / (view.maxb - view.minb)
    } else {
      x2 = width
    }
    const y1 = height - height * (strike - minp) / (maxp - minp)
    const y2 = height - height * (sum - minp) / (maxp - minp)
    const yfinal = height - height * (t.final - minp) / (maxp - minp)
    var clz = t.type === 0 ? "call" : "put"
    const x = x1 < x2 ? x1 : x2
    const y = y1 < y2 ? y1 : y2
    const w = x2 > width ? width - x1 : x2 - x1
    const h = y1 < y2 ? y2 - y1 : y1 - y2
    if (!t.active) clz = "inactive"
    if (x1 === x2) {
      var begin = <line className={clz + " begin"} x1={x1} x2={x1} y1={y1} y2={y2}/>
    }
    if (x2 < width) {
      var end = <g>
        <line className={clz + " tradebase " + t.dir} x1={x2} y1={y1} x2={x2} y2={yfinal}/>
        <line className={clz + " tradebase"} x1={x2-3} x2={x2+3} y1={yfinal-3} y2={yfinal+3}/>
        <line className={clz + " tradebase"} x1={x2-3} x2={x2+3} y1={yfinal+3} y2={yfinal-3}/>
      </g>
    }
    return <g key={i}>
      {begin}
      <rect className={clz} x={x} y={y} width={w} height={h}/>
      <line className={clz + " tradebase " + t.dir} x1={x1} y1={y1} x2={x2 > width ? width : x2} y2={y1}/>
      <circle className={clz} cx={x1} cy={y1}/>
      {end}
    </g>
  })
  return <g>
    {t}
  </g>
}

export const chartCursorPos = function(qty, spot, prem, newspot, chminp) {
  if (typeof spot === 'string') spot = parseFloat(spot)
  if (typeof prem === 'string') prem = parseFloat(prem)
  if (typeof newspot === 'string') newspot = parseFloat(newspot)
  const y = height - (spot - chminp) * height / (maxp - minp)
  const delta = prem * height / (maxp - minp)
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
    qtext.setAttribute('x', width - textProps.width-10)
    qtext.setAttribute('y', y+5)
  }
  const posprem = document.getElementById('posprem')
  if (posprem) {
    //posprem.innerHTML = "Spot + " + Math.round10(prem, -4) + " = " + Math.round10(spot+prem, -4)
    posprem.innerHTML = "⇑ " + Math.round10(prem, -4)
    const textProps = posprem.getBoundingClientRect()
    posprem.setAttribute('x', width - textProps.width-10)
    posprem.setAttribute('y', y-delta-4)
  }
  const negprem = document.getElementById('negprem')
  if (negprem) {
    //negprem.innerHTML = "Spot - " + Math.round10(prem, -4) + " = " + Math.round10(spot-prem, -4)
    negprem.innerHTML = "⇓ " + Math.round10(prem, -4)
    const textProps = negprem.getBoundingClientRect()
    negprem.setAttribute('x', width - textProps.width-10)
    negprem.setAttribute('y', y+delta+14)
  }
  const nstext = document.getElementById('rightamt')
  if (nstext) {
    const nsy = height - height * (newspot - minp) / (maxp - minp)
    nstext.innerHTML = "New spot=@" + Math.round10(newspot, -4)
    nstext.setAttribute('x', chart_ob_left + 5)
    nstext.setAttribute('y', nsy + 5)
  }
}

export const orderBookCursorPos = function(qty, totalqty, spot, iscall, price, maxp, minp) {
  const cursx = document.getElementById('cursorx')
  const cx = chart_ob_left + qty * chart_ob_width / totalqty
  if (isNaN(cx)) return
  if (cursx) {
    cursx.setAttribute('y1', 0)
    cursx.setAttribute('y2', height) 
    cursx.setAttribute('x1', cx)
    cursx.setAttribute('x2', cx) 
  }
  const cursy = document.getElementById('cursory')
  if (cursy) {
    if (iscall) {
      const cy = height - height * (spot + price - minp) / (maxp - minp)
      cursy.setAttribute('y1', cy)
      cursy.setAttribute('y2', cy)
    } else {
      const py = height - height * (spot - price - minp) / (maxp - minp)
      cursy.setAttribute('y1', py)
      cursy.setAttribute('y2', py)
    }
  }
  const otext = document.getElementById('rightamt')
  if (otext) {
    const sy = height - height * (parseFloat(spot) - minp) / (maxp - minp)
    otext.innerHTML = "⚖ " + Math.round10(qty, -4)
    const textProps = otext.getBoundingClientRect()
    if (cx + textProps.width + 5 > chartwidth) {
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
      const cy = height - height * (cp - minp) / (maxp - minp)
      ctext.innerHTML = "⇑ " + Math.round10(price, -4)
      const textProps = ctext.getBoundingClientRect()
      ctext.setAttribute('x', width - textProps.width - 5)
      ctext.setAttribute('y', cy + 5)
    } else {
      const pp = parseFloat(spot) - price / 2 
      const py = height - height * (pp - minp) / (maxp - minp)
      ctext.innerHTML = "⇓ " + Math.round10(price, -4)
      const textProps = ctext.getBoundingClientRect()
      ctext.setAttribute('x', width - textProps.width - 5)
      ctext.setAttribute('y', py + 5)
    }
  }
  const costamt = document.getElementById('costamt')
  if (costamt) {
    if (iscall) {
      const cp = parseFloat(spot) + price
      const cy = height - height * (cp - minp) / (maxp - minp)
      costamt.innerHTML = Math.round10(qty * price, -4) + " fox"
      const textProps = costamt.getBoundingClientRect()
      if (cx + textProps.width / 2 > chartwidth) {
        costamt.setAttribute('x', cx - textProps.width - 5)
      } else if (cx - textProps.width / 2 - 5 < chart_ob_left) {
        costamt.setAttribute('x', cx + 5)
      } else {
        costamt.setAttribute('x', cx - textProps.width / 2 - 5)
      }
      costamt.setAttribute('y', cy - 4)
    } else {
      const pp = parseFloat(spot - price)
      const py = height - height * (pp - minp) / (maxp - minp)
      costamt.innerHTML = Math.round10(qty * price, -4) + " fox"
      const textProps = costamt.getBoundingClientRect()
      if (cx + textProps.width / 2 > chartwidth) {
        costamt.setAttribute('x', cx - textProps.width - 5)
      } else if (cx - textProps.width / 2 - 5 < chart_ob_left) {
        costamt.setAttribute('x', cx + 5)
      } else {
        costamt.setAttribute('x', cx - textProps.width / 2 - 5)
      }
      costamt.setAttribute('y', py + 14)
    }
  }
}

const buildBackground = props => {
  if (props.orderbook) {
    const chMouseEnter = event => {
      if (props.dialog.showinline) return
      props.mouseState(1)
    }
    const chMouseLeave = event => {
      if (props.dialog.showinline) return
      props.mouseState(0)
    }
    const chMouseMove = event => {
      if (props.dialog.showinline) return
      
      const sy = height - height * (props.spot - minp) / (maxp - minp)
      var bounds = event.target.getBoundingClientRect()
      var delta = (width - event.clientX + bounds.left + 1) / 4
      var y = event.clientY - bounds.top
      
      const backing = parseFloat(props.quote.backing)
      var price = minp - (y - height) * (maxp - minp) / height
      var prem = delta * (maxp - minp) / height
      
      const back = isNaN(props.orderbook.totalBacking[props.dur]) ? 0 : props.orderbook.totalBacking[props.dur]
      const wt = isNaN(props.orderbook.totalWeight[props.dur]) ? 0 : props.orderbook.totalWeight[props.dur]
      const partialprem = wt === 0 ? 0 : back / (props.constants.LEVERAGE * wt)      
      
      if (prem > partialprem * 2) {
        prem = partialprem * 2
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
    
    const obMouseEnter = event => {
      if (props.dialog.showinline) return
      var bounds = event.target.getBoundingClientRect()
      const y = event.clientY - bounds.top
      const sy = height - height * (parseFloat(props.spot) - minp) / (maxp - minp)
      if (y <= sy) {
        props.mouseState(2)
      } else {
        props.mouseState(3)
      }
    }
    const obMouseLeave = event => {
      if (props.dialog.showinline) return
      props.mouseState(0)
    }
    const obMouseMove = event => {
      if (props.dialog.showinline) return
      var bounds = event.target.getBoundingClientRect()
      const x = event.clientX - bounds.left + chart_ob_left
      const y = event.clientY - bounds.top
      const qty = (x - chart_ob_left) * props.orderbook.totalWeight[props.dur] / chart_ob_width
      const sy = height - height * (parseFloat(props.spot) - minp) / (maxp - minp)
      const callprice = props.orderbook.calls.price(qty)
      const putprice = props.orderbook.puts.price(qty)
      if (y <= sy) {
        props.mouseState(2)
        props.orderbook.setBuyPremium(qty, true)
      } else {
        props.mouseState(3)
        props.orderbook.setBuyPremium(qty, false)
      }
      orderBookCursorPos(qty, props.orderbook.totalWeight[props.dur], parseFloat(props.spot), y <= sy, y <= sy ? callprice : putprice, 
        maxp, minp)
    }
    const obMouseClick = event => {
      if (props.dialog.showinline) return
      var bounds = event.target.getBoundingClientRect()
      const y = event.clientY - bounds.top
      const sy = height - height * (parseFloat(props.spot) - minp) / (maxp - minp)
      if (y <= sy) {
        props.buyCallDialog()
      } else {
        props.buyPutDialog()
      }
    }
    
    return <g>
      <rect id="chartback" x={0} width={width} y={0} height={height}
        onMouseEnter={chMouseEnter} onMouseLeave={chMouseLeave} 
        onMouseMove={chMouseMove} onClick={chMouseClick}/>
      <rect id="obback" x={chart_ob_left} y={0} width={chart_ob_width} height={height}
        onMouseEnter={obMouseEnter} onMouseLeave={obMouseLeave} 
        onMouseMove={obMouseMove} onClick={obMouseClick}/>
    </g>
  }
}

const buildForeground = props => {
  if (props.mousestate === 1) {
    var ret = <g>
      <line id="quotecursor" className="cursor" x1={0} y1={0} x2={width} y2={0}/>
      <line id="qctop" className="cursor" x1={0} y1={0} x2={width} y2={0}/>
      <line id="qcbottom" className="cursor" x1={0} y1={0} x2={width} y2={0}/>
      <text id="qcspot" className="ordertip" x={0} y={0}></text>
      <text id="posprem" className="ordertip" x={0} y={0}></text>
      <text id="negprem" className="ordertip" x={0} y={0}></text>
    </g>
  }
  if (props.mousestate === 2 || props.mousestate === 3) {
    ret = <g>
      <line id="cursorx" className="cursor" x1={chart_ob_left} y1={0} x2={chart_ob_left} y2={height}/>
      <line id="cursory" className="cursor" x1={chart_ob_left} y1={0} x2={chart_ob_left + chart_ob_width -1} y2={0}/>
      <text id="leftamt" className="ordertip" x={0} y={0}></text>
      <text id="rightamt" className="ordertip" x={0} y={0}></text>
      <text id="costamt" className="ordertip" x={0} y={0}></text>
    </g>
  }
  return ret
}

const buildOrderbookSpot = props => {
  const sy = height - height * (props.spot - minp) / (maxp - minp)
  const mid = chart_mp_left + chart_mp_width / 2
  const right = chart_mp_left + chart_mp_width
  if (props.premiums) {
    if (props.premiums.buy || props.mousestate !== 1) {
      var spot = parseFloat(props.spot)
      var yspot = height - height * (spot - minp) / (maxp - minp)
      return <g id="spotpointer">
        <line x1={chart_mp_left} y1={sy} x2={right} y2={sy}/>
        <line x1={right} y1={sy} x2={right-3} y2={sy+3}/>
        <line x1={right} y1={sy} x2={right-3} y2={sy-3}/>
      </g>
    } else {
      spot = props.premiums.indicatedSpot
      if (spot === undefined) spot = props.spot
      yspot = height - height * (spot - minp) / (maxp - minp)
      return <g id="spotpointer">
        <line x1={chart_mp_left} x2={mid} y1={sy} y2={sy}/>
        <line x1={mid} y1={yspot} x2={mid} y2={sy}/>
        <line x1={mid} y1={yspot} x2={right} y2={yspot}/>
        <line x1={right} y1={yspot} x2={right-3} y2={yspot-3}/>
        <line x1={right} y1={yspot} x2={right-3} y2={yspot+3}/>
      </g>
    }
  }
}

const buildOrderbookPremiums = props => {
  const premiums = props.premiums
  if (premiums && props.mousestate > 1) {
    if (premiums.buy) {
      var spot = props.spot
    } else {
      spot = premiums.indicatedSpot
    }
    const view = props.view
    
    // Spot
    const sy = height - height * (spot - minp) / (maxp - minp)
    // Call
    if (premiums.indicatedCallPremium !== undefined) {
      const top = spot + parseFloat(premiums.indicatedCallPremium)
      var y2 = height - height * (top - minp) / (maxp - minp)
      var call = <rect id="ordercall" className="premcall" x={chart_mp_left} y={y2} width={chart_mp_width} height={sy-y2}/>
    }
    // Put
    if (premiums.indicatedPutPremium !== undefined) {
      const bottom = spot - parseFloat(premiums.indicatedPutPremium)
      y2 = height - height * (bottom - minp) / (maxp - minp)
      var put = <rect id="orderput" className="premput" x={chart_mp_left} y={sy} width={chart_mp_width} height={y2-sy}/>
    }
    return <g id="selprem">
      {call}
      {put}
    </g>
  }
}

const initDynamicView = props => {
  const view = props.view
  minp = parseFloat(view.minp)
  maxp = parseFloat(view.maxp)
  if (props.orderbook) {
    if (props.mousestate === 1) {
      // check quote heights
      var spot = props.premiums.indicatedSpot
      calls = props.orderbook.calls.quotes.map(quote => {
        const top = spot + quote.premium - (spot - props.spot) / 2
        if (top > maxp) maxp = top
        return quote
      })
      puts = props.orderbook.puts.quotes.map(quote => {
        const bottom = spot - quote.premium  - (spot - props.spot) / 2
        if (bottom < minp) minp = bottom
        return quote
      })
      // check top / bottom quote premiums
      const upper = props.premiums.qs + props.premiums.prem
      const lower = props.premiums.qs - props.premiums.prem
      if (upper > maxp) maxp = upper
      if (lower < minp) minp = lower
    } else {
      calls = props.orderbook.calls.quotes
      puts = props.orderbook.puts.quotes
    }
  }
  var height = maxp - minp
  if (height === 0) height = 1
  minp = minp - height * .05
  maxp = maxp + height * .05
}

const buildOrderBook = props => {
  if (props.orderbook) {
    if (props.premiums.buy || props.mousestate !== 1) {
      var spot = props.spot
      var sy = height - height * (spot - minp) / (maxp - minp)
      var callquoterects = calls.map((quote, id) => {
        const x1 = chart_ob_left + quote.q1 * chart_ob_width / props.orderbook.totalWeight[props.dur]
        const x2 = chart_ob_left + quote.q2 * chart_ob_width / props.orderbook.totalWeight[props.dur] 
        const top = parseFloat(spot) + quote.premium
        const y2 = height - height * (top - minp) / (maxp - minp)
        return <rect key={id} className={"quote" + (quote.id % 8)} x={x1} y={y2} width={x2-x1} height={sy-y2}/>
      })
      var putquoterects = puts.map((quote, id) => {
        const x1 = chart_ob_left + quote.q1 * chart_ob_width / props.orderbook.totalWeight[props.dur]
        const x2 = chart_ob_left + quote.q2 * chart_ob_width / props.orderbook.totalWeight[props.dur]
        const bottom = parseFloat(spot) - quote.premium
        const y2 = height - height * (bottom - minp) / (maxp - minp)
        return <rect key={id} className={"quote" + (quote.id % 8)} x={x1} y={sy} width={x2-x1} height={y2-sy}/>
      })
    } else {
      spot = props.premiums.indicatedSpot
      if (spot === undefined) spot = props.spot
      sy = height - height * (spot - minp) / (maxp - minp)
      const totalWeight = parseFloat(props.orderbook.totalWeight[props.dur]) + dynamicWeight
      const shift = chart_ob_width * dynamicWeight / totalWeight
      var leftX = chart_ob_left
      callquoterects = calls.map((quote, id) => {
        var x1 = chart_ob_left + quote.q1 * chart_ob_width / totalWeight
        var x2 = chart_ob_left + quote.q2 * chart_ob_width / totalWeight
        const callPremium = quote.premium - (spot - props.spot) / 2
        if (props.premiums.indicatedCallPremium < callPremium) {
          x1 += shift
          x2 += shift
        } else {
          leftX = x2
        }
        const top = parseFloat(spot) + callPremium
        const y2 = height - height * (top - minp) / (maxp - minp)
        return <rect key={id} className={"quote" + (quote.id % 8)} x={x1} y={y2} width={x2-x1} height={sy-y2}/>
      })
      const quoteTop = spot + parseFloat(props.premiums.indicatedCallPremium)
      var y3 = height - height * (quoteTop - minp) / (maxp - minp)
      callquoterects.push(<rect key="callquote" id="callquote" x={leftX} y={y3} width={shift} height={sy-y3}/>)
      leftX = chart_ob_left
      putquoterects = puts.map((quote, id) => {
        var x1 = chart_ob_left + quote.q1 * chart_ob_width / totalWeight
        var x2 = chart_ob_left + quote.q2 * chart_ob_width / totalWeight
        const putPremium = quote.premium + (spot - props.spot) / 2
        if (props.premiums.indicatedPutPremium < putPremium) {
          x1 += shift
          x2 += shift
        } else {
          leftX = x2
        }
        const bottom = parseFloat(spot) - putPremium
        const y2 = height - height * (bottom - minp) / (maxp - minp)
        return <rect key={id} className={"quote" + (quote.id % 8)} x={x1} y={sy} width={x2-x1} height={y2-sy}/>
      })
      const quoteBottom = spot - parseFloat(props.premiums.indicatedPutPremium)
      y3 = height - height * (quoteBottom - minp) / (maxp - minp)
      putquoterects.push(<rect key="putquote" id="putquote" x={leftX} y={sy} width={shift} height={y3-sy}/>)
    }
    return <g id="orderbook" viewBox="-10 -10 120 110">
      <g>{callquoterects}</g>
      <g>{putquoterects}</g>
      <line className="spot" x1={chart_ob_left} x2={chart_ob_left+chart_ob_width} y1={sy} y2={sy}/>
    </g>
  }
}

const Chart = props => {
  //if (props.selected && props.spot !== undefined && maxp > minp) {
  if (!props.loading) {
    initDynamicView(props)
    //console.log("build background")
    const background = buildBackground(props)
    //console.log("build time grid")
    const timegrid = buildTimeGrid(props)
    //console.log("build price grid")
    const pricegrid = buildPriceGrid(props)
    //console.log("build price overlay")
    const data = buildPriceOverlay(props)
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
    var chart =
      <div>
        <svg id="chart" width={chartwidth} height={height}>
          {background}
          {timegrid}
          {pricegrid}
          {trades}
          {data}
          {prems}
          {orderbook}
          {spot}
          {foreground}
        </svg>
      </div>
    return chart
  } else if (props.selected) {
    return <div>
      <svg id="chart" width={chartwidth} height={height}>
        <text x={chartwidth/2-50} y={height/2} className="loading">Loading...</text>
      </svg>
    </div>
  }
  return null
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
  dialog: state.dialog
})

const mapDispatchToProps = dispatch => bindActionCreators({
  buyCallDialog, buyPutDialog, placeQuoteDialog, mouseState
}, dispatch)

export default connect(
  mapStateToProps, 
  mapDispatchToProps
)(Chart)

