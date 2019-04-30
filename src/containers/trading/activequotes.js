import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { selectMarket } from '../../modules/microtick'
import { updateSpotDialog, updatePremiumDialog, depositQuoteDialog, cancelQuoteDialog } from '../../modules/dialog'
import { viewQuote } from '../../modules/history'

const commonName = {
  300: "5 minute",
  900: "15 minute",
  3600: "1 hour",
  14400: "4 hour",
  43200: "12 hour"
}

const ActiveQuotes = props => {
  if (props.quote.list.length > 0) {
    const quotes = props.quote.list.sort((a,b) => {
      if (a.market > b.market) return 1
      if (a.market < b.market) return -1
      return a.dur - b.dur
    }).map((q, id) => {
      var deposit = <td><button onClick={() => props.depositQuoteDialog(q.id)}>Deposit</button></td>
      if (props.timestamp >= q.canModify) {
        var actions = [
          <td key={1}><button onClick={() => props.updateSpotDialog(q.id, q.spot, q.premium)}>Spot</button></td>,
          <td key={2}><button onClick={() => props.updatePremiumDialog(q.id, q.spot, q.premium)}>Premium</button></td>,
          <td key={3}><button onClick={() => props.cancelQuoteDialog(q.id)}>Cancel</button></td>
        ]
      } else {
        actions = <td colSpan="3">not available</td>
      }
      return <tr className={(id%2 === 0) ? "odd" : "even"} key={id}>
        <td><span className="count">{id+1}</span></td>
        <td><button onClick={() => props.viewQuote(q.id)}>Q-{q.id}</button></td>
        <td><button onClick={() => props.selectMarket(q.market)}>{q.market}</button></td>
        <td>{commonName[q.dur]}</td>
        <td>@{Math.round10(q.spot, props.constants.SPOT_PRECISION)}</td>
        <td>⚖ {Math.round10(q.quantity, props.constants.UNIT_PRECISION)}</td>
        <td>⇕ {Math.round10(q.premium, props.constants.SPOT_PRECISION)}</td>
        <td>{Math.round10(q.backing, props.constants.TOKEN_PRECISION)} fox</td>
        <td>{Math.round10(props.timestamp - q.modified, 0)} seconds</td>
        {actions}
        {deposit}
      </tr>
    })
    var activequotes = <div id="div-quotes">
      <h3>Active Quotes</h3>
      <table className="activetable">
        <thead>
          <tr>
            <td colSpan={10}></td>
            <td colSpan="4">Update Quote</td>
          </tr>
          <tr>
            <td></td>
            <td>ID</td>
            <td>Market</td>
            <td>Dur</td>
            <td>Spot</td>
            <td>Weight</td>
            <td>Premium</td>
            <td>Backing</td>
            <td>Age</td>
            <td>Spot</td>
            <td>Premium</td>
            <td>Cancel</td>
            <td>Deposit</td>
          </tr>
        </thead>
        <tbody>
          {quotes}
        </tbody>
      </table>
    </div>
  } 
  return <div>
    {activequotes}
  </div>
}

const mapStateToProps = state => ({
  block: state.tendermint.block.number,
  timestamp: state.tendermint.app.timestamp,
  constants: state.app.constants,
  quote: state.microtick.quote
})

const mapDispatchToProps = dispatch => bindActionCreators({
  selectMarket,
  updateSpotDialog,
  updatePremiumDialog,
  depositQuoteDialog,
  cancelQuoteDialog,
  viewQuote
}, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ActiveQuotes)