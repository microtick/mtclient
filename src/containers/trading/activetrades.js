import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { selectMarket, selectDur } from '../../modules/microtick'
import { viewTrade } from '../../modules/history'
import { settleTradeDialog } from '../../modules/dialog'

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

const ActiveTrades = props => {
  var totalPremium = 0
  var totalCurrent = 0
  var totalProfit = 0
  const list = props.trades.filter(tr => {
    return tr.active
  }).map((tr, id) => {
    totalPremium += parseFloat(tr.premium)
    totalCurrent += tr.current
    totalProfit += tr.profit
    if (tr.profit > 0) 
      var cl = "green"
    else if (tr.profit < 0)
      cl = "red"
    else
      cl = "black"
    //const now = new Date(props.timestamp * 1000)
    const now = new Date()
    if (tr.end > now) {
      var secondsRemain = Math.round10((tr.end - now) / 1000, 0)
      const hoursRemain = parseInt(secondsRemain / 3600, 10)
      secondsRemain = (secondsRemain % 3600)
      const minutesRemain = parseInt(secondsRemain / 60, 10)
      secondsRemain = secondsRemain % 60
      const tick = ("0" + hoursRemain).slice(-2) + ":" + ("0" + minutesRemain).slice(-2) + 
        ":" + ("0" + secondsRemain).slice(-2)
      var remain = <td>{tick}</td>
    } else {
      remain = <td>
        <button onClick={() => props.settleTradeDialog(tr.id)}>Settle</button>
      </td>
    }
    return <tr className={(id%2 === 0) ? "odd" : "even"} key={id}>
      <td><span className="count">{id+1}</span></td>
      <td><button onClick={() => props.viewTrade(tr.id)}>T-{tr.id}</button></td>
      <td>{tr.dir === 'long' ? 'Long' : 'Short'}</td>
      <td>{tr.type === 0 ? "Call" : "Put"}</td>
      <td><button onClick={() => { props.selectMarket(tr.market); props.selectDur(tr.dur) }}>{tr.market}</button></td>
      <td>{tr.dur}</td>
      <td>{tr.start.toLocaleTimeString()}</td>
      <td>{tr.end.toLocaleTimeString()}</td>
      {remain}
      <td>@{Math.round10(tr.spot, props.constants.SPOT_PRECISION)}</td>
      <td>@{Math.round10(tr.strike, props.constants.SPOT_PRECISION)}</td>
      <td>⚖ {Math.round10(tr.qty, props.constants.UNIT_PRECISION)}</td>
      <td>{Math.round10(tr.backing, props.constants.TOKEN_PRECISION)} fox</td>
      <td><span>{Math.round10(tr.premium, props.constants.TOKEN_PRECISION)} fox</span></td>
      <td><span>{Math.round10(tr.current, props.constants.TOKEN_PRECISION)} fox</span></td>
      <td><span className={cl}>{Math.round10(tr.profit, props.constants.TOKEN_PRECISION)} fox</span></td>
    </tr>
  })
  if (list.length > 0) {
    if (totalProfit > 0)
      var totalCl = "green"
    else if (totalProfit < 0)
      totalCl = "red"
    else
      totalCl = "black"
    var activetrades = <div id="div-active">
      <h3>Active Trades</h3>
      <table className="activetable">
        <thead>
          <tr>
            <td></td>
            <td>ID</td>
            <td>Position</td>
            <td>Type</td>
            <td>Market</td>
            <td>Dur</td>
            <td>Start</td>
            <td>End</td>
            <td>Remain</td>
            <td>Spot</td>
            <td>Strike</td>
            <td>Qty</td>
            <td>Backing</td>
            <td>Cost</td>
            <td>Value</td>
            <td>Profit / Loss</td>
          </tr>
        </thead>
        <tbody>
          {list}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={13}><span className="right">Total:</span></td>
            <td><span>{Math.round10(totalPremium, props.constants.TOKEN_PRECISION)} fox</span></td>
            <td><span>{Math.round10(totalCurrent, props.constants.TOKEN_PRECISION)} fox</span></td>
            <td><span className={totalCl}>{Math.round10(totalProfit, props.constants.TOKEN_PRECISION)} fox</span></td>
          </tr>
        </tfoot>
      </table>
    </div>
  }
  return <div>
    {activetrades}
  </div>
}

const mapStateToProps = state => ({
  timestamp: state.tendermint.app.timestamp,
  constants: state.app.constants,
  trades: state.microtick.trade.list
})

const mapDispatchToProps = dispatch => bindActionCreators({
  selectMarket,
  selectDur,
  settleTradeDialog,
  viewTrade
}, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ActiveTrades)