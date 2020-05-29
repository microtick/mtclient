import { cancelQuote as mtCancelQuote } from './microtick'
import { backQuote as mtBackQuote } from './microtick'
import { updateSpot as mtUpdateSpot, updatePremium as mtUpdatePremium, settleTrade as mtSettleTrade } from './microtick'

const BUYCALL = "dialog/buycall"
const BUYPUT = "dialog/buyput"
const PLACEQUOTE = "dialog/placequote"

const UPDATESPOTDIALOG = "dialog/updatespot"
const UPDATEPREMIUMDIALOG = "dialog/updatepremium"
const DEPOSITQUOTEDIALOG = "dialog/depositquote"
const CANCELQUOTEDIALOG = "dialog/cancelquote"
const SETTLETRADEDIALOG = "dialog/settletrade"
const FUNDACCOUNTDIALOG = "dialog/fundaccount"
const SENDTOKENSDIALOG = "dialog/sendtokens"
const WITHDRAWACCOUNTDIALOG = "dialog/withdrawaccount"
const CONFIRMWITHDRAW = "dialog/confirmwithdraw"
const INTERACTLEDGER = "dialog/interactledger"
const SHIFTSTART = "shift/start"
const SHIFTSTATUS = "shift/status"
const WAITWITHDRAW = "shift/waitwithdraw"
const WITHDRAWCOMPLETE = "shift/withdrawcomplete"
const ACCOUNT = "tendermint/account"

const CLOSEDIALOG = "dialog/close"

const initialState = {
  showinline: false,
  showmodal: false,
  showshift: false,
  showconfirm: false
}

export default (state = initialState, action) => {
  switch (action.type) {
    case INTERACTLEDGER:
      return {
        ...state,
        showinteract: action.value
      }
    case BUYCALL:
      return {
        ...state,
        showinline: true,
        showmodal: false,
        showshift: false,
        showconfirm: false,
        type: "call"
      }
    case BUYPUT:
      return {
        ...state,
        showinline: true,
        showmodal: false,
        showshift: false,
        showconfirm: false,
        type: "put"
      }
    case PLACEQUOTE:
      return {
        ...state,
        showinline: true,
        showmodal: false,
        showshift: false,
        showconfirm: false,
        type: "quote"
      }
    case CLOSEDIALOG:
      return {
        ...state,
        showinline: false,
        showmodal: false,
        showshift: false,
        showconfirm: false
      }
    case UPDATESPOTDIALOG:
      return {
        ...state,
        showinline: false,
        showmodal: true,
        showshift: false,
        showconfirm: false,
        type: "spot",
        id: action.id,
        defaultspot: action.defaultspot,
        premium: action.premium
      }
    case UPDATEPREMIUMDIALOG:
      return {
        ...state,
        showinline: false,
        showmodal: true,
        showshift: false,
        showconfirm: false,
        type: "premium",
        id: action.id,
        spot: action.spot,
        defaultpremium: action.defaultpremium
      }
    case DEPOSITQUOTEDIALOG:
      return {
        ...state,
        showinline: false,
        showmodal: true,
        showshift: false,
        showconfirm: false,
        type: "deposit",
        id: action.id,
        backing: 0
      }
    case CANCELQUOTEDIALOG:
      return {
        ...state,
        showinline: false,
        showmodal: true,
        showshift: false,
        showconfirm: false,
        type: "cancel",
        id: action.id
      }
    case SETTLETRADEDIALOG:
      return {
        ...state,
        showinline: false,
        showmodal: true,
        showshift: false,
        showconfirm: false,
        type: "settle",
        id: action.id
      }
    case FUNDACCOUNTDIALOG:
      return {
        ...state,
        showinline: false,
        showmodal: true,
        showshift: false,
        showconfirm: false,
        account: action.account,
        type: "fund"
      }
    case WITHDRAWACCOUNTDIALOG:
      return {
        ...state,
        showinline: false,
        showmodal: true,
        showshift: false,
        showconfirm: false,
        type: "withdraw",
        max: action.max,
        submit: action.submit
      }
    case SENDTOKENSDIALOG:
      return {
        ...state,
        showinline: false,
        showmodal: true,
        showshift: false,
        showconfirm: false,
        type: "send",
        max: action.max,
        submit: action.submit
      }
    case SHIFTSTART:
      return {
        ...state,
        showinline: false,
        showmodal: false,
        showshift: true,
        showconfirm: false,
        type: "start",
        from: action.from,
        to: action.to,
        account: action.account,
        remain: action.remain,
        close: action.close
      }
    case SHIFTSTATUS:
      return {
        ...state,
        showinline: false,
        showmodal: false,
        showshift: false,
        showconfirm: true,
        type: "shiftstatus",
        amount: action.amount,
        confirmations: action.confirmations,
        required: action.required,
        complete: action.complete
      }
    case CONFIRMWITHDRAW:
      return {
        ...state,
        showinline: false,
        showmodal: false,
        showshift: true,
        showconfirm: false,
        type: "confirm",
        amount: action.amount,
        account: action.account,
        close: action.close,
        confirm: action.confirm
      }
    case WAITWITHDRAW:
      return {
        ...state,
        showinline: false,
        showmodal: false,
        showshift: false,
        showconfirm: true,
        type: "waitwithdraw"
      }
    case WITHDRAWCOMPLETE:
      return {
        ...state,
        showinline: false,
        showmodal: false,
        showshift: false,
        showconfirm: true,
        type: "withdrawcomplete",
        hash: action.hash,
        close: action.close
      }
    case ACCOUNT:
      if (action.reason === "receive") {
        return {
          ...state,
          showinline: false,
          showmodal: false,
          showshift: false,
          showconfirm: false
        }
      }
      return state
    default:
      return state
  }
}

