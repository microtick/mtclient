import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { button10, button25, button50, button100, buttonfirst, prevButton, nextButton, buttonlast,
    viewAccount, viewQuote, viewTrade, updateQuote } from '../../modules/history'
import { selectMarket } from '../../modules/microtick'

import './index.css'
import hatched from './hatched.png'
import dashed from './dashed.png'
import consensus from './consensus.png'

const commonName = {
  "5minute": "5 Minutes",
  "15minute": "15 Minutes",
  "1hour": "1 Hour",
  "4hour": "4 Hours",
  "12hour": "12 Hours"
}

function buildPageAccountHistory(props) {
  const data = props.history.data
  var startingBalance = 0
  var endingBalance = 0
  if (data.list.length > 0) {
    startingBalance = Math.round10(data.list[0].balance + data.list[0].debit - data.list[0].credit, -6)
    endingBalance = Math.round10(data.list[data.list.length-1].balance, -6)
  }
  var list = data.list.map((c,n) => {
    const viewTrade = <td><button onClick={() => props.viewTrade(c.id)}>T-{c.id}</button></td>
    //const viewTrade = <td>T-{c.id}</td>
    const viewQuote = <td><button onClick={() => props.viewQuote(c.id)}>Q-{c.id}</button></td>
    //const viewQuote = <td>Q-{c.id}</td>
    const ct = <td><span className="count">{n + (data.page-1) * data.pageInc + 1}</span></td>
    const balance = Math.round10(c.balance, -6)
    const amount = Math.round10(c.amount, -6)
    switch (c.type) {
      case 'trade.long':
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.block}</td>
          <td>Buy {c.ttype ? "Put" : "Call"}</td>
          {viewTrade}
          <td><button onClick={() => props.selectMarket(c.market)}>{c.market}</button></td>
          <td>{commonName[c.dur]}</td>
          <td>{amount} fox</td>
          <td>{c.commission} fox</td>
          <td>{Math.round10(c.debit, -6)} fox</td>
          <td>---</td>
          <td>{balance} fox</td>
        </tr>
      case 'trade.short':
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.block}</td>
          <td>Sell {c.ttype ? "Put" : "Call"}</td>
          {viewTrade}
          <td><button onClick={() => props.selectMarket(c.market)}>{c.market}</button></td>
          <td>{commonName[c.dur]}</td>
          <td>{amount} fox</td>
          <td>---</td>
          <td>---</td>
          <td>{Math.round10(c.credit, -6)} fox</td>
          <td>{balance} fox</td>
        </tr>
      case 'settle.long':
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.block}</td>
          <td>Settle Long</td>
          {viewTrade}
          <td colSpan={2}></td>
          <td>{amount} fox</td>
          <td>---</td>
          <td>---</td>
          <td>{Math.round10(c.credit, -6)} fox</td>
          <td>{balance} fox</td>
        </tr>
      case 'settle.short':
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.block}</td>
          <td>Settle Refund</td>
          {viewTrade}
          <td colSpan={2}></td>
          <td>{amount} fox</td>
          <td>---</td>
          <td>---</td>
          <td>{Math.round10(c.credit, -6)} fox</td>
          <td>{balance} fox</td>
        </tr>
      case 'deposit':
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.block}</td>
          <td>Deposit</td>
          <td colSpan={3}></td>
          <td>{amount} fox</td>
          <td>---</td>
          <td>---</td>
          <td>{c.credit} fox</td>
          <td>{balance} fox</td>
        </tr>
      case 'quote.create':
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.block}</td>
          <td>Create Quote</td>
          {viewQuote}
          <td><button onClick={() => props.selectMarket(c.market)}>{c.market}</button></td>
          <td>{commonName[c.dur]}</td>
          <td>{amount} fox</td>
          <td>{c.commission} fox</td>
          <td>{c.debit} fox</td>
          <td>---</td>
          <td>{balance} fox</td>
        </tr>
      case 'quote.deposit':
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.block}</td>
          <td>Deposit Backing</td>
          {viewQuote}
          <td colSpan={2}></td>
          <td>{amount} fox</td>
          <td>{c.commission} fox</td>
          <td>{c.debit} fox</td>
          <td>---</td>
          <td>{balance} fox</td>
        </tr>
      case 'quote.update':
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.block}</td>
          <td>Update Quote</td>
          {viewQuote}
          <td colSpan={2}></td>
          <td>---</td>
          <td>{c.commission} fox</td>
          <td>{c.debit} fox</td>
          <td>---</td>
          <td>{balance} fox</td>
        </tr>
      case 'quote.cancel':
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.block}</td>
          <td>Cancel Quote</td>
          {viewQuote}
          <td colSpan={2}></td>
          <td>{amount} fox</td>
          <td>---</td>
          <td>---</td>
          <td>{c.credit} fox</td>
          <td>{balance} fox</td>
        </tr>
      default:
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.block}</td>
          <td>{c.type}</td>
        </tr>
    }
  })
  var content = <div>
    <table>
      <thead>
        <tr>
          <td></td>
          <td>Block</td>
          <td>Transaction</td>
          <td>ID</td>
          <td>Market</td>
          <td>Duration</td>
          <td>Amount</td>
          <td>Commission</td>
          <td>Debit</td>
          <td>Credit</td>
          <td>Balance</td>
        </tr>
      </thead>
      <tbody>
        <tr className="even">
          <td colSpan={2}></td>
          <td>Starting Balance</td>
          <td colSpan={7}></td>
          <td>{startingBalance} fox</td>
        </tr>
        {list}
        <tr className={data.list.length%2?'even':'odd'}>
          <td colSpan={2}></td>
          <td>Ending Balance</td>
          <td colSpan={7}></td>
          <td>{endingBalance} fox</td>
        </tr>
      </tbody>
    </table>
  </div>
  content = <div>
    <div>
      <span>Transactions per page </span>
      <button onClick={props.button10}>10</button>
      <button onClick={props.button25}>25</button>
      <button onClick={props.button50}>50</button>
      <button onClick={props.button100}>100</button>
    </div>
    <div>
      <button onClick={props.buttonfirst}>First</button>
      <button onClick={props.prevButton}>Prev</button>
      <button onClick={props.nextButton}>Next</button>
      <button onClick={props.buttonlast}>Last</button>
    </div>
    {content}
  </div>
  var title = <div>
    <h3>Account History</h3>
    <h4>Transaction history page {data.page} of {data.total}</h4>
  </div>
  return {
    content: content,
    title: title
  }
}

