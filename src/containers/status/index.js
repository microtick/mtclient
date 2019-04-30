import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ActiveTrades from '../trading/activetrades'
import ActiveQuotes from '../trading/activequotes'
import './index.css'

const Status = props => {
  const data = props.status
  if (props.account === undefined) {
    var content = <p>No account selected</p>
  } else {
    var long = 0
    var short = 0
    props.trades.filter(tr => {
      return tr.active
    }).map(tr => {
      if (tr.dir === 'long') {
        long = Math.round10(long + tr.current, -6)
      } else {
        short = Math.round10(short + tr.current, -6)
      }
      return false
    })
    const total = data.quoteBacking + data.tradeBacking + long - short
    content = <div>
      <div id="balances">
        <div className="rowbox">
          <h5>Token Balance</h5>
          <div><div className="balance">{Math.round10(props.balance, props.constants.TOKEN_PRECISION)} fox</div></div>
        </div>
        <div className="rowbox">
          <h5>+ Unrealized Gains / Escrowed Backing</h5>
          <table>
            <thead>
              <tr>
                <td></td>
                <td>Active</td>
                <td>Unrealized Gains / Losses</td>
                <td>Backing</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Quotes</td>
                <td>{data.numQuotes}</td>
                <td>---</td>
                <td>{Math.round10(data.quoteBacking, props.constants.TOKEN_PRECISION)} fox</td>
              </tr>
              <tr>
                <td>Trades (long)</td>
                <td>{data.numTradesLong}</td>
                <td>{long}</td>
                <td>---</td>
              </tr>
              <tr>
                <td>Trades (short)</td>
                <td>{data.numTradesShort}</td>
                <td>{-short}</td>
                <td>{Math.round10(data.tradeBacking, props.constants.TOKEN_PRECISION)} fox</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td></td>
                <td>Total</td>
                <td><div className="balance">{Math.round10(long - short, props.constants.TOKEN_PRECISION)} fox</div></td>
                <td><div className="balance">{Math.round10(data.quoteBacking + data.tradeBacking, props.constants.TOKEN_PRECISION)} fox</div></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="rowbox">
          <h5>= Total Account Value</h5>
          <div><div className="balance">{Math.round10(total + data.curBalance, props.constants.TOKEN_PRECISION)} fox</div></div>
        </div>
      </div>
      <ActiveQuotes/>
      <ActiveTrades/>
    </div>
  }
  return <div id="div-status">
    <h3>Account Status</h3>
    {content}
  </div>
}

const mapStateToProps = state => ({
  constants: state.app.constants,
  account: state.microtick.account,
  balance: state.microtick.balance,
  trades: state.microtick.trade.list,
  status: state.status
})

const mapDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Status)
