import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { selectMarket } from '../../modules/microtick'
import { updateSpotDialog, updatePremiumDialog, depositQuoteDialog, cancelQuoteDialog } from '../../modules/dialog'
import { viewQuote } from '../../modules/history'

const commonName = {
  '5minute': "5 minutes",
  '15minute': "15 minutes",
  '1hour': "1 hour",
  '4hour': "4 hours",
  '12hour': "12 hours"
}

const ActiveQuotes = props => {
  if (props.quote.list.length > 0) {
    const quotes = props.quote.list.sort((a,b) => {
      if (a.market > b.market) return 1
      if (a.market < b.market) return -1
      return a.dur - b.dur
    }).map((q, id) => {
      const modified = q.modified.getTime() / 1000
      const canModify = q.canModify.getTime() / 1000
      if (props.timestamp >= canModify) {
        var actions = [
          <td key={1}><button onClick={() => props.updateSpotDialog(q.id, q.spot, q.premium)}>Spot</button></td>,
          <td key={2}><button onClick={() => props.updatePremiumDialog(q.id, q.spot, q.premium)}>Premium</button></td>,
          <td key={3}><button onClick={() => props.cancelQuoteDialog(q.id)}>Cancel</button></td>,
          <td key={4}><button onClick={() => props.depositQuoteDialog(q.id)}>Deposit</button></td>
        ]
      } else {
        actions = <td colSpan="4">not available</td>
      }
      return <tr className={(id%2 === 0) ? "odd" : "even"} key={id}>
        <td><span className="count">{id+1}</span></td>
        <td><button onClick={() => props.viewQuote(q.id)}>Q-{q.id}</button></td>
        <td><button onClick={() => props.selectMarket(q.market)}>{q.market}</button></td>
        <td>{commonName[q.dur]}</td>
        <td>@{Math.round10(q.spot, props.constants.SPOT_PRECISION)}</td>
        <td>⚖ {Math.round10(q.quantity, props.constants.UNIT_PRECISION)}</td>
        <td>⇕ {Math.round10(q.premium, props.constants.SPOT_PRECISION)}</td>
        <td>{Math.round10(q.backing, props.constants.TOKEN_PRECISION)} {props.token}</td>
        <td>{Math.round10(props.timestamp - modified, 0)} seconds</td>
        {actions}
      </tr>
    })
    var activequotes = <div id="div-quotes">
      <h3>Active Quotes</h3>
      <table className="activetable">
        <thead>
          <tr>
            <td colSpan={9}></td>
            <td colSpan={4}>Modify Quote</td>
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