function buildPageTradeHistory(props) {
  const data = props.history.data.info
  if (data === undefined) {
    // we are still loading
    var title = <h3>Loading...</h3>
  } else {
    title = <h3>Trade T-{props.history.data.id}</h3>
    
    // Calculate trade parameters
    
    const strike = data.trade.strike
    const qty = data.trade.quantity
    const premium = data.trade.premium
    const unitpremium = Math.round10(premium / qty, -6)
    const backing = data.trade.counterparties.reduce((sum, cp) => {
      return Math.round10(sum + cp.backing, -6)
    }, 0)
    const maxpayout = Math.round10(backing / premium, -6)
    var cost = <span className="highlight padright">{premium} fox</span>
    if (data.endBlock !== undefined) {
      var settle = data.end
      var profit = data.trade.settle
      var refund = data.trade.counterparties.reduce((acc, cp) => {
        return acc + cp.settle
      }, 0)
      var net = Math.round10(profit - premium, -6)
      var fv = <span className="highlight padright">{profit} fox</span>
      var np = <span className="highlight padright">{net} fox</span>
      var settlePrice = <tr>
        <td className="rowlabel">Settle price</td>
        <td className="spacer"></td>
        <td className="rowvalue">@{settle}</td>
      </tr>
      var backingrefund = <p>Backing refunded: {refund} fox</p>
    } else {
      fv = <span className="padright">(in progress)</span>
      np = <span className="padright">(in progress)</span>
    }
    
    // Trade highlights - timing / price / backing
    
    if (data.endBlock !== undefined) {
      var endblock = <p>End block: {data.endBlock}</p>
    }
    if (data.trade.type === 0) {
      var direction = "⇑"
      var profitable = Math.round10(strike + unitpremium, -6)
    } else {
      direction = "⇓"
      profitable = Math.round10(strike - unitpremium, -6)
    }
    const metrics = <div className="metrics">
      <p>Cost: {cost} Final Value: {fv} Net Profit: {np}</p>
      <div className="statsblock">
        <h5>Timing</h5>
        <p>Start Time: {new Date(data.trade.start*1000).toLocaleString()}</p>
        <p>End Time: {new Date(data.trade.expiration*1000).toLocaleString()}</p>
        <p>Start Block: {data.startBlock}</p>
        {endblock}
      </div>
      <div className="statsblock">
        <h5>Contract Details</h5>
        <p>Quantity: ⚖ {qty}</p>
        <table>
          <tbody>
            <tr>
              <td className="rowlabel">Strike</td>
              <td className="spacer"></td>
              <td className="rowvalue">@{strike}</td>
            </tr>
            <tr>
              <td className="rowlabel">Profitable if:</td>
              <td className="spacer"></td>
              <td className="rowvalue">{direction} {unitpremium}</td>
            </tr>
            <tr>
              <td className="rowlabel">Profit Threshold</td>
              <td className="spacer"></td>
              <td className="rowvalue">@{profitable}</td>
            </tr>
            {settlePrice}
          </tbody>
        </table>
      </div>
      <div className="statsblock">
        <h5>Backing</h5>
        <p>Trade Backing: {backing} fox</p>
        <p>Max Payout: {maxpayout} : 1</p>
        {backingrefund}
      </div>
    </div>
    
    // Trade chart
    
    const LEFT = 100
    const WIDTH = 500
    const HEIGHT = 320
    const TOP = 300
    const timeGrid = buildTimeGrid(LEFT, data.trade.dur, WIDTH, HEIGHT)
    const priceGrid = buildPriceGrid(LEFT + WIDTH, TOP, data.history.minp, data.history.maxp)
    const tradeEnd = data.endBlock === undefined ? data.startBlock + data.trade.dur : data.endBlock
    if (data.trade.type === 0) {
      const top = strike + unitpremium
      var minp = data.history.minp
      var maxp = data.history.maxp > top ? data.history.maxp : top
    } else {
      const bottom = strike - unitpremium
      minp = data.history.minp < bottom ? data.history.minp : bottom
      maxp = data.history.maxp
    }
    const hist = buildTradeHistoryChart(data, x => {
      return 5 + LEFT + (WIDTH - 10) * (x - data.startBlock) / (tradeEnd - data.startBlock)
    }, y => {
      return (TOP - 5) - (TOP - 10) * (y - minp) / (maxp - minp)
    })
    const chart = <div className="tradesvg">
      <h4>Trade History</h4>
      <svg id="tradehist" width={WIDTH} height={HEIGHT}>
        {priceGrid}
        {timeGrid}
        {hist}
      </svg>
    </div>
    
    // Cost breakdown table
    
    if (data.trade.type === 0) {
      var deltaDescription = "Quoted Spot - Strike"
    } else {
      deltaDescription = "Strike - Quoted Spot"
    }
    const costbreakdownrows = data.trade.counterparties.map((cp,n) => {
      const spot = cp.qparams.spot
      const qty = cp.qparams.quantity
      const prem = cp.qparams.premium
      const mqty = cp.quantity
      const mprem = Math.round10(cp.premium / mqty, -6)
      if (data.trade.type === 0) {
        var delta = Math.round10(spot - strike, props.constants.SPOT_PRECISION)
      } else {
        delta = Math.round10(strike - spot, props.constants.SPOT_PRECISION)
      }
      if (delta >= 0) {
        var discount = <td className="col4">+{delta/2}</td>
      } else {
        discount = <td className="col4">{delta/2}</td>
      }
      return <tr key={n}>
        <td className="col1 section-right"><button onClick={() => props.viewQuote(cp.quoteId)}>Q-{cp.quoteId}</button></td>
        <td className="col2">⚖ {qty}</td>
        <td className="col2 section-right">⚖ {mqty}</td>
        <td className="col3">@{spot}</td>
        <td className="col3 section-right">Δ {delta}</td>
        <td className="col4">⇕ {prem}</td>
        {discount}
        <td className="col4 section-right">{data.trade.type === 0 ? "⇑" : "⇓"} ={mprem}</td>
        <td className="col5">{Math.round10(cp.premium, -6)} fox</td>
      </tr>
    })
    const costbreakdown = <table>
      <thead className="section-left section-right">
        <tr className="section-top section-bottom">
          <td className="col1 section-right">Quote ID</td>
          <td colSpan={2} className="col2 section-right">Quantity</td>
          <td colSpan={2} className="col3 section-right">Spot</td>
          <td colSpan={3} className="col4 section-right">Premium</td>
          <td className="col5">Cost</td>
        </tr>
        <tr>
          <td className="col1 section-right"></td>
          <td className="col2">Available</td>
          <td className="col2 section-right">Matched</td>
          <td className="col3">Quoted Spot</td>
          <td className="col3 section-right">Consensus Deviation</td>
          <td className="col4">Quoted Premium</td>
          <td className="col4">Discount / Increase</td>
          <td className="col4 section-right">Actual Premium</td>
          <td className="col5"></td>
        </tr>
        <tr className="section-bottom">
          <td className="col1 section-right"></td>
          <td className="col2 section-right" colSpan={2}></td>
          <td className="col3"></td>
          <td className="col3 section-right">({deltaDescription})</td>
          <td className="col4"></td>
          <td className="col4">(Deviation / 2)</td>
          <td className="col4 section-right"></td>
          <td className="col5">(Matched Qty * Actual Premium)</td>
        </tr>
      </thead>
      <tbody className="section-left section-right">
        {costbreakdownrows}
      </tbody>
      <tfoot>
        <tr className="spacer">
          <td colSpan={9}></td>
        </tr>  
        <tr>
          <td></td>
          <td>Total Qty</td>
          <td className="col2 total">⚖ {qty}</td>
          <td colSpan={4}></td>
          <td>Total Cost</td>
          <td className="col5 total">{premium} fox</td>
        </tr>
      </tfoot>
    </table>
    
    // P/L Summary

    if (data.endBlock !== undefined) {
      var totalpayout = <td className="col6 total">{profit} fox</td>
    } else {
      totalpayout = <td className="col6 total">in progress</td>
    }
    const plsummaryrows = data.trade.counterparties.map((cp, n) => {
      const qty = cp.qparams.quantity
      const mqty = cp.quantity
      const qbacking = cp.backing
      const qrefund = cp.settle
      const qsettle = Math.round10((qbacking - qrefund), -6)
      const longpl = 100 * (qsettle - cp.premium) / cp.premium
      const shortpl = 100 * (cp.premium - qsettle) / qbacking
      if (data.endBlock !== undefined) {
        var cprefund = <td className="col6">{qrefund} fox</td>
        var cppayout = <td className="col6 section-right">{qsettle} fox</td>
        var cplongpl = <td className="col7">{Math.round10(longpl, -2)} %</td>
        var cpshortpl = <td className="col7 section-right">{Math.round10(shortpl, -2)} %</td>
      } else {
        cprefund = <td className="col6">in progress</td>
        cppayout = <td className="col6 section-right">in progress</td>
        cplongpl = <td className="col7">in progress</td>
        cpshortpl = <td className="col7 section-right">in progress</td>
      }
      return <tr key={n}>
        <td className="col1 section-right"><button onClick={() => props.viewQuote(cp.quoteId)}>Q-{cp.quoteId}</button></td>
        <td className="col2">⚖ {qty}</td>
        <td className="col2 section-right">⚖ {mqty}</td>
        <td className="col5 section-right">{cp.premium} fox</td>
        <td className="col6">{qbacking} fox</td>
        {cprefund}
        {cppayout}
        {cplongpl}
        {cpshortpl}
      </tr>
    })
    const plsummary = <table>
      <thead className="section-left section-right">
        <tr className="section-top section-bottom">
          <td className="col1 section-right">Quote ID</td>
          <td colSpan={2} className="col2 section-right">Quantity</td>
          <td className="col5 section-right">Cost</td>
          <td colSpan={3}className="col6 section-right">Settlement</td>
          <td colSpan={2} className="col7 section-right">ROI</td>
        </tr>
        <tr className="section-bottom">
          <td className="col1 section-right"></td>
          <td className="col2">Available</td>
          <td className="col2 section-right">Matched</td>
          <td className="col5 section-right"></td>
          <td className="col6">Backing</td>
          <td className="col6">Refunded</td>
          <td className="col6 section-right">Payout</td>
          <td className="col7">Long</td>
          <td className="col7 section-right">Short</td>
        </tr>
      </thead>
      <tbody className="section-left section-right">
        {plsummaryrows}
      </tbody>
      <tfoot>
        <tr className="spacer">
          <td colSpan={9}></td>
        </tr>  
        <tr>
          <td></td>
          <td>Total Qty</td>
          <td className="col2 total">⚖ {qty}</td>
          <td colSpan={2}></td>
          <td>Total Payout</td>
          {totalpayout}
          <td colSpan={2}></td>
        </tr>
      </tfoot>
    </table>
    
    // Page content
    
    var content = <div>
      <h4>{data.trade.type ? "Put" : "Call"} {data.trade.market} / {commonName[data.trade.dur]} : Trade {data.state}</h4>
      <div className="traderow">
        {metrics}
        {chart}
      </div>
      <h4>Cost Breakdown - per counterparty</h4>
      <div className="traderow">
        {costbreakdown}
      </div>
      <h4>Profit / Loss Summary - per counterparty</h4>
      <div className="traderow">
        {plsummary}
      </div>
    </div>
    
  }
  return {
    nav: <button onClick={props.viewAccount}>Account History</button>,
    title: title,
    content: content
  }
}

