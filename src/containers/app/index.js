/*
 * Units
 * fox - token amount - unicode 3bc + 3c4
 * ■ - block time or dur - unicode 25a0
 * @ - observed price
 * ⇕ - premium - unicode 21d5
 * ⇑ - call premium - unicode 21d1
 * ⇓ - put premium - unicode 21d3
 * ⚖ - quantity - unicode 2696
 */

import React from 'react';
import { bindActionCreators } from 'redux'

import Trading from '../trading'
import Status from '../status'
import History from '../history'
import About from '../about'

import { connect } from 'react-redux'
import { closeNotification } from '../../modules/notifications'
import { updateSpot, updatePremium, depositBacking, cancelQuote, settleTrade, closeDialog } from '../../modules/dialog'
import { choosePassword, enterPassword, newAccount } from '../../modules/microtick'
//import { setProvider } from '../../modules/chain/tendermint'

import logo from './mtlogo-sm.png'
import "./index.css"

import { testBalance } from '../../modules/microtick'

import { menuSelected } from '../../modules/app'

const App = props => {
  if (props.password.prompt) {
    const checkAccount = document.cookie.split(';').filter(item => {
      return item.indexOf('mtm.account=') >= 0
    }).map(item => {
      return item.slice(item.indexOf('=') + 1)
    })
    if (checkAccount.length === 0) {
      var password = <div className="fullscreen">
        <div className="password">
          <div className="content">
            <div className="title">Choose a password to create a new account</div>
            <div className="form">
              <p><input type="password" maxLength="40" id="password"/></p>
              <p>Make sure to remember this password. It can not be recovered.</p>
              <button className="button" onClick={() => props.choosePassword()}>Done</button>
            </div>
          </div>
        </div>
      </div>
    } else {
      if (props.password.invalid) {
        var err = <p className="error">Invalid password entered</p>
      }
      const keys = JSON.parse(checkAccount[0])
      /*eslint-disable no-script-url*/
      password = <div className="fullscreen">
        <div className="password">
          <div className="content">
            <div className="title">Unlock account {keys.acct}</div>
            <div className="form">
              <p><input type="password" maxLength="40" id="password"/></p>
              {err}
              <p>Forgot password? <button onClick={() => props.newAccount()}>Create a new account</button></p>
              <button className="button" onClick={() => props.enterPassword()}>Done</button>
            </div>
          </div>
        </div>
      </div>
    }
  }
  const notifications = props.notifications.map((not, id) => {
    if (not.type === 'testtokens') {
      return <div key={id} className={"outer account"}>
        <div className="inner">
          <button className="close" onClick={() => props.closeNotification(not.id)}>X</button>
          <h3>Depositing Test Tokens</h3>
          <p>Amount: {not.amt} fox</p>
          <p className="footnote">Waiting on blockchain confirmation...</p>
        </div>
      </div>
    }
    if (not.type === 'buy') {
      if (not.dir === 0) { // Call
        var type = "Call"
        var notclass = "call"
      } else { // Put
        type = "Put"
        notclass = "put"
      }
      return <div key={id} className={notclass + " outer buynot"}>
        <div className="inner">
          <button className="close" onClick={() => props.closeNotification(not.id)}>X</button>
          <h3>Buying {type}</h3>
          <p>Market: <span className="info">{not.market}</span></p>
          <p>Duration: <span className="info">{not.dur}</span></p>
          <p>Quantity: <span className="info">⚖ {not.qty}</span></p>
          <p className="footnote">Waiting on blockchain confirmation...</p>
        </div>
      </div>
    }
    if (not.type === 'place') {
      return <div key={id} className={"outer place"}>
        <div className="inner">
          <button className="close" onClick={() => props.closeNotification(not.id)}>X</button>
          <h3>Placing Quote</h3>
          <p>Spot: <span className="info">@{not.spot}</span></p>
          <p>Market: <span className="info">{not.market}</span></p>
          <p>Duration: <span className="info">{not.dur}</span></p>
          <p>Backing: <span className="info">{not.backing} fox</span></p>
          <p>Premium: <span className="info">⇕ {Math.round10(not.premium, -4)}</span></p>
          <p className="footnote">Waiting on blockchain confirmation...</p>
        </div>
      </div>
    }
    if (not.type === 'cancel') {
      return <div key={id} className={"outer cancel"}>
        <div className="inner">
          <button className="close" onClick={() => props.closeNotification(not.id)}>X</button>
          <h3>Canceling Quote {not.quote}</h3>
          <p className="footnote">Waiting on blockchain confirmation...</p>
        </div>
      </div>
    }
    if (not.type === 'back') {
      return <div key={id} className={"outer cancel"}>
        <div className="inner">
          <button className="close" onClick={() => props.closeNotification(not.id)}>X</button>
          <h3>Backing Quote #{not.quote}</h3>
          <p>Deposit amount = {not.amount} fox</p>
          <p className="footnote">Waiting on blockchain confirmation...</p>
        </div>
      </div>
    }
    if (not.type === 'spot') {
      return <div key={id} className={"outer cancel"}>
        <div className="inner">
          <button className="close" onClick={() => props.closeNotification(not.id)}>X</button>
          <h3>Updating Quote #{not.quote}</h3>
          <p>New spot = @{not.spot}</p>
          <p className="footnote">Waiting on blockchain confirmation...</p>
        </div>
      </div>
    }
    if (not.type === 'premium') {
      return <div key={id} className={"outer cancel"}>
        <div className="inner">
          <button className="close" onClick={() => props.closeNotification(not.id)}>X</button>
          <h3>Updating Quote #{not.quote}</h3>
          <p>New premium = ⇕ {not.premium}</p>
          <p className="footnote">Waiting on blockchain confirmation...</p>
        </div>
      </div>
    }
    if (not.type === 'settle') {
      return <div key={id} className={"outer settle"}>
        <div className="inner">
          <button className="close" onClick={() => props.closeNotification(not.tid)}>X</button>
          <h3>Settling Trade {not.tid}</h3>
          <p className="footnote">Waiting on blockchain confirmation...</p>
        </div>
      </div>
    }
    if (not.type === 'success') {
      return <div key={id} className="outer success">
        <div className="inner">
          <button className="close" onClick={() => props.closeNotification(not.id)}>X</button>
          <h3>Success</h3>
          <p><span className="info">{not.msg}</span></p>
        </div>
      </div>
    }
    if (not.type === 'error') {
      if (not.tx) {
        var tx = <p className="footnote">Message: {not.tx}</p>
      }
      return <div key={id} className="outer error">
        <div className="inner">
          <button className="close" onClick={() => props.closeNotification(not.id)}>X</button>
          <h3>Error</h3>
          <p className="message">{not.msg}</p>
          {tx}
        </div>
      </div>
    }
    return null
  })
  if (props.dialog.showmodal) {
    if (props.dialog.type === "spot") {
      var header = <div className="header">
        <div className="title">Update Spot?</div>
        <div className="content">
          <p>Quote ID: {props.dialog.id}</p>
          <p>New spot: @<input type="number" id="quote-spot" defaultValue={props.dialog.defaultspot} step={Math.roundLog(props.dialog.premium)/10}/></p>
        </div>
      </div>
      var action = <button className="button" onClick={() => props.updateSpot(props.dialog.id)}>Execute Tx</button>
    }
    if (props.dialog.type === "premium") {
      header = <div className="header">
        <div className="title">Update Premium?</div>
        <div className="content">
          <p>Quote ID: {props.dialog.id}</p>
          <p>New premium: ⇕&nbsp;<input type="number" id="quote-premium" defaultValue={props.dialog.defaultpremium}/></p>
        </div>
      </div>
      action = <button className="button" onClick={() => props.updatePremium(props.dialog.id)}>Execute Tx</button>
    }
    if (props.dialog.type === "deposit") {
      header = <div className="header">
        <div className="title">Deposit Backing?</div>
        <div className="content">
          <p>Quote ID: {props.dialog.id}</p>
          <p>Amount: <input type="number" id="quote-backing" defaultValue={0} step={1}/> fox</p>
        </div>
      </div>
      action = <button className="button" onClick={() => props.depositBacking(props.dialog.id)}>Execute Tx</button>
    }
    if (props.dialog.type === "cancel") {
      header = <div className="header">
        <div className="title">Remove Quote?</div>
        <div className="content">
          <p>Quote ID: {props.dialog.id}</p>
        </div>
      </div>
      action = <button className="button" onClick={() => props.cancelQuote(props.dialog.id)}>Execute Tx</button>
    }
    if (props.dialog.type === "settle") {
      header = <div className="header">
        <div className="title">Settle Trade?</div>
        <div className="content">
          <p>Trade ID: {props.dialog.id}</p>
        </div>
      </div>
      action = <button className="button" onClick={() => props.settleTrade(props.dialog.id)}>Execute Tx</button>
    }
    var dialog = <div id="fullscreen">
      <div id="modal" className={props.dialog.type}>
        {header}
        <div className="buttons">
          {action}
          <button className="button" onClick={() => props.closeDialog()}>Cancel</button>
        </div>
      </div>
    </div>
  }
  if (props.account !== undefined) {
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
    const total = props.status.quoteBacking + props.status.tradeBacking + long - short
    if (props.balance === 0) {
      var fundAccountMsg = <p className="funding">Post your cosmos address on the Microtick <a href="https://t.me/microtick_general">Telegram channel</a> to get test fox tokens</p>
    }
    var acctInfo = <div>
      <p>Token balance = {Math.round10(props.balance, -6)} fox</p>
      <p>Current account value = <span className="totalAccountValue" onClick={() => props.menuSelected('status')}>{Math.round10(props.balance + total, -6)} fox</span></p>
      {fundAccountMsg}
    </div>
  }
  switch (props.menu.selected) {
    case 'trading':
      var page = <Trading/>
      break
    case 'status':
      page = <Status/>
      break
    case 'history':
      page = <History/>
      break
    case 'about':
      page = <About/>
      break
    default:
  }
  var menu = <div id="menu">
      <div className={props.menu.selected === 'trading' ? 'selected' : 'unselected'} onClick={() => props.menuSelected('trading')}>Trading</div>
      <div className={props.menu.selected === 'status' ? 'selected' : 'unselected'} onClick={() => props.menuSelected('status')}>Status</div>
      <div className={props.menu.selected === 'history' ? 'selected' : 'unselected'} onClick={() => props.menuSelected('history')}>History</div>
      <div className={props.menu.selected === 'about' ? 'selected' : 'unselected'} onClick={() => props.menuSelected('about')}>About</div>
    </div>
    /*
  if (props.provider !== undefined) {
    var provider = props.provider.url
    if (props.provider.edit) {
      var providerWidget = <input id="providerInput" 
        defaultValue={provider} 
        onBlur={() => setProvider(false)} 
        onKeyPress={e => {return (e.key === 'Enter' ? setProvider(false) : null)}} 
        autoFocus></input>
    } else {
      providerWidget = <span onClick={() => setProvider(true)}>{provider}</span>
    }
  } else {
    provider = "not connected"
  }
  */
  return <div>
    <section id="ui"> 
      <div id="notifications">
        {notifications}
      </div>
    </section>
    {dialog}
    <div id="page-header">
      <a href="http://microtick.com" alt="Microtick"><img src={logo} alt={"logo"}/></a>
      <nav role="navigation">
        <a href="http://microtick.com">Home</a>
        <a href="http://microtick.com/background-information.html">Learn More</a>
        <a href="http://microtick.com/how-to-table-of-contents.html">How To</a>
        <span className="current">Try the Testnet</span>
        <a href="http://microtick.com/contact.html">Contact</a>
      </nav>
    </div>
    <div id="page-subheader">
      <div id="div-chain">
        <h3>Chain Information</h3>
        <p>Block height = {props.block} <span className="right">{props.time}</span></p>
        <p>Block hash = <span className="sm">{props.hash}</span></p>
      </div>
      <div id="div-account">
        <h3>Account Information</h3>
        <p>Address = {props.account}</p>
        {acctInfo}
      </div>
    </div>
    {menu}
    <main>
      {password}
      {page}
    </main>
    <div id="page-footer" className="row">
      <p>Copyright &copy; 2018-19 Microtick LLC</p>
    </div>
  </div>
}

const mapStateToProps = state => ({
  password: state.microtick.password,
  constants: state.app.constants,
  menu: state.app.menu,
  block: state.tendermint.block.number,
  provider: state.tendermint.provider,
  hash: state.tendermint.block.hash,
  time: new Date(state.tendermint.block.timestamp * 1000).toLocaleTimeString(),
  gaslimit: state.tendermint.block.gaslimit,
  txgaslimit: state.tendermint.block.txgaslimit,
  accounts: state.tendermint.accounts,
  account: state.microtick.account,
  balance: state.microtick.balance,
  available: state.microtick.available,
  notifications: state.notifications.list,
  dialog: state.dialog,
  trades: state.microtick.trade.list,
  status: state.status
})

const mapDispatchToProps = dispatch => {
  return bindActionCreators({
    choosePassword,
    enterPassword,
    newAccount,
    closeNotification,
    updateSpot,
    updatePremium,
    depositBacking,
    cancelQuote,
    closeDialog,
    settleTrade,
    testBalance,
    menuSelected
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
