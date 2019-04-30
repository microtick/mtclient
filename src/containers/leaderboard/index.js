import React from 'react'
import { connect } from 'react-redux'

import "./index.css"

const Leaderboard = props => {
  if (props.accounts !== undefined) {
    var total = props.commission
    const leaderboard = props.accounts.map((acct, id) => {
      const sum = Math.round10(acct.balance + acct.quoteBacking + acct.tradeBacking, -6)
      total = Math.round10(total + sum, -6)
      const awardarr = ["1st", "2nd", "3rd" ]
      const award = id < awardarr.length ? awardarr[id] : ""
      return <tr key={id} className={(id%2)===0?'even':'odd'}>
        <td>{id+1}</td>
        <td>{award}</td>
        <td className="num">{acct.name}</td>
        <td className="num">{acct.balance} fox</td>
        <td>{acct.numQuotes}</td>
        <td>{acct.numTrades}</td>
        <td className="num">{acct.quoteBacking} fox</td>
        <td className="num">{acct.tradeBacking} fox</td>
        <td className="num">{sum} fox</td>
      </tr>
    })
    return <div id="background">
      <div id="leaderboard">
        <table>
          <thead>
            <tr>
              <td>Rank</td>
              <td>Prize</td>
              <td>Account</td>
              <td>Balance</td>
              <td># Quotes</td>
              <td># Trades</td>
              <td>Quote Backing</td>
              <td>Trade Backing</td>
              <td>Total</td>
            </tr>
          </thead>
          <tbody>
            {leaderboard}
          </tbody>
        </table>
      </div>
    </div>
  } else {
    return <p>Loading...</p>
  }
}

const mapStateToProps = state => ({
  commission: state.leaderboard.commission,
  accounts: state.leaderboard.accounts
})

export default connect(
  mapStateToProps, 
  null
)(Leaderboard)