function buildPageQuoteHistory(props) {
  const data = props.history.data.info
  const quoteid = props.history.data.id
  var nav = <button onClick={props.viewAccount}>Account History</button>
  var title = <h3>Quote Q-{quoteid}</h3>
  const LEFT = 100
  const WIDTH = 800
  const HEIGHT = 600
  const TOP = 580
  const timeGrid = buildTimeScale(data.start, data.end, WIDTH, HEIGHT)
  const priceGrid = buildPriceGrid(LEFT + WIDTH, TOP, data.minp, data.maxp)
  const hist = buildQuoteHistoryChart(data, props.history.data.view, x => {
    return 5 + LEFT + (WIDTH - 10) * (x - data.start) / (data.end - data.start)
  }, y => {
    return (TOP - 5) - (TOP - 10) * (y - data.minp) / (data.maxp - data.minp)
  })
  var content = <div>
    <div className="quoterow">
      <div className="metrics">
        <h4>{data.market} / ■ {data.dur} : Quote {data.state}</h4>
      </div>
      <div id="quotechart">
        <div id="quotesvg">
          <h4>Quote History</h4>
          <p>History from block {data.start} to {data.end}</p>
          <svg id="quotehist" width={WIDTH} height={HEIGHT}>
            {priceGrid}
            {timeGrid}
            <line x1={5+LEFT} y1={0} x2={5+LEFT} y2={HEIGHT}/>
            {hist}
          </svg>
        </div>
        <div id="legend">
          <h4>Legend</h4>
          <table>
            <thead>
              <tr>
                <td>Symbol</td>
                <td>Description</td>
                <td>View</td>
                <td>Notes</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><img src={dashed} alt="dashed"/></td>
                <td>Quoted spot</td>
                <td>
                  <input type="checkbox" id="view-quote-spot" name="legend-controls" checked={props.history.data.view.quotespot} onChange={() => props.updateQuote('quotespot')}/>
                </td>
                <td className="description">Dashed yellow line is the spot price quoted by the market maker for this quote only. Changing the spot usually causes a consensus price change as well.</td>
              </tr>
              <tr>
                <td><img src={hatched} alt="hatched"/></td>
                <td>Quoted premium</td>
                <td>
                  <input type="checkbox" id="view-quote-premiums" name="legend-controls" checked={props.history.data.view.quotepremiums} onChange={() => props.updateQuote('quotepremiums')}/>
                </td>
                <td className="description">Diagonal hashed area indicates the magnitude of the quoted premium. Note this is always symmetrical vertically around the quoted spot.</td>
              </tr>
              <tr>
                <td><img src={consensus} alt="consensus"/></td>
                <td>Consensus price</td>
                <td>
                  <input type="checkbox" id="view-consensus" name="legend-controls" checked={props.history.data.view.consensus} onChange={() => props.updateQuote('consensus')}/>
                </td>
                <td className="description">White line indicates the weighted average consensus spot price calculated from all quotes on the marketplace.</td>
              </tr>
              <tr>
                <td><div id="legendcallprem"></div></td>
                <td>Call Premium</td>
                <td>
                  <input type="checkbox" id="view-call-premiums" name="legend-controls" checked={props.history.data.view.callpremiums} onChange={() => props.updateQuote('callpremiums')}/>
                </td>
                <td className="description">Market adjusted premium for calls the market maker would receive if a trade were placed at that time with a strike at the current consensus price.</td>
              </tr>
              <tr>
                <td><div id="legendputprem"></div></td>
                <td>Put Premium</td>
                <td>
                  <input type="checkbox" id="view-put-premiums" name="legend-controls" checked={props.history.data.view.putpremiums} onChange={() => props.updateQuote('putpremiums')}/>
                </td>
                <td className="description">Market adjusted premium for puts the market maker would receive if a trade were placed at that time with a strike at the current consensus price.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  return {
    nav: nav,
    title: title,
    content: content
  }
}

