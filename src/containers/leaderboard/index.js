import React from 'react'
import { connect } from 'react-redux'
import { registerAccount, changeAddress } from '../../modules/leaderboard'

import "./index.css"

const Leaderboard = props => {
  if (props.loading) {
    return <div id="div-leaderboard">
      <p>Loading...</p>
    </div>
  } else {
    const url = "https://stargazer.certus.one/accounts/" + props.registeredAddress
    if (props.registeredAddress !== undefined && props.registeredAddress !== null) {
      var register = <p><b>Your mainnet reward address</b>: <a href={url} target="_blank" rel="noopener noreferrer">{props.registeredAddress}</a> <button onClick={() => changeAddress()}>Change</button></p>
    } else {
      register = <div>
        <p>Register your Cosmos mainnet address where winnings should be sent: <input id="mainnet" size="80"></input></p>
        <p><b>Fee to register</b>: {props.fee} fox</p>
        <button onClick={() => registerAccount(document.getElementById("mainnet").value)}>Register</button>
      </div>
    }
    if (props.leaders !== undefined) {
      var leaders = props.leaders.map((leader, i) => {
        return <tr key={i} className={i%2===0?"even":"odd"}>
          <td className="rank">{i+1}</td>
          <td className="leftjust">{leader.account}</td>
          <td>{Math.round10(leader.starting, -6)} fox</td>
          <td>{leader.numQuotes}</td>
          <td>{leader.numTrades}</td>
          <td>{Math.round10(leader.ending, -6)} fox</td>
          <td>{Math.round10(leader.percent, -2)}%</td>
        </tr>
      })
    }
    return <div id="div-leaderboard">
      <h2>Active contest</h2>
      <p><b>Reward</b>: {props.reward}</p>
      <p><b>Contest ends</b>: {props.endTime}</p>
      {register}
      <h2>Current leaders</h2>
      <p>Total accounts: {props.total}</p>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Testnet Account</th>
            <th>Starting Balance</th>
            <th>Num Quotes</th>
            <th>Num Trades</th>
            <th>Ending Balance</th>
            <th>Percentage Gain (Loss)</th>
          </tr>
        </thead>
        <tbody>
          {leaders}
        </tbody>
      </table>
    </div>
  }
}

const mapStateToProps = state => ({
  loading: state.leaderboard.loading,
  total: state.leaderboard.total,
  reward: state.leaderboard.reward,
  fee: state.leaderboard.fee,
  endTime: state.leaderboard.endTime,
  registeredAddress: state.leaderboard.registeredAddress,
  leaders: state.leaderboard.leaders
})

export default connect(
  mapStateToProps, 
  null
)(Leaderboard)