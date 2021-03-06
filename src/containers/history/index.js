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

const durValue = {
  "5minute": 300,
  "10minute": 600,
  "15minute": 900,
  "30minute": 1800,
  "1hour": 3600,
  "2hour": 7200,
  "4hour": 14400,
  "8hour": 28800,
  "12hour": 43200,
  "1day": 86400
}

function buildPageAccountHistory(props) {
  const data = props.history.data
  var startingBalance = 0
  var endingBalance = 0
  if (data.list.length > 0) {
    startingBalance = data.list[0].balance + data.list[0].debit - data.list[0].credit
    endingBalance = data.list[data.list.length-1].balance
  }
  var list = data.list.map((c,n) => {
    const viewTrade = <td><button onClick={() => props.viewTrade(c.id)}>T-{c.id}</button></td>
    //const viewTrade = <td>T-{c.id}</td>
    const viewQuote = <td><button onClick={() => props.viewQuote(c.id)}>Q-{c.id}</button></td>
    //const viewQuote = <td>Q-{c.id}</td>
    const ct = <td><span className="count">{n + (data.page-1) * data.pageInc + 1}</span></td>
    const balance = Math.round10(c.balance, -6)
    const amount = Math.round10(c.amount, -6)
    switch (c.event) {
      case 'trade.long':
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.height}</td>
          <td>Buy {c.option}</td>
          {viewTrade}
          <td><button onClick={() => props.selectMarket(c.market)}>{c.market}</button></td>
          <td>{commonName[c.duration]}</td>
          <td>{amount} {props.token}</td>
          <td>{c.commission} {props.token}</td>
          <td>{Math.round10(c.debit, -6)} {props.token}</td>
          <td>---</td>
          <td>{balance} {props.token}</td>
        </tr>
      case 'trade.short':
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.height}</td>
          <td>Sell {c.option}</td>
          {viewTrade}
          <td><button onClick={() => props.selectMarket(c.market)}>{c.market}</button></td>
          <td>{commonName[c.duration]}</td>
          <td>{amount} {props.token}</td>
          <td>---</td>
          <td>---</td>
          <td>{Math.round10(c.credit, -6)} {props.token}</td>
          <td>{balance} {props.token}</td>
        </tr>
      case 'settle.long':
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.height}</td>
          <td>Settle long</td>
          {viewTrade}
          <td colSpan={2}></td>
          <td>{amount} {props.token}</td>
          <td>{c.commission !== 0 ? Math.round10(c.commission, -6) + " " + props.token : "---"}</td>
          <td>---</td>
          <td>{Math.round10(c.credit, -6)} {props.token}</td>
          <td>{balance} {props.token}</td>
        </tr>
      case 'settle.short':
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.height}</td>
          <td>Settle refund</td>
          {viewTrade}
          <td colSpan={2}></td>
          <td>{amount} {props.token}</td>
          <td>{c.commission !== 0 ? Math.round10(c.commission, -6) + " " + props.token : "---"}</td>
          <td>---</td>
          <td>{Math.round10(c.credit, -6)} {props.token}</td>
          <td>{balance} {props.token}</td>
        </tr>
      case 'deposit':
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.height}</td>
          <td>Deposit</td>
          <td colSpan={3}></td>
          <td>{amount} {props.token}</td>
          <td>---</td>
          <td>---</td>
          <td>{c.credit} {props.token}</td>
          <td>{balance} {props.token}</td>
        </tr>
      case 'withdraw':
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.height}</td>
          <td>Withdraw</td>
          <td colSpan={3}></td>
          <td>{amount} {props.token}</td>
          <td>---</td>
          <td>{c.debit} {props.token}</td>
          <td>---</td>
          <td>{balance} {props.token}</td>
        </tr>
      case 'quote.create':
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.height}</td>
          <td>Create quote</td>
          {viewQuote}
          <td><button onClick={() => props.selectMarket(c.market)}>{c.market}</button></td>
          <td>{commonName[c.duration]}</td>
          <td>{amount} {props.token}</td>
          <td>{c.commission} {props.token}</td>
          <td>{c.debit} {props.token}</td>
          <td>---</td>
          <td>{balance} {props.token}</td>
        </tr>
      case 'quote.deposit':
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.height}</td>
          <td>Deposit backing</td>
          {viewQuote}
          <td colSpan={2}></td>
          <td>{amount} {props.token}</td>
          <td>{c.commission} {props.token}</td>
          <td>{c.debit} {props.token}</td>
          <td>---</td>
          <td>{balance} {props.token}</td>
        </tr>
      case 'quote.update':
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.height}</td>
          <td>Update quote</td>
          {viewQuote}
          <td colSpan={2}></td>
          <td>---</td>
          <td>{c.commission} {props.token}</td>
          <td>{c.debit} {props.token}</td>
          <td>---</td>
          <td>{balance} {props.token}</td>
        </tr>
      case 'quote.cancel':
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.height}</td>
          <td>Cancel quote</td>
          {viewQuote}
          <td colSpan={2}></td>
          <td>{amount} {props.token}</td>
          <td>---</td>
          <td>---</td>
          <td>{c.credit} {props.token}</td>
          <td>{balance} {props.token}</td>
        </tr>
      default:
        return <tr key={n} className={n%2?'even':'odd'}>
          {ct}
          <td>{c.height}</td>
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
          <td colSpan={10}></td>
          <td><b>{Math.round10(startingBalance,-6)} {props.token}</b></td>
        </tr>
        {list}
        <tr className={data.list.length%2?'even':'odd'}>
          <td colSpan={10}></td>
          <td><b>{Math.round10(endingBalance,-6)} {props.token}</b></td>
        </tr>
      </tbody>
    </table>
  </div>
  content = <div>
    <div>
      <span>Transaction blocks per page </span>
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
    <h3>Account Ledger</h3>
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
    const premium = data.trade.cost
    const unitpremium = Math.round10(premium / qty, -6)
    const backing = data.trade.counterparties.reduce((sum, cp) => {
      return Math.round10(sum + cp.backing, -6)
    }, 0)
    const maxpayout = Math.round10(backing / premium, -2)
    var cost = <span className="highlight padright">{Math.round10(premium, -6)} {props.token}</span>
    if (data.endBlock !== -1) {
      var settle = data.trade.final
      var profit = data.trade.settle
      var refund = data.trade.counterparties.reduce((acc, cp) => {
        return acc + cp.settle
      }, 0)
      var net = Math.round10(profit - premium, -6)
      var fv = <span className="highlight padright">{Math.round10(profit, -6)} {props.token}</span>
      var np = <span className="highlight padright">{Math.round10(net, -6)} {props.token}</span>
      var settlePrice = <tr>
        <td className="rowlabel">Settle price:</td>
        <td className="spacer"></td>
        <td className="rowvalue">@{Math.round10(settle, -6)}</td>
      </tr>
      var backingrefund = <p>Backing Refunded: {Math.round10(refund, -6)} {props.token}</p>
    } else {
      fv = <span className="padright">(in progress)</span>
      np = <span className="padright">(in progress)</span>
    }
    
    // Trade highlights - timing / price / backing
    
    if (data.endBlock !== -1) {
      var endblock = <p>End block: {data.endBlock}</p>
    }
    if (data.trade.type === "put") {
      var direction = "⇓"
      var profitable = Math.round10(strike - unitpremium, -6)
    } else {
      direction = "⇑"
      profitable = Math.round10(strike + unitpremium, -6)
    }
    const metrics = <div className="metrics">
      <p>Cost: {cost} Final Value: {fv} Net Profit (long): {np}</p>
      <div className="statsblock">
        <h5>Timing</h5>
        <p>Start Time: {new Date(data.trade.start).toLocaleString()}</p>
        <p>End Time: {new Date(data.trade.expiration).toLocaleString()}</p>
        <p>Start Block: {data.startBlock}</p>
        {endblock}
      </div>
      <div className="statsblock">
        <h5>Contract Details</h5>
        <table>
          <tbody>
            <tr>
              <td className="rowlabel">Quantity:</td>
              <td className="spacer"></td>
              <td className="rowvalue">⚖ {qty}</td>
            </tr>
            <tr>
              <td className="rowlabel">Strike:</td>
              <td className="spacer"></td>
              <td className="rowvalue">@{Math.round10(strike, -6)}</td>
            </tr>
            <tr>
              <td className="rowlabel">Profitable if:</td>
              <td className="spacer"></td>
              <td className="rowvalue">{direction} {unitpremium}</td>
            </tr>
            <tr>
              <td className="rowlabel">Profit Threshold:</td>
              <td className="spacer"></td>
              <td className="rowvalue">@{profitable}</td>
            </tr>
            {settlePrice}
          </tbody>
        </table>
      </div>
      <div className="statsblock">
        <h5>Backing</h5>
        <p>Trade Backing: {backing} {props.token}</p>
        <p>Max Payout: {maxpayout} : 1</p>
        {backingrefund}
      </div>
    </div>
    
    // Trade chart
    
    const LEFT = 100
    const WIDTH = 500
    const HEIGHT = 320
    const TOP = 300
    if (data.trade.type === "put") {
      const bottom = strike - unitpremium
      var minp = data.minp < bottom ? data.minp : bottom
      var maxp = data.maxp
    } else {
      const top = strike + unitpremium
      minp = data.minp
      maxp = data.maxp > top ? data.maxp : top
    }
    const transform = {
      min: data.trade.quantity * (minp - data.trade.strike),
      max: data.trade.quantity * (maxp - data.trade.strike)
    }
    const timeGrid = buildTimeGrid(LEFT, durValue[data.trade.duration], WIDTH, HEIGHT)
    const priceGrid = buildPriceGrid(props.token, LEFT + WIDTH, TOP, transform.min, transform.max, data.trade.type)
    const tradeEnd = data.end === -1 ? data.start + durValue[data.trade.duration] * 1000 : data.end
    const hist = buildTradeHistoryChart(data, x => {
      return 5 + LEFT + (WIDTH - 10) * (x - data.start) / (tradeEnd - data.start)
    }, y => {
      const delta = data.trade.quantity * (y - data.trade.strike)
      return (TOP - 5) - (TOP - 10) * (delta - transform.min) / (transform.max - transform.min)
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
    
    if (data.trade.type === "call") {
      var deltaDescription = "Quoted Spot - Strike"
    } else {
      deltaDescription = "Strike - Quoted Spot"
    }
    const costbreakdownrows = data.trade.counterparties.map((cp,n) => {
      const spot = cp.quoted.spot
      const qty = cp.quoted.quantity
      const prem = cp.quoted.premium
      const mqty = cp.quantity
      const cprem = cp.premium
      const mprem = Math.round10(cprem / mqty, -6)
      if (data.trade.type === "call") {
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
        <td className="col1 section-right"><button onClick={() => props.viewQuote(cp.quoted.id)}>Q-{cp.quoted.id}</button></td>
        <td className="col2">⚖ {Math.round10(qty, -6)}</td>
        <td className="col2 section-right">⚖ {Math.round10(mqty, -6)}</td>
        <td className="col3">@{spot}</td>
        <td className="col3 section-right">Δ {delta}</td>
        <td className="col4">⇕ {Math.round10(prem, -6)}</td>
        {discount}
        <td className="col4 section-right">{data.trade.type === "put" ? "⇓" : "⇑"} ={mprem}</td>
        <td className="col5">{Math.round10(cprem, -6)} {props.token}</td>
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
          <td className="col5 total">{Math.round10(premium, -6)} {props.token}</td>
        </tr>
      </tfoot>
    </table>
    
    // P/L Summary

    if (data.endBlock !== -1) {
      var totalpayout = <td className="col6 total">{Math.round10(profit, -6)} {props.token}</td>
    } else {
      totalpayout = <td className="col6 total">in progress</td>
    }
    const plsummaryrows = data.trade.counterparties.map((cp, n) => {
      const qty = cp.quoted.quantity
      const mqty = cp.quantity
      const qbacking = cp.backing
      const cprem = cp.premium
      if (cp.refund !== undefined) {
        var qrefund = cp.refund
      } else {
        qrefund = 0
      }
      if (cp.settle !== undefined) {
        var qsettle = cp.settle
      } else {
        qsettle = 0
      }
      const longpl = 100 * (qsettle - cprem) / cprem
      const shortpl = 100 * (cprem - qsettle) / qbacking
      if (data.endBlock !== -1) {
        var cprefund = <td className="col6">{Math.round10(qrefund, -6)} {props.token}</td>
        var cppayout = <td className="col6 section-right">{Math.round10(qsettle, -6)} {props.token}</td>
        var cplongpl = <td className="col7">{Math.round10(longpl, -2)} %</td>
        var cpshortpl = <td className="col7 section-right">{Math.round10(shortpl, -2)} %</td>
      } else {
        cprefund = <td className="col6">in progress</td>
        cppayout = <td className="col6 section-right">in progress</td>
        cplongpl = <td className="col7">in progress</td>
        cpshortpl = <td className="col7 section-right">in progress</td>
      }
      return <tr key={n}>
        <td className="col1 section-right"><button onClick={() => props.viewQuote(cp.quoted.id)}>Q-{cp.quoted.id}</button></td>
        <td className="col2">⚖ {Math.round10(qty, -6)}</td>
        <td className="col2 section-right">⚖ {Math.round10(mqty, -6)}</td>
        <td className="col5 section-right">{Math.round10(cprem, -6)} {props.token}</td>
        <td className="col6">{Math.round10(qbacking, -6)} {props.token}</td>
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
    
    if (data.trade.type === "call") {
      var tradeType = "Call"
    } else {
      tradeType = "Put"
    }
    var content = <div>
      <h4>{tradeType} {data.trade.market} / {commonName[data.trade.duration]} : Trade {data.state}</h4>
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
    nav: <button onClick={props.viewAccount}>Return to Account Ledger</button>,
    title: title,
    content: content
  }
}

function buildPageQuoteHistory(props) {
  const data = props.history.data.info
  var nav = <button onClick={props.viewAccount}>Return to Account Ledger</button>
  var title = <h3>Quote Q-{data.id}</h3>
  const LEFT = 100
  const WIDTH = 800
  const HEIGHT = 600
  const TOP = 580
  const timeGrid = buildTimeScale(data.start, data.end, WIDTH, HEIGHT)
  const priceGrid = buildPriceGrid(props.token, LEFT + WIDTH, TOP, data.minp, data.maxp)
  const hist = buildQuoteHistoryChart(data, props.history.data.view, x => {
    return 5 + LEFT + WIDTH * (x - data.range.startHeight) / (data.range.endHeight - data.range.startHeight)
  }, y => {
    return TOP - (TOP - 10) * (y - data.minp) / (data.maxp - data.minp)
  })
  const state = data.lifecycle.destroy === undefined ? "active" : "closed"
  //console.log("data=" + JSON.stringify(data, null, 2))
  var content = <div>
    <div className="quoterow">
      <div className="metrics">
        <h4>{data.market} / ■ {data.duration} : {state}</h4>
      </div>
      <div id="quotechart">
        <div id="quotesvg">
          <h4>Quote History</h4>
          <p>History from block {data.range.startHeight} to {data.range.endHeight}</p>
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
      title: <h3>Account Ledger</h3>,
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

const gridName = {
  60: "1 minute",
  120: "2 minutes",
  180: "3 minutes",
  240: "4 minutes",
  300: "5 minutes",
  600: "10 minutes",
  900: "15 minutes",
  1800: "30 minutes",
  2700: "45 minutes",
  3600: "1 hour",
  7200: "2 hours",
  10800: "3 hours",
  14400: "4 hours",
  28800: "8 hours",
  43200: "12 hours",
  86400: "1 day"
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
      textstr = gridName[grid]
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

const buildPriceGrid = (token, width, height, minp, maxp, ttype) => {
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
    var ticDisplay = ttype === "put" ? tic * -1 : tic
    if (ticDisplay >= 0) {
      ticDisplay += " " + token
    } else {
      ticDisplay = ""
    }
    return <g key={i}>
      <line className="gridrule" x1={0} x2={width} y1={y} y2={y}/>
      <text className="gridtext" x="5" y={y-4}>{ticDisplay}</text>
    </g>
  })
  return <g className="grid">
    {grids}
  </g>
}

const buildTradeHistoryChart = (data, scaleX, scaleY) => {
  // Spot history
  var x1 = scaleX(data.startBlock)
  var y1 = scaleY(data.trade.strike)
  const endTime = data.end === -1 ? data.start + durValue[data.trade.duration] * 1000 : data.end
  const hist = data.ticks.map((el, n) => {
    const x = scaleX(el.time < data.startBlock ? data.startBlock : el.time)
    const y = scaleY(el.consensus)
    var line = <g key={n}>
      <line x1={x1} y1={y1} x2={x} y2={y1}/>
      <line x1={x} y1={y1} x2={x} y2={y}/>
    </g>
    x1 = x
    y1 = y
    return line
  })
  if (data.endBlock !== -1) {
    hist.push(<line key="z" x1={x1} y1={y1} x2={scaleX(data.end)} y2={y1}/>)
  }
  
  // trade rect
  const tradeX1 = scaleX(data.start)
  const tradeX2 = scaleX(endTime)
  const strikeY = scaleY(data.trade.strike)
  if (data.endBlock === -1) {
    var settleY = strikeY
  } else {
    const final = scaleY(data.trade.final)
    if (data.trade.type === "put") {
      settleY = final > strikeY ? final : strikeY 
    } else {
      settleY = final < strikeY ? final : strikeY
    }
  }
  const unitprem = data.trade.cost / data.trade.quantity
  if (data.trade.type === "put") {
    const premY = scaleY(data.trade.strike - unitprem)
    const height = premY >= strikeY ? premY-strikeY : 0
    var rect = <rect x={tradeX1} y={strikeY} width={tradeX2-tradeX1} height={height}/>
    var trade = "put"
  } else {
    const premY = scaleY(data.trade.strike + unitprem)
    const height = strikeY >= premY ? strikeY-premY : 0
    rect = <rect x={tradeX1} y={premY} width={tradeX2-tradeX1} height={height}/>
    trade = "call"
  }
  if (data.end !== -1) {
    var trademarker = <g>
      <line className={"tradex "+trade} x1={tradeX2-3} y1={settleY-3} x2={tradeX2+3} y2={settleY+3}/>
      <line className={"tradex "+trade} x1={tradeX2+3} y1={settleY-3} x2={tradeX2-3} y2={settleY+3}/>
    </g>
  }
  const tradegroup = <g>
    {rect}
    <line className={"tradebase "+trade} x1={tradeX1} y1={strikeY} x2={tradeX2} y2={strikeY}/>
    <line className={"tradebase "+trade} x1={tradeX2} y1={strikeY} x2={tradeX2} y2={settleY}/>
    {trademarker}
  </g>
  
  return <g>
    {tradegroup}
    {hist}
  </g>
}

const buildQuoteHistoryChart = (data, view, scaleX, scaleY) => {
  if (data.updates.length > 1) {
    if (view.quotepremiums) {
      var last = data.updates[0]
      var histrect = data.updates.slice(1).reduce((acc, el, n) => {
        const lastx = scaleX(last.height)
        const x = scaleX(el.height)
        const lowY = scaleY(last.spot - last.premium)
        const highY = scaleY(last.spot + last.premium)
        last = el
        acc.push(<rect key={n} x={lastx} y={highY} width={x-lastx} height={lowY-highY}/>)
        return acc
      }, [])
    }
    if (view.quotespot) {
      last = data.updates[0]
      var histline = data.updates.slice(1).reduce((acc, el, n) => {
        const lastx = scaleX(last.height)
        const x = scaleX(el.height)
        const midY = scaleY(last.spot)
        last = el
        acc.push(<line key={n} x1={lastx} y1={midY} x2={x} y2={midY}/>)
        return acc
      }, [])
    }
  }
  if (data.ticks.length > 1) {
    last = data.ticks[0]
    var cons = data.ticks.slice(1).map((el,n) => {
      const lastx = scaleX(last.height)
      const lasty = scaleY(last.consensus)
      const x = scaleX(el.height)
      const y = scaleY(el.consensus)
      if (view.consensus) {
        var line = <g>
          <line x1={lastx} y1={lasty} x2={x} y2={lasty}/>
          <line x1={x} y1={lasty} x2={x} y2={y}/>
        </g>
      }
      if (view.callpremiums) {
        const cally = scaleY(last.consensus + last.call)
        const width = x - lastx > 0 ? x - lastx : 1
        var crect =  <rect className="call" x={lastx} y={cally} width={width} height={lasty-cally}/>
      }
      if (view.putpremiums) {
        const puty = scaleY(last.consensus - last.put)
        const width = x - lastx > 0 ? x - lastx : 1
        var prect =  <rect className="put" x={lastx} y={lasty} width={width} height={puty-lasty}/>
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