const History = props => {
  if (props.account === undefined) {
    var page = {
      title: <h3>Account History</h3>,
      content: <p>No account selected</p>
    }
  } else if (props.history.data === undefined) {
    page = {
      title: <h3>Loading...</h3>
    }
  } else if (props.history.view === 'account') {
    page = buildPageAccountHistory(props)
  } else if (props.history.view === 'trade') {
    page = buildPageTradeHistory(props)
  } else if (props.history.view === 'quote') {
    page = buildPageQuoteHistory(props)
  }
  return <div id="div-history">
    <div>
      <div className="viewnav">
        {page.nav}
      </div>
      {page.title}
      {page.content}
    </div>
  </div>
}

const buildTimeGrid = (left, dur, width, height) => {
  if (dur === 300) {
    var grids = [ 0, 60, 120, 180, 240, 300 ]
  } else if (dur === 900) {
    grids = [ 0, 300, 600, 900 ] 
  } else if (dur === 3600) {
    grids = [ 0, 900, 1800, 2700, 3600 ]
  } else if (dur === 14400) {
    grids = [ 0, 3600, 7200, 10800, 14400 ]
  } else if (dur === 43200) {
    grids = [ 0, 14400, 28800, 43200 ]
  }
  const rules = []
  const text = []
  for (var i in grids) {
    const grid = grids[i]
    const x = 5 + left + (width - 10) * grid / dur
    if (grid === 0) {
      var textstr = "start"
    } else {
      textstr = commonName[grid]
    }
    rules.push(<line key={i} className="gridrule" x1={x} y1={0} x2={x} y2={height}/>)
    text.push(<text key={i} className="gridtext" x={x+5} y={height-4}>{textstr}</text>)
  }
  return <g>
    {rules}
    {text}
  </g>
}

