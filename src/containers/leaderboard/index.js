import React from 'react'
import { connect } from 'react-redux'
import { registerAccount, changeAddress, getLeaderboardData } from '../../modules/leaderboard'

import "./index.css"

const Leaderboard = props => {
  if (props.leaders !== undefined) {
    var leaders = props.leaders.map((leader, i) => {
      if (leader.account === props.localAddress) {
        var rowClass = "myaccount"
      } else if (i%2 === 0) {
        rowClass = "even"
      } else {
        rowClass = "odd"
      }
      if (leader.gain < 0) {
        var gainstr = "(" + Math.round10(leader.gain, -6) + " " + props.token + ")"
      } else {
        gainstr = Math.round10(leader.gain, -6) + " " + props.token
      }
      if (leader.debit !== 0) {
        if (leader.gain < 0) {
          var percent = "(" + Math.round10(100 * leader.gain / leader.debit, -2) + "%)"
        } else {
          percent = Math.round10(100 * leader.gain / leader.debit, -2) + "%"
        }
      } else {
        percent = "0%"
      }
      return <tr key={i} className={rowClass}>
        <td className="rank">{leader.rank}</td>
        <td className="leftjust">{leader.account}</td>
        <td>{leader.trades}</td>
        <td>{Math.round10(leader.debit, -6)} {props.token}</td>
        <td>{Math.round10(leader.credit, -6)} {props.token}</td>
        <td>{gainstr}</td>
        <td>{percent}</td>
      </tr>
    })
    var leaderboard = <div className="finalresults">
      <table>
        <colgroup>
          <col style={{width: "30px"}}/>
          <col style={{width: "400px"}}/>
          <col style={{width: "80px"}}/>
          <col style={{width: "120px"}}/>
          <col style={{width: "120px"}}/>
          <col style={{width: "120px"}}/>
          <col style={{width: "80px"}}/>
        </colgroup>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Testnet Account</th>
            <th>Qualified Trades</th>
            <th>Cost Basis</th>
            <th>Earned Tokens</th>
            <th>Total Gain (Loss)</th>
            <th>Gain %</th>
          </tr>
        </thead>
        <tbody>
          {leaders}
        </tbody>
      </table>
    </div>
  }
  if (props.loading) {
    return <div id="div-leaderboard">
      <p>Loading...</p>
    </div>
  } else if (props.leaders !== undefined) {
    const url = "https://stargazer.certus.one/accounts/" + props.registeredAddress
    if (props.active) {
      if (props.registeredAddress !== undefined && props.registeredAddress !== null) {
        var register = <div id="registration">
          <p><b>Your mainnet reward address</b>: <a href={url} target="_blank" rel="noopener noreferrer">{props.registeredAddress}</a> <button onClick={() => changeAddress()}>Change</button></p>
          <p className="warn">(this is <span className="ul">the Cosmos mainnet</span> account where any contest prizes you earn will be sent - it is up to you to make sure this address is accurate!!)</p>
        </div>
      } else {
        const cancel = props.registeredAddress === undefined ? "" : <button onClick={() => getLeaderboardData(props.page)}>Cancel</button>
        register = <div id="registration">
          <p>Register for this contest with the <span className="warn">Cosmos mainnet address</span> where winnings should be sent: <input id="mainnet" size="80"></input></p>
          <p><b>Fee to register</b>: {props.fee} {props.token}</p>
          <button onClick={() => registerAccount(document.getElementById("mainnet").value)}>Register</button>
          {cancel}
        </div>
      }
      var title = <h2>Active Contest</h2>
      var notice = <p>(updates every {props.updateInterval} seconds, earnings are not counted until a trade ends)</p>
    } else {
      title = <h2>Contest not active</h2>
    }
    if (props.pages > 1) {
      const prev = props.page > 0 ? props.page - 1 : 0
      const next = props.page + 1 < props.pages ? props.page + 1 : props.pages - 1
      var page = <div className="pagenav">
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
      {register}
      {title}
      <p><b>Reward</b>: {props.reward}</p>
      <p><b>Contest start time</b>: {props.startTime} UTC</p>
      <p><b>Contest end time</b>: {props.endTime} UTC</p>
      <h2>Leaderboard</h2>
      {page}
      {leaderboard}
      <p>Total registered accounts: {props.total}</p>
      {notice}
    </div>
  } else {
    return <div id="div-leaderboard">
      <h2>No Active Contest</h2>
      <p>Check back soon or monitor the <a href="https://t.me/microtick_general" target="_blank" rel="noopener noreferrer">Microtick telegram channel</a> for announcements.</p>
    </div>
  }
}

const mapStateToProps = state => ({
  active: state.leaderboard.active,
  loading: state.leaderboard.loading,
  total: state.leaderboard.total,
  reward: state.leaderboard.reward,
  fee: state.leaderboard.fee,
  startTime: state.leaderboard.startTime,
  endTime: state.leaderboard.endTime,
  updateInterval: state.leaderboard.updateInterval,
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