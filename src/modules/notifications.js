const NOTIFY_TESTTOKENS = "notifications/testtokens"
const NOTIFY_BUY = "notifications/buy"
const NOTIFY_PLACE = "notifications/place"
const NOTIFY_CANCEL = "notifications/cancel"
const NOTIFY_BACK = "notifications/back"
const NOTIFY_SPOT = "notifications/spot"
const NOTIFY_PREMIUM = "notifications/premium"
const NOTIFY_SETTLE = "notifications/settle"
const NOTIFY_SUCCESS = "notifications/success"
const NOTIFY_ERROR = "notifications/error"
const NOTIFY_REMOVE = "notifications/remove"
const NOTIFY_FAUCET_REQUEST = "notifications/faucetrequest"
const NOTIFY_FAUCET_LIMIT = "notifications/fauceterror"

var uuid = 1

const initialState = {
  list: []
}

export default (state = initialState, action) => {
  //console.log("action=" + action.type)
  //console.log("state=" + JSON.stringify(state,null,2))
  switch (action.type) {
  case NOTIFY_TESTTOKENS:
    var newdata = state.list.reduce((res, el) => {
      res.push({
        ...el
      })
      return res
    }, [])
    newdata.push({
      type: action.type === NOTIFY_TESTTOKENS ? 'testtokens' : 'approve',
      id: action.id,
      amt: action.amt
    })
    return {
      list: newdata
    }
  case NOTIFY_BUY:
    //console.log("ADD notification: id=" + action.id)
    newdata = state.list.reduce((res, el) => {
      res.push({
        ...el
      })
      return res
    }, [])
    newdata.push({
      type: 'buy',
      id: action.id,
      dir: action.dir,
      market: action.market,
      dur: action.dur,
      qty: Math.round10(action.qty, -4)
    })
    return {
      list: newdata
    }
  case NOTIFY_PLACE:
    newdata = state.list.reduce((res, el) => {
      res.push({
        ...el
      })
      return res
    }, [])
    newdata.push({
      ...action,
      type: 'place'
    })
    return {
      list: newdata
    }
  case NOTIFY_CANCEL:
    newdata = state.list.reduce((res, el) => {
      res.push({
        ...el
      })
      return res
    }, [])
    newdata.push({
      type: 'cancel',
      id: action.id
    })
    return {
      list: newdata
    }
  case NOTIFY_BACK:
    newdata = state.list.reduce((res, el) => {
      res.push({
        ...el
      })
      return res
    }, [])
    newdata.push({
      type: 'back',
      id: action.id,
      quote: action.quote,
      amount: action.amount
    })
    return {
      list: newdata
    }
  case NOTIFY_SPOT:
    newdata = state.list.reduce((res, el) => {
      res.push({
        ...el
      })
      return res
    }, [])
    newdata.push({
      type: 'spot',
      id: action.id,
      quote: action.quote,
      spot: action.spot
    })
    return {
      list: newdata
    }
  case NOTIFY_PREMIUM:
    newdata = state.list.reduce((res, el) => {
      res.push({
        ...el
      })
      return res
    }, [])
    newdata.push({
      type: 'premium',
      id: action.id,
      quote: action.quote,
      premium: action.premium
    })
    return {
      list: newdata
    }
  case NOTIFY_FAUCET_REQUEST:
    newdata = state.list.reduce((res, el) => {
      res.push({
        ...el
      })
      return res
    }, [])
    newdata.push({
      type: 'faucet',
      id: action.id,
      acct: action.acct
    })
    return {
      list: newdata
    }
  case NOTIFY_SETTLE:
    newdata = state.list.reduce((res, el) => {
      res.push({
        ...el
      })
      return res
    }, [])
    newdata.push({
      type: 'settle',
      id: action.id,
      tid: action.tid
    })
    return {
      list: newdata
    }
  case NOTIFY_SUCCESS:
    var msg = "Action successful"
    state.list.map(el => {
      if (el.id === action.ref) {
        if (el.type === 'buy') {
          msg = "Buy successful"
        }
        if (el.type === 'place') {
          msg = "Quote successfully placed"
        }
        if (el.type === 'cancel') {
          msg = "Quote canceled"
        }
        if (el.type === 'back') {
          msg = "Backing deposited"
        }
        if (el.type === 'update') {
          msg = "Spot updated"
        }
        if (el.type === 'faucet') {
          msg = "Account funded"
        }
      }
      return null
    })
    newdata = state.list.reduce((res, el) => {
      res.push({
        ...el
      })
      return res
    }, [])
    newdata.push({
      type: 'success',
      id: action.id,
      msg: msg
    })
    return {
      list: newdata
    }
  case NOTIFY_ERROR:
    newdata = state.list.reduce((res, el) => {
      res.push({
        ...el
      })
      return res
    }, [])
    newdata.push({
      type: 'error',
      id: action.id,
      msg: action.msg,
      tx: action.tx
    })
    return {
      list: newdata
    }
  case NOTIFY_FAUCET_LIMIT:
    newdata = state.list.reduce((res, el) => {
      res.push({
        ...el
      })
      return res
    }, [])
    newdata.push({
      type: 'faucetlimit',
      id: action.id
    })
    return {
      list: newdata
    }
  case NOTIFY_REMOVE:
    //console.log("REMOVE notification id=" + action.id)
    newdata = state.list.reduce((res, el) => {
      if (el.id !== action.id) {
        res.push({
          ...el
        })
      }
      return res
    }, [])
    return {
      list: newdata
    }
  default:
    return state
  }
}

export const createTestTokensNotification = (dispatch, amt) => {
  const uid = uuid++
  dispatch({
    type: NOTIFY_TESTTOKENS,
    id: uid,
    amt: amt
  })
  return uid
}

export const createBuyNotification = (dispatch, dir, market, dur, qty) => {
  const uid = uuid++
  dispatch({
    type: NOTIFY_BUY,
    id: uid,
    dir: dir,
    market: market,
    dur: dur,
    qty: qty
  })
  return uid
}

export const createPlaceQuoteNotification = (dispatch, market, dur, spot, premium, backing) => {
  const uid = uuid++
  dispatch({
    type: NOTIFY_PLACE,
    id: uid,
    market: market,
    dur: dur,
    spot: spot,
    premium: premium,
    backing: backing
  })
  return uid
}

export const createCancelQuoteNotification = (dispatch, id) => {
  const uid = uuid++
  dispatch({
    type: NOTIFY_CANCEL,
    id: uid,
    quote: id
  })
  return uid
}

export const createBackQuoteNotification = (dispatch, id, amount) => {
  const uid = uuid++
  dispatch({
    type: NOTIFY_BACK,
    id: uid,
    quote: id,
    amount: amount
  })
  return uid
}

export const createUpdateSpotNotification = (dispatch, id, spot) => {
  const uid = uuid++
  dispatch({
    type: NOTIFY_SPOT,
    id: uid,
    quote: id,
    spot: spot
  })
  return uid
}

export const createUpdatePremiumNotification = (dispatch, id, premium) => {
  const uid = uuid++
  dispatch({
    type: NOTIFY_PREMIUM,
    id: uid,
    quote: id,
    premium: premium
  })
  return uid
}

export const createSettleNotification = (dispatch, id) => {
  const uid = uuid++
  dispatch({
    type: NOTIFY_SETTLE,
    id: uid,
    tid: id
  })
  return uid
}

export const createSuccessNotification = (dispatch, timeout, ref) => {
  const uid = uuid++
  dispatch({
    type: NOTIFY_SUCCESS,
    id: uid,
    ref: ref
  })
  setTimeout(() => {
    dispatch({
      type: NOTIFY_REMOVE,
      id: uid
    })
  }, timeout)
}

export const createErrorNotification = (dispatch, msg, tx) => {
  const uid = uuid++
  dispatch({
    type: NOTIFY_ERROR,
    id: uid,
    msg: msg,
    tx: tx
  })
  return uid
}

export const removeNotification = (dispatch, notToRemove) => {
  dispatch({
    type: NOTIFY_REMOVE,
    id: notToRemove
  })
}

export const closeNotification = id => {
  return async dispatch => {
    dispatch({
      type: NOTIFY_REMOVE,
      id: id
    })
  }
}

export const createFaucetRequestNotification = (dispatch, acct) => {
  const uid = uuid++
  dispatch({
      type: NOTIFY_FAUCET_REQUEST,
      id: uid,
      acct: acct
  })
  return uid
}

export const createFaucetLimitNotification = (dispatch) => {
  const uid = uuid++
  dispatch({
    type: NOTIFY_FAUCET_LIMIT,
    id: uid
  })
  return uid
}