export const buyCallDialog = () => {
  return async dispatch => {
    dispatch({
      type: BUYCALL
    })
  }
}

export const buyPutDialog = () => {
  return async dispatch => {
    dispatch({
      type: BUYPUT,
    })
  }
}

export const placeQuoteDialog = () => {
  return async dispatch => {
    dispatch({
      type: PLACEQUOTE,
    })
  }
}

export const updateSpotDialog = (id, dspot, prem) => {
  console.log("Update quote: " + id)
  return async dispatch => {
    dispatch({
      type: UPDATESPOTDIALOG,
      id: id,
      defaultspot: dspot,
      premium: prem
    })
  }
}

export const updatePremiumDialog = (id, dspot, prem) => {
  console.log("Update quote: " + id)
  return async dispatch => {
    dispatch({
      type: UPDATEPREMIUMDIALOG,
      id: id,
      spot: dspot,
      defaultpremium: prem
    })
  }
}

export const updateSpot = id => {
  return async dispatch => {
    const spot = parseFloat(document.getElementById('quote-spot').value)
    mtUpdateSpot(dispatch, id, spot)
    dispatch({
      type: CLOSEDIALOG
    })
  }
}

export const updatePremium = id => {
  return async dispatch => {
    const premium = parseFloat(document.getElementById('quote-premium').value)
    mtUpdatePremium(dispatch, id, premium)
    dispatch({
      type: CLOSEDIALOG
    })
  }
}

export const depositQuoteDialog = id => {
  return async dispatch => {
    dispatch({
      type: DEPOSITQUOTEDIALOG,
      id: id
    })
  }
}

export const depositBacking = id => {
  return async dispatch => {
    const amount = parseInt(document.getElementById('quote-backing').value, 10)
    mtBackQuote(dispatch, id, amount)
    dispatch({
      type: CLOSEDIALOG
    })
  }
}

export const cancelQuoteDialog = id => {
  return async dispatch => {
    dispatch({
      type: CANCELQUOTEDIALOG,
      id: id
    })
  }
}

export const cancelQuote = id => {
  return async dispatch => {
    console.log("Cancel quote: " + id)
    mtCancelQuote(dispatch, id)
    dispatch({
      type: CLOSEDIALOG
    })
  }
}

export const settleTradeDialog = id => {
  return async dispatch => {
    dispatch({
      type: SETTLETRADEDIALOG,
      id: id
    })
  }
}

export const settleTrade = id => {
  return async dispatch => {
    console.log("Settle trade: " + id)
    mtSettleTrade(dispatch, id)
    dispatch({
      type: CLOSEDIALOG
    })
  }
}

export const fundAccountDialog = () => {
  return async dispatch => {
    dispatch({
      type: FUNDACCOUNTDIALOG
    })
  }
}

export const closeDialog = () => {
  return async dispatch => {
    dispatch({
      type: CLOSEDIALOG
    })
  }
}

