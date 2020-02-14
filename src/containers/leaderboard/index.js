import React from 'react'
import { connect } from 'react-redux'
import { registerAccount, changeAddress, getLeaderboardData } from '../../modules/leaderboard'

import "./index.css"

const Leaderboard = props => {
  if (props.loading) {
    return <div id="div-leaderboard">
      <p>Loading...</p>
    </div>
  } else {
    const url = "https://stargazer.certus.one/accounts/" + props.registeredAddress
    if (props.registeredAddress !== undefined && props.registeredAddress !== null) {
      var register = <div>
        <p><b>Your mainnet reward address</b>: <a href={url} target="_blank" rel="noopener noreferrer">{props.registeredAddress}</a> <button onClick={() => changeAddress()}>Change</button></p>
        <p className="warn">This is where any contest prizes you earn will be sent - it is up to you to make sure this address is accurate!!</p>
      </div>
    } else {
      register = <div>
        <p>Register your Cosmos mainnet address where winnings should be sent: <input id="mainnet" size="80"></input></p>
        <p><b>Fee to register</b>: {props.fee} fox</p>
        <button onClick={() => registerAccount(document.getElementById("mainnet").value)}>Register</button>
      </div>
    }
    if (props.leaders !== undefined) {
      var leaders = props.leaders.map((leader, i) => {
        if (leader.account === props.localAddress) {
          var rowClass = "myaccount"
        } else if (i%2 === 0) {
          rowClass = "even"
        } else {
          rowClass = "odd"
        }
        return <tr key={i} className={rowClass}>
          <td className="rank">{leader.rank}</td>
          <td className="leftjust">{leader.account}</td>
          <td>{Math.round10(leader.starting, -6)} fox</td>
          <td>{leader.numQuotes}</td>
          <td>{leader.numTrades}</td>
          <td>{Math.round10(leader.ending, -6)} fox</td>
          <td>{Math.round10(leader.percent, -2)}%</td>
        </tr>
      })
    }
    if (props.pages > 1) {
      const prev = props.page > 0 ? props.page - 1 : 0
      const next = props.page + 1 < props.pages ? props.page + 1 : props.pages - 1
      var page = <div>
        <p>Page {props.page + 1} of {props.pages}</p>
        <p className="nav">
          <button disabled={props.page === 0} onClick={() => getLeaderboardData(0)}>First</button>
          <button disabled={props.page === 0} onClick={() => getLeaderboardData(prev)}>Prev</button>
          <button disabled={props.page + 1 === props.pages} onClick={() => getLeaderboardData(next)}>Next</button>
          <button disabled={props.page + 1 === props.pages} onClick={() => getLeaderboardData(props.pages - 1)}>Last</button>
        </p>
      </div>
    }
    return <div id="div-leaderboard">
      <h2>Active contest</h2>
      <p><b>Reward</b>: {props.reward}</p>
      <p><b>Contest ends</b>: {props.endTime}</p>
      {register}
      <h2>Current leaders</h2>
      <p>Total registered accounts: {props.total}</p>
      {page}
      <table>
        <colgroup>
          <col style={{width: "30px"}}/>
          <col style={{width: "500px"}}/>
          <col style={{width: "150px"}}/>
          <col style={{width: "80px"}}/>
          <col style={{width: "80px"}}/>
          <col style={{width: "150px"}}/>
          <col style={{width: "100px"}}/>
        </colgroup>
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
  localAddress: state.microtick.account,
  registeredAddress: state.leaderboard.registeredAddress,
  leaders: state.leaderboard.leaders,
  page: state.leaderboard.page,
  pages: state.leaderboard.pages
})

export default connect(
  mapStateToProps, 
  null
)(Leaderboard)