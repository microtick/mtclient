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

const CLOSEDIALOG = "dialog/close"

const initialState = {
  showinline: false,
  showmodal: false
}

export default (state = initialState, action) => {
  switch (action.type) {
    case BUYCALL:
      return {
        ...state,
        showinline: true,
        type: "call"
      }
    case BUYPUT:
      return {
        ...state,
        showinline: true,
        type: "put"
      }
    case PLACEQUOTE:
      return {
        ...state,
        showinline: true,
        type: "quote"
      }
    case CLOSEDIALOG:
      return {
        ...state,
        showinline: false,
        showmodal: false
      }
    case UPDATESPOTDIALOG:
      return {
        ...state,
        showmodal: true,
        type: "spot",
        id: action.id,
        defaultspot: action.defaultspot,
        premium: action.premium
      }
    case UPDATEPREMIUMDIALOG:
      return {
        ...state,
        showmodal: true,
        type: "premium",
        id: action.id,
        spot: action.spot,
        defaultpremium: action.defaultpremium
      }
    case DEPOSITQUOTEDIALOG:
      return {
        ...state,
        showmodal: true,
        type: "deposit",
        id: action.id,
        backing: 0
      }
    case CANCELQUOTEDIALOG:
      return {
        ...state,
        showmodal: true,
        type: "cancel",
        id: action.id
      }
    case SETTLETRADEDIALOG:
      return {
        ...state,
        showmodal: true,
        type: "settle",
        id: action.id
      }
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

export const closeDialog = () => {
  return async dispatch => {
    dispatch({
      type: CLOSEDIALOG
    })
  }
}

