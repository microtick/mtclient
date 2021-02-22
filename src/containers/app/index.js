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
import Select from 'react-select'
import { bindActionCreators } from 'redux'

import Leaderboard from '../leaderboard'
import Trading from '../trading'
import Status from '../status'
import History from '../history'
import About from '../about'

import { connect } from 'react-redux'
import { closeNotification } from '../../modules/notifications'
import { updateSpot, updatePremium, depositBacking, cancelQuote, settleTrade, closeDialog } from '../../modules/dialog'
import { selectWallet, choosePassword, enterPassword, newAccount, recoverAccount, IBCDeposit, IBCWithdraw } from '../../modules/microtick'
//import { setProvider } from '../../modules/chain/tendermint'

import ClipBoard from 'react-copy-to-clipboard'
import ClipImage from './Clipboard.svg'
import Ledger from './ledger.svg'
import Software from './software.svg'
import logo from './mtlogo-sm.png'
import QRCode from 'qrcode.react'
import "./index.css"

import { menuSelected } from '../../modules/app'

import IBC from './ibc-brand.svg'

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
    if (not.type === 'ibc') {
      return <div key={id} className={"outer ibc"}>
        <div className="inner">
          <button className="close" onClick={() => props.closeNotification(not.id)}>X</button>
          <h3>Submitting IBC Transfer</h3>
          <p className="footnote">Waiting on blockchain confirmation...</p>
        </div>
      </div>
    }
    if (not.type === 'trade') {
      if (not.dir === 0) { // Buy Call
        var type = "Call"
        var notclass = "call"
        var dir = "Buying"
      } 
      if (not.dir === 1) { // Buy Put
        type = "Put"
        notclass = "put"
        dir = "Buying"
      }
      if (not.dir === 2) { // Sell Call
        type = "Call"
        notclass = "call"
        dir = "Selling"
      } 
      if (not.dir === 3) { // Sell Put
        type = "Put"
        notclass = "put"
        dir = "Selling"
      }
      return <div key={id} className={notclass + " outer buynot"}>
        <div className="inner">
          <button className="close" onClick={() => props.closeNotification(not.id)}>X</button>
          <h3>{dir} {type}</h3>
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
      }
      return <div key={id} className="outer error">
        <div className="inner">
          <button className="close" onClick={() => props.closeNotification(not.id)}>X</button>
          <h3>Error</h3>
          <p className="message">{message}</p>
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
  if (props.dialog.showconfirm) {
    var closelabel = "Cancel"
    if (props.dialog.type === "deposit") {
      let backingChecked = props.dialog.params.backing ? "checked" : ""
      let tickChecked = props.dialog.params.tick ? "checked" : ""
      if (backingChecked || tickChecked) {
        var chainselect = <div className="select-wrapper">
          <Select
            id="ibc-chain-select"
            onChange={props.dialog.handlers.selectChain}
            value={props.dialog.params.chain}
            options={props.dialog.params.chains}
          />
        </div>
        if (props.dialog.params.chain !== undefined) {
          if (backingChecked) {
            var note = "This wallet is on the funding chain (" + props.dialog.params.chainid + ") and is controlled by the same signing key as your Microtick wallet. Send " + props.dialog.params.txdenom + " tokens to this address on the funding chain to have funds available for deposit."
          }
          if (tickChecked) {
            var note = "This wallet is on the funding chain (" + props.dialog.params.chainid + ") and is controlled by the same signing key as your Microtick wallet. Send tokens to this address on " + props.dialog.params.chainid + " to have funds available for deposit. TICK shows up as " + props.dialog.params.tokentype + " on " + props.dialog.params.chainid + "."
          }
          var wallet = <div className="table-wrapper">
            <ReactToolTip/>
            <p className="wallet-address" data-tip={note} data-class="ibc-tip">{props.dialog.params.wallet}</p>
            <table>
              <tbody>
                <tr>
                </tr>
                <tr>
                  <td>Available for deposit</td>
                  <td>{props.dialog.params.balance} {props.dialog.params.tokenlabel}</td>
                </tr>
                <tr>
                  <td>Amount to deposit</td>
                  <td><input id="ibc-deposit-amount" type="number" size={12} value={props.dialog.params.transferAmount} onChange={props.dialog.handlers.updateTransferAmount}/></td>
                </tr>
              </tbody>
            </table>
          </div>
          if (parseFloat(props.dialog.params.transferAmount) > 0) {
            action = <button className="button" onClick={() => props.dialog.submit()}>Submit</button>
          }
        } 
      }
      header = <div className="header ibc">
        <div className="title ibc">Deposit IBC Tokens</div>
        <div>
          Deposit Type:
          <input type="radio" id="backing" name="ibc-asset" value="backing" checked={backingChecked} onChange={() => props.dialog.handlers.selectTransferAsset(true)}/>
          <label htmlFor="backing">Backing</label>
          <input type="radio" id="tick" name="ibc-asset" value="tick" checked={tickChecked} onChange={() => props.dialog.handlers.selectTransferAsset(false)}/>
          <label htmlFor="tick">Tick</label>
        </div>
        {chainselect}
        {wallet}
      </div>
    } else if (props.dialog.type === "withdraw") {
      let backingChecked = props.dialog.params.backing ? "checked" : ""
      let tickChecked = props.dialog.params.tick ? "checked" : ""
      if (backingChecked || tickChecked) {
        chainselect = <div className="select-wrapper">
          <Select
            id="ibc-chain-select"
            onChange={props.dialog.handlers.selectChain}
            value={props.dialog.params.chain}
            options={props.dialog.params.chains}
          />
        </div>
        if (props.dialog.params.chain !== undefined) {
          if (backingChecked) {
            note = "This wallet is on the destination chain (" + props.dialog.params.chainid + ") and is controlled by the same signing key as your Microtick wallet."
          }
          if (tickChecked) {
            note = "This wallet is on the destination chain and is controlled by the same signing key as your Microtick wallet. Withdrawn TICK tokens will show up as " + props.dialog.params.tickThere + " on the destination chain (" + props.dialog.params.chainid + ")."
          }
          wallet = <div className="table-wrapper">
            <ReactToolTip/>
            <p className="wallet-address" data-tip={note} data-class="ibc-tip">{props.dialog.params.wallet}</p>
            <table>
              <tbody>
                <tr>
                </tr>
                <tr>
                  <td>Available for withdrawal</td>
                  <td>{props.dialog.params.balance} {props.dialog.params.tokenlabel}</td>
                </tr>
                <tr>
                  <td>Amount to withdraw</td>
                  <td><input id="ibc-withdraw-amount" type="number" size={12} value={props.dialog.params.transferAmount} onChange={props.dialog.handlers.updateTransferAmount}/></td>
                </tr>
              </tbody>
            </table>
          </div>
          if (parseFloat(props.dialog.params.transferAmount) > 0) {
            action = <button className="button" onClick={() => props.dialog.submit()}>Submit</button>
          }
        }
      }
      header = <div className="header ibc">
        <div className="title ibc">Withdraw IBC Tokens</div> 
        <div>
          Withdrawal Type:
          <input type="radio" id="backing" name="ibc-asset" value="backing" checked={backingChecked} onChange={() => props.dialog.handlers.selectTransferAsset(true)}/>
          <label htmlFor="backing">Backing</label>
          <input type="radio" id="tick" name="ibc-asset" value="tick" checked={tickChecked} onChange={() => props.dialog.handlers.selectTransferAsset(false)}/>
          <label htmlFor="tick">Tick</label>
        </div>
        {chainselect}
        {wallet}
      </div>
    } else if (props.dialog.type === "submitted") {
      closelabel = "Ok"
      header = <div className="header ibc">
        <div className="title ibc">IBC Transfer Submitted</div>
        <p>The transaction has been submitted and your transaction hash is:</p>
        <p className="hash">{props.dialog.params.hash}</p>
        <p>A relayer will pick up the transfer and the balance should be reflected on the destination chain soon.</p>
      </div>
    }
    dialog = <div id="fullscreen">
      <div id="modal" className={props.dialog.type}>
        {header}
        <div className="buttons">
          {action}
          <button className="button" onClick={() => props.closeDialog()}>{closelabel}</button>
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
      <p data-tip={staketip}>Stake = {Math.round10(props.stake, -6)} tick</p>
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
  var deposit = <button id="depositbutton" onClick={() => props.IBCDeposit()}>IBC Deposit</button>
  var withdraw = <button id="withdrawbutton" onClick={() => props.IBCWithdraw()}>IBC Withdrawal</button>
  const urlParams = new URLSearchParams(window.location.search)
  const apiServer = urlParams.get('apiServer')
  if (process.env.MICROTICK_EXPLORER !== "off" && apiServer === null) {
    var block_height = <a target="_blank" rel="noopener noreferrer" href={process.env.MICROTICK_EXPLORER + "/blocks/" + props.block}>{props.block}</a>
    var chain_id = <a target="_blank" rel="noopener noreferrer" href={process.env.MICROTICK_EXPLORER}>{props.chainid}</a>
    var account_addr = <a target="_blank" rel="noopener noreferrer" href={process.env.MICROTICK_EXPLORER + "/account/" + props.account}>{props.account}</a>
  } else {
    block_height = props.block
    chain_id = props.chainid
    account_addr = props.account
  }
  return <div id="gui">
    {interact}
    <section id="ui"> 
      <div id="notifications">
        {notifications}
      </div>
    </section>
    {dialog}
    <div id="page-header">
      <a href="https://microtick.com" alt="Microtick"><img src={logo} alt="logo"/></a>
      <nav role="navigation">
        <a href="https://microtick.com">Home</a>
        <a href="https://microtick.com/background-information.html">Learn More</a>
        <a href="https://microtick.com/how-to-table-of-contents.html">How To</a>
	      <a href="https://microtick.com/alpha/docs/">Docs</a>
	      <a href="https://microtick.com/frequently-asked-questions-1.html">FAQ</a>
        <span className="current">Get Started</span>
        <a href="https://microtick.com/contact.html">Contact</a>
      </nav>
    </div>
    <div id="page-subheader">
      <div id="div-chain">
        <h3>Chain Information</h3>
        <p>Chain = {chain_id}</p>
        <p>Block height = {block_height} <span className="right">{props.time}</span></p>
        <p>Block hash = <span className="sm">{props.hash}</span></p>
        <p>Microtick community: <a href="https://t.me/microtick_general" target="_blank" rel="noopener noreferrer">https://t.me/microtick_general</a></p>
      </div>
      <div id="div-account">
        <ReactToolTip/>
        <h3>Account Information</h3>
        <div id="transact">
          <a target="_blank" rel="noopener noreferrer" href="https://cosmos.network/ibc">
            <img data-tip="Deposits / withdrawals now use Cosmos IBC interchain transfers." src={IBC} alt="Cosmos/IBC"/>
          </a>
          {deposit}
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
      <p>Copyright &copy; 2018-2021 Microtick LLC</p>
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
    closeNotification,
    updateSpot,
    updatePremium,
    depositBacking,
    cancelQuote,
    closeDialog,
    settleTrade,
    menuSelected,
    IBCDeposit,
    IBCWithdraw
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
