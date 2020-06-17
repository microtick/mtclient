/*
 * Units
 * dai - token amount - unicode 3bc + 3c4
 * ■ - block time or dur - unicode 25a0
 * @ - observed price
 * ⇕ - premium - unicode 21d5
 * ⇑ - call premium - unicode 21d1
 * ⇓ - put premium - unicode 21d3
 * ⚖ - quantity - unicode 2696
 */

import React from 'react';
import ReactToolTip from 'react-tooltip'
import { bindActionCreators } from 'redux'

import Leaderboard from '../leaderboard'
import Trading from '../trading'
import Status from '../status'
import History from '../history'
import About from '../about'

import { connect } from 'react-redux'
import { closeNotification } from '../../modules/notifications'
import { updateSpot, updatePremium, depositBacking, cancelQuote, settleTrade, closeDialog } from '../../modules/dialog'
import { selectWallet, choosePassword, enterPassword, newAccount, recoverAccount,
    requestTokens, sendTokens, requestShift, withdrawAccount } from '../../modules/microtick'
//import { setProvider } from '../../modules/chain/tendermint'

import ClipBoard from 'react-copy-to-clipboard'
import ClipImage from './Clipboard.svg'
import Ledger from './ledger.svg'
import Software from './software.svg'
import logo from './mtlogo-sm.png'
import "./index.css"

import { menuSelected } from '../../modules/app'