const buildTimeScale = (left, right, width, height) => {
  //console.log("minp=" + minp)
  //console.log("maxp=" + maxp)
  var div = width / 100
  var delta = Math.log10((right - left) / div)
  //console.log("delta=" + delta)
  var floor = Math.floor(delta)
  //console.log("floor=" + floor)
  var frac = delta - floor
  var base = 2
  if (frac > 0.3010 && frac <= 0.6942) base = 5
  if (frac > 0.6942) base = 10
  //console.log("base=" + base)
  var inc = Math.pow(10, Math.log10(base) + floor)
  //console.log("inc=" + inc)
  var start = (Math.floor(left / inc) + 1) * inc
  var tics = []
  while (start < right) {
    tics.push(Math.round10(start, floor-1))
    start += inc
  }
  //console.log("tics=" + tics)
  const grids = tics.map((tic, i) => {
    const x = 5 + 100 + (width - 10) * (tic - left) / (right - left)
    return <g key={i}>
      <line className="gridrule" x1={x} x2={x} y1={0} y2={height}/>
      <text className="gridtext" x={x+5} y={height-4}>{tic.toString()}</text>
    </g>
  })
  return <g className="grid">
    {grids}
  </g>
}

const buildPriceGrid = (width, height, minp, maxp) => {
  //console.log("minp=" + minp)
  //console.log("maxp=" + maxp)
  var div = height / 40
  var delta = Math.log10((maxp - minp) / div)
  //console.log("delta=" + delta)
  var floor = Math.floor(delta)
  //console.log("floor=" + floor)
  var frac = delta - floor
  var base = 2
  if (frac > 0.3010 && frac <= 0.6942) base = 5
  if (frac > 0.6942) base = 10
  //console.log("base=" + base)
  var inc = Math.pow(10, Math.log10(base) + floor)
  //console.log("inc=" + inc)
  var start = (Math.floor(minp / inc) + 1) * inc
  var tics = []
  while (start < maxp) {
    tics.push(Math.round10(start, floor-1))
    start += inc
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

const buildTradeHistoryChart = (data, scaleX, scaleY) => {
  // Spot history
  var x1 = scaleX(data.startBlock)
  var y1 = scaleY(data.start) 
  const endBlock = data.endBlock === undefined ? data.startBlock + data.trade.dur : data.endBlock
  const hist = data.history.data.map((el, n) => {
    const x = scaleX(el.block < data.startBlock ? data.startBlock : el.block)
    const y = scaleY(el.spot)
    var line = <g key={n}>
      <line x1={x1} y1={y1} x2={x} y2={y1}/>
      <line x1={x} y1={y1} x2={x} y2={y}/>
    </g>
    x1 = x
    y1 = y
    return line
  })
  if (data.endBlock !== undefined) {
    hist.push(<line key="z" x1={x1} y1={y1} x2={scaleX(data.endBlock)} y2={y1}/>)
  }
  
  // trade rect
  const tradeX1 = scaleX(data.startBlock)
  const tradeX2 = scaleX(endBlock)
  const strikeY = scaleY(data.trade.strike)
  if (data.endBlock === undefined) {
    var settleY = strikeY
  } else {
    const final = scaleY(data.end)
    if (data.trade.type === 0) {
      settleY = final < strikeY ? final : strikeY
    } else {
      settleY = final > strikeY ? final : strikeY 
    }
  }
  const unitprem = data.trade.premium / data.trade.quantity
  if (data.trade.type === 0) {
    const premY = scaleY(data.trade.strike + unitprem)
    var rect = <rect x={tradeX1} y={premY} width={tradeX2-tradeX1} height={strikeY-premY}/>
    var trade = "call"
  }
  if (data.trade.type === 1) {
    const premY = scaleY(data.trade.strike - unitprem)
    rect = <rect x={tradeX1} y={strikeY} width={tradeX2-tradeX1} height={premY-strikeY}/>
    trade = "put"
  }
  const tradegroup = <g>
    {rect}
    <line className={"tradebase "+trade} x1={tradeX1} y1={strikeY} x2={tradeX2} y2={strikeY}/>
    <line className={"tradebase "+trade} x1={tradeX2} y1={strikeY} x2={tradeX2} y2={settleY}/>
    <line className={"tradex "+trade} x1={tradeX2-3} y1={settleY-3} x2={tradeX2+3} y2={settleY+3}/>
    <line className={"tradex "+trade} x1={tradeX2+3} y1={settleY-3} x2={tradeX2-3} y2={settleY+3}/>
  </g>
  
  return <g>
    {tradegroup}
    {hist}
  </g>
}

const buildQuoteHistoryChart = (data, view, scaleX, scaleY) => {
  if (data.hist.length > 1) {
    if (view.quotepremiums) {
      var last = data.hist[0]
      var histrect = data.hist.slice(1).map((el,n) => {
        const lastx = scaleX(last.block)
        const x = scaleX(el.block)
        const lowY = scaleY(last.spot - last.premium)
        const highY = scaleY(last.spot + last.premium)
        last = el
        return <rect key={n} x={lastx} y={highY} width={x-lastx} height={lowY-highY}/>
      })
    }
    if (view.quotespot) {
      last = data.hist[0]
      var histline = data.hist.slice(1).map((el,n) => {
        const lastx = scaleX(last.block)
        const x = scaleX(el.block)
        const midY = scaleY(last.spot)
        last = el
        return <line key={n} x1={lastx} y1={midY} x2={x} y2={midY}/>
      })
    }
  }
  if (data.consensus.length > 1) {
    last = data.consensus[0]
    var cons = data.consensus.slice(1).map((el,n) => {
      const lastx = scaleX(last.block)
      const lasty = scaleY(last.spot)
      const x = scaleX(el.block)
      const y = scaleY(el.spot)
      if (view.consensus) {
        var line = <g>
          <line x1={lastx} y1={lasty} x2={x} y2={lasty}/>
          <line x1={x} y1={lasty} x2={x} y2={y}/>
        </g>
      }
      if (el.call !== undefined && view.callpremiums) {
        const cally = scaleY(last.spot + last.call)
        var crect =  <rect className="call" x={lastx} y={cally} width={x-lastx} height={lasty-cally}/>
      }
      if (el.put !== undefined && view.putpremiums) {
        const puty = scaleY(last.spot - last.put)
        var prect =  <rect className="put" x={lastx} y={lasty} width={x-lastx} height={puty-lasty}/>
      }
      const elem = <g key={n}>
        {crect}
        {prect}
        {line}
      </g>
      last = el
      return elem
    })
  }
  return <g>
    <pattern id="diagonalHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="8" height="8"/>
      <line x1="0" y1="0" x2="0" y2="8"/>
    </pattern>
    <g className="histrect">
      {histrect}
    </g>
    <g className="consensus">{cons}</g>
    <g className="histline">
      {histline}
    </g>
  </g>
}

const mapStateToProps = state => ({
  constants: state.app.constants,
  account: state.microtick.account,
  history: state.history
})

const mapDispatchToProps = dispatch => bindActionCreators({
  button10,
  button25,
  button50,
  button100,
  buttonfirst,
  prevButton,
  nextButton,
  buttonlast,
  viewAccount,
  viewQuote,
  viewTrade,
  updateQuote,
  selectMarket
}, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(History)