const App = props => {
  if (props.dialog.showinteract && props.ledger) {
    var interact = <div id="interact">
      <div className="center">
        <p>Please confirm the interaction on your Ledger device</p>
      </div>
    </div>
  }
  if (props.wallet === "none") {
    var login = <div className="fullscreen">
      <div id="wallet-select" className="password">
        <h1>Select the wallet you would like to use:</h1>
        <div className="wallet-choices">
          <div className="wallet-choice">
            <h2>Hardware Wallet</h2>
            <button className="button" onClick={() => props.selectWallet(true)}><img id="wallet-ledger-logo" src={Ledger} alt="ledger"/></button>
          </div>
          <div className="wallet-choice">
            <h2>Software Wallet</h2>
            <button className="button" autoFocus onClick={() => {props.selectWallet(false)}}><img id="wallet-software-logo" src={Software} alt="software wallet"/></button>
          </div>
        </div>
      </div>
    </div>
  } else if (props.password.prompt) {
    const checkAccount = document.cookie.split(';').filter(item => {
      return item.indexOf('mtm.account=') >= 0
    }).map(item => {
      return item.slice(item.indexOf('=') + 1)
    })
    if (checkAccount.length === 0) {
      login = <div className="fullscreen">
        <div id="choosepass" className="password">
          <div className="content">
            <h2>Choose a password to create a new account</h2>
            <div className="form">
              <p><input type="password" autoFocus maxLength="60" id="password" onKeyDown={e=>{if (e.key==='Enter') props.choosePassword()}}/></p>
              <p>Make sure to remember this password. It can not be recovered.</p>
              <button className="button" onClick={() => props.choosePassword()}>Set Password</button>
            </div>
          </div>
        </div>
      </div>
    } else {
      if (props.password.invalid) {
        var err = <p className="error">Invalid password entered</p>
      }
      var newaccount = <p>Forgot password? You can <button onClick={() => props.newAccount()}>Create a new account</button> or 
        &nbsp;<button onClick={() => props.recoverAccount()}>Recover an account</button></p>
      login = <div className="fullscreen">
        <div id="unlockwallet" className="password">
          <div className="content">
            <div className="title">
              <h2>Unlock Software Wallet</h2>
              <p>Enter the password to unlock your wallet:</p>
            </div>
            <p><input type="password" autoFocus maxLength="60" id="password" onKeyDown={e=>{if (e.key==='Enter') props.enterPassword()}}/></p>
            {err}
            <button className="mainbutton" onClick={() => props.enterPassword()}>Unlock Wallet</button>
            {newaccount}
          </div>
        </div>
      </div>
    }
  } else if (props.mnemonic.prompt) {
    const rows = []
    for (var i=0; i<6; i++) {
      rows.push(<tr key={i}>
        <td className="mnemonic_number">{4*i+1}</td><td className="mnemonic_word">{props.mnemonic.words[4*i]}</td>
        <td className="mnemonic_number">{4*i+2}</td><td className="mnemonic_word">{props.mnemonic.words[4*i+1]}</td>
        <td className="mnemonic_number">{4*i+3}</td><td className="mnemonic_word">{props.mnemonic.words[4*i+2]}</td>
        <td className="mnemonic_number">{4*i+4}</td><td className="mnemonic_word">{props.mnemonic.words[4*i+3]}</td>
      </tr>)
    }
    login = <div className="fullscreen">
      <div className="mnemonic">
        <div className="content">
          <div className="title">
            <h2>Write down your wallet's secret phrase:</h2>
            <table>
              <tbody>
                {rows}
              </tbody>
            </table>
            <p>This secret phrase is not known by anyone else, including Microtick. It will provide the only way to recover your wallet if your browser data becomes corrupted 
            or you forget your password. <span className="emphas">Write it down and keep it somewhere safe!</span></p>
            <button className="button" onClick={() => props.mnemonic.done()}>I have written it down</button>
          </div>
        </div>
      </div>
    </div>
  } else if (props.recover.prompt) {
    const rows = []
    for (i=0; i<6; i++) {
      rows.push(<tr key={i}>
        <td className="recover_number">{4*i+1}</td><td className="recover_word"><input id={"word"+(4*i)}></input></td>
        <td className="recover_number">{4*i+2}</td><td className="recover_word"><input id={"word"+(4*i+1)}></input></td>
        <td className="recover_number">{4*i+3}</td><td className="recover_word"><input id={"word"+(4*i+2)}></input></td>
        <td className="recover_number">{4*i+4}</td><td className="recover_word"><input id={"word"+(4*i+3)}></input></td>
      </tr>)
    }
    login = <div className="fullscreen">
      <div className="recover">
        <div className="content">
          <div className="title">
            <h2>Enter your wallet's secret phrase:</h2>
            <table>
              <tbody>
                {rows}
              </tbody>
            </table>
            <p>Choose a password for the account:</p>
            <p><input type="password" autoFocus maxLength="60" id="password" onKeyDown={e=>{if (e.key==='Enter') props.recover.done()}}/></p>
            <button className="button" onClick={() => props.recover.done()}>Recover</button>
          </div>
        </div>
      </div>
    </div>
  }
  const notifications = props.notifications.map((not, id) => {
    if (not.type === 'testtokens') {
      return <div key={id} className={"outer account"}>
        <div className="inner">
          <button className="close" onClick={() => props.closeNotification(not.id)}>X</button>
          <h3>Depositing Test Tokens</h3>
          <p>Amount: {not.amt} {props.token}</p>
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
          <p>Backing: <span className="info">{not.backing} {props.token}</span></p>
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
          <p>Deposit amount = {not.amount} {props.token}</p>
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
    if (not.type === 'faucet') {
      return <div key={id} className={"outer faucet"}>
        <div className="inner">
          <button className="close" onClick={() => props.closeNotification(not.id)}>X</button>
          <h3>Requesting tokens</h3>
          <p className="footnote">Requesting faucet tokens for account: {not.acct}</p>
        </div>
      </div>
    }
    if (not.type === 'faucetlimit') {
      return <div key={id} className="outer error">
        <div className="inner">
          <button className="close" onClick={() => props.closeNotification(not.id)}>X</button>
          <h3>Error</h3>
          <p className="message">Account has reached its automatic funding limit.</p>
          <p>Visit the <a target="_blank" rel="noopener noreferrer" href="https://t.me/microtick_general">Microtick telegram channel</a> to request more.</p>
        </div>
      </div>
    }
    if (not.type === 'register') {
      return <div key={id} className={"outer register"}>
        <div className="inner">
          <button className="close" onClick={() => props.closeNotification(not.id)}>X</button>
          <h3>Registering for leaderboard</h3>
          <p className="footnote">Reward address: {not.mainnet}</p>
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
      var message = not.msg
      if (not.msg.includes("insufficient funds") || 
          not.msg.includes("insufficient account funds") ||
          not.msg.includes("invalid address")) {
        message = "Insufficient account funds"
    	  if (process.env.MICROTICK_PROD !== "true") {
          var button = <button id="requestbutton" onClick={() => {
            props.closeNotification(not.id)
            props.requestTokens()
          }}>Request tokens</button>
    	  }
      }
      return <div key={id} className="outer error">
        <div className="inner">
          <button className="close" onClick={() => props.closeNotification(not.id)}>X</button>
          <h3>Error</h3>
          <p className="message">{message} {button}</p>
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
          <p>Amount: <input type="number" id="quote-backing" defaultValue={0} step={1}/> {props.token}</p>
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
    if (props.dialog.type === "send") {
      header = <div className="header">
        <div className="title">Send Tokens</div>
        <div className="content">
          <p>Send to (cosmos address): <input type="string" size={42} id="cosmos-account"/></p>
          <p>Amount to withdraw: <input id="token-amount" type="number" size={12} defaultValue={props.dialog.max}/> dai</p>
        </div>
      </div>
      action = <button className="button" onClick={() => props.dialog.submit()}>Submit</button>
    }    
    if (props.dialog.type === "withdraw") {
      header = <div className="header">
        <div className="title">Withdraw DAI to Ethereum</div>
        <div className="content">
          <p>Ethereum address to receive DAI: <input type="string" size={42} id="eth-account" autoComplete="off"/></p>
          <p>Amount to withdraw: <input id="dai-amount" type="number" size={12} defaultValue={props.dialog.max}/> dai</p>
        </div>
      </div>
      action = <button className="button" onClick={() => props.dialog.submit()}>Submit</button>
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
  if (props.dialog.showshift) {
    if (props.dialog.type === "start") {
      header = <div className="header">
        <div className="title">Fund Account</div>
        <div className="content">
          <p>To fund your trading account, send Ethereum ERC-20 DAI tokens to the following Ethereum address:</p>
          <p id="sendprompt">
            <input size={40} value={props.dialog.to} readOnly disabled="disabled"/>
            <ClipBoard text={props.dialog.to}>
              <button onClick={()=>{document.getElementById('copied').style.display='inline-block'}}><img src={ClipImage} alt="clipboard"/>&nbsp;<span id="copied" style={{display:'none'}}>copied</span></button>
            </ClipBoard>
          </p>
        </div>
      </div>
    }
    if (props.dialog.type === "confirm") {
      header = <div className="header">
        <div className="title">Confirm Withdrawal</div>
        <div className="content">
          <p>Withdraw: {props.dialog.amount} dai</p>
          <p>To Ethereum account: {props.dialog.account} ?</p>
        </div>
      </div>
      action = <button className="button" onClick={() => props.dialog.confirm()}>Submit</button>
    }
    dialog = <div id="fullscreen">
      <div id="modal" className={props.dialog.type}>
        {header}
        <div className="buttons">
          {action}
          <button className="button" onClick={() => props.dialog.close()}>Cancel</button>
        </div>
      </div>
    </div>
  }
  if (props.dialog.showconfirm) {
    if (props.dialog.type === "shiftstatus") {
      if (props.dialog.complete) {
        var wait = <p>Completing transfer...</p>
      } else {
        wait = <p>Waiting for confirmations: {props.dialog.confirmations} / {props.dialog.required}</p>
      }
      header = <div className="header">
        <div className="title">Ethereum Transaction Initiated</div>
        <div className="content">
          <p>Amount pending: {props.dialog.amount} dai</p>
          {wait}
        </div>
      </div>
    }
    if (props.dialog.type === "waitwithdraw") {
      header = <div className="header">
        <div className="title">Withdrawal In Progress...</div>
        <div className="content">
          <p>Waiting for outgoing blockchain confirmation...</p>
        </div>
      </div>
    }
    if (props.dialog.type === "withdrawcomplete") {
      header = <div className="header">
        <div className="title">Withdrawal Complete</div>
        <div className="content">
          <p>Ethereum confirmation: <a target="_blank" href={"https://goerli.etherscan.io/tx/" + props.dialog.hash} rel="noopener noreferrer">{props.dialog.hash}</a></p>
        </div>
      </div>
      action = <button className="button" onClick={() => props.dialog.close()}>Dismiss</button>
    }
    dialog = <div id="fullscreen">
      <div id="modal" className={props.dialog.type}>
        {header}
        <div className="buttons">
          {action}
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
    const staketip = "Stake is earned with every commission (delegation coming soon)."
    var acctInfo = <div>
      <p>Available balance = {Math.round10(props.balance, -6)} {props.token}</p>
      <p>Current account value = <span className="totalAccountValue" onClick={() => props.menuSelected('status')}>{Math.round10(props.balance + total, -6)} {props.token}</span></p>
      <p data-tip={staketip}>Stake = {Math.round10(props.stake, -6)} tick (undelegated)</p>
    </div>
  }
  switch (props.menu.selected) {
    case 'leaderboard':
      var page = <Leaderboard token={props.token}/>
      break
    case 'trading':
      page = <Trading token={props.token}/>
      break
    case 'status':
      page = <Status token={props.token}/>
      break
    case 'history':
      page = <History token={props.token}/>
      break
    case 'about':
      page = <About/>
      break
    default:
  }
  if (process.env.MICROTICK_LEADERBOARD !== "off") {
     var leaderboard = <div className={props.menu.selected === 'leaderboard' ? 'selected' : 'unselected'} onClick={() => props.menuSelected('leaderboard')}>Leaderboard</div>
  }
  var menu = <div id="menu">
      {leaderboard}
      <div className={props.menu.selected === 'trading' ? 'selected' : 'unselected'} onClick={() => props.menuSelected('trading')}>Trading</div>
      <div className={props.menu.selected === 'status' ? 'selected' : 'unselected'} onClick={() => props.menuSelected('status')}>Status</div>
      <div className={props.menu.selected === 'history' ? 'selected' : 'unselected'} onClick={() => props.menuSelected('history')}>History</div>
      <div className={props.menu.selected === 'about' ? 'selected' : 'unselected'} onClick={() => props.menuSelected('about')}>About</div>
    </div>
  if (process.env.MICROTICK_PROD !== "true") {
    var fund = <button id="requestbutton" onClick={() => props.requestTokens()}>Request Tokens</button>
    var withdraw = <button id="withdrawbutton" onClick={() => props.sendTokens()}>Send Tokens</button>
  } else {
    if (props.balance > 500) {
      var disabled = true
    } else {
      disabled = false
    }
    //fund = <button id="requestbutton" onClick={() => props.requestShift()} disabled={disabled}>Fund Account</button>
    //withdraw = <button id="withdrawbutton" onClick={() => props.withdrawAccount()}>Withdraw</button>
    const left = 100 + window.screenX
    const top = 100 + window.screenY
    const strWindowFeatures = 'toolbar=no,menubar=no,width=400,height=800,left=' + left + ',top=' + top
    const url = 'https://auth.shapeshift.io/oauth/authorize?client_id=2029f310-444e-44aa-b6da-c389b4431f9d&scope=users:read&response_type=code&redirect_uri=https://devnet.microtick.zone/authenticated.html'
    //const url = 'https://auth.shapeshift.io/oauth/authorize?client_id=b8982b43-4e3d-4ba8-b648-794461abaa4c&scope=users:read&response_type=code&redirect_uri=https://devnet.microtick.zone/authenticated.html'
    //const url = 'https://auth.shapeshift.io.staging.chiefhappinessofficerellie.org/oauth/authorize?client_id=0038641c-28ff-4366-aea9-212b2bf3e6e3&scope=users:read&response_type=code&redirect_uri=https://devnet.microtick.zone/authenticated.html'
    fund = <button id="requestbutton" onClick={() => window.open(url, "", strWindowFeatures)} disabled={disabled}>Fund Account</button>
    withdraw = <button id="withdrawbutton" onClick={() => window.open(url, "", strWindowFeatures)}>Withdraw</button>
  }
  if (process.env.MICROTICK_EXPLORER !== "off") {
    var block_height = <a target="_blank" rel="noopener noreferrer" href={process.env.MICROTICK_EXPLORER + "/blocks/" + props.block}>{props.block}</a>
    var chain_id = <a target="_blank" rel="noopener noreferrer" href={process.env.MICROTICK_EXPLORER}>{props.chainid}</a>
    var account_addr = <a target="_blank" rel="noopener noreferrer" href={process.env.MICROTICK_EXPLORER + "/account/" + props.account}>{props.account}</a>
  } else {
    block_height = props.block
    chain_id = props.chainid
    account_addr = props.account
  }
  return <div>
    {interact}
    <section id="ui"> 
      <div id="notifications">
        {notifications}
      </div>
    </section>
    {dialog}
    <div id="page-header">
      <a href="http://microtick.com" alt="Microtick"><img src={logo} alt="logo"/></a>
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
        <p>Chain = {chain_id}</p>
        <p>Block height = {block_height} <span className="right">{props.time}</span></p>
        <p>Block hash = <span className="sm">{props.hash}</span></p>
      </div>
      <div id="div-account">
        <ReactToolTip/>
        <h3>Account Information</h3>
        <div id="transact">
          {fund}
          {withdraw}
        </div>
        <p>Address = {account_addr} {props.account !== undefined ? (props.ledger ? "(hw)" : "(sw)") : ""}</p>
        {acctInfo}
      </div>
    </div>
    {menu}
    {login}
    {page}
    <div id="page-footer">
      <p>Copyright &copy; 2018-2020 Microtick LLC</p>
      <p>Microtick option standardization U.S. patents 7,856,395 and 8,229,840.</p>
      <p>Microtick blockchain-based oracle patent pending.</p>
    </div>
  </div>
}

const mapStateToProps = state => ({
  ledger: state.microtick.ledger,
  wallet: state.microtick.wallet,
  password: state.microtick.password,
  mnemonic: state.microtick.mnemonic,
  recover: state.microtick.recover,
  constants: state.app.constants,
  menu: state.app.menu,
  chainid: state.tendermint.block.chainid,
  block: state.tendermint.block.number,
  provider: state.tendermint.provider,
  hash: state.tendermint.block.hash,
  time: new Date(state.tendermint.block.timestamp * 1000).toLocaleTimeString(),
  gaslimit: state.tendermint.block.gaslimit,
  txgaslimit: state.tendermint.block.txgaslimit,
  accounts: state.tendermint.accounts,
  account: state.microtick.account,
  balance: state.microtick.balance,
  stake: state.microtick.stake,
  available: state.microtick.available,
  notifications: state.notifications.list,
  dialog: state.dialog,
  trades: state.microtick.trade.list,
  status: state.status
})

const mapDispatchToProps = dispatch => {
  return bindActionCreators({
    selectWallet,
    choosePassword,
    enterPassword,
    newAccount,
    recoverAccount,
    requestTokens,
    requestShift,
    closeNotification,
    updateSpot,
    updatePremium,
    depositBacking,
    cancelQuote,
    closeDialog,
    settleTrade,
    sendTokens,
    withdrawAccount,
    menuSelected
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
