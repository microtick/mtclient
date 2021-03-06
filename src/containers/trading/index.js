import React from 'react'
import ReactToolTip from 'react-tooltip'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { selectMarket, selectDur, buyCall, buyPut, placeQuote, cancelDialog,
  changeQtyCall, changeQtyPut, changeBacking,
  changeSpot, changePremium } from '../../modules/microtick'
import { closeDialog } from '../../modules/dialog'
import Select from 'react-select'
import Chart from './chart'
import ActiveTrades from './activetrades'
import ActiveQuotes from './activequotes'

// css
import "./index.css"
import 'react-select/dist/react-select.css'

require('./misc.js')

const commonName = {
  300: "5 minute",
  600: "10 minute",
  900: "15 minute",
  1800: "30 minute",
  3600: "1 hour",
  7200: "2 hour",
  14400: "4 hour",
  28800: "8 hour",
  43200: "12 hour",
  86400: "1 day"
}

class Home extends React.Component {
  render() {
    const props = this.props
    var dialog = null
    if (props.dialog.showinline === true) {
      const qty = props.premiums.qty
      const cost = qty * props.premiums.prem
      const tooltip_quantity = "Units to purchase"
      const tooltip_averprem = "Average price paid on quote prices used to fill the order"
      const tooltip_cost = "Cost = Average Premium * Quantity"
      const qtystep = Math.pow(10, Math.floor(Math.log10(qty / 10)))
      if (props.dialog.type === "call") {
        if (props.account === undefined) {
          var actions = <div>
            <span className="error">No account selected</span>
            <button onClick={() => { props.closeDialog(); props.cancelDialog() }}>Cancel</button>
          </div>
        } else {
          actions = <div>
            <button onClick={() => { props.closeDialog(); props.cancelDialog() }}>Cancel</button>
            <button onClick={() => { props.closeDialog(); props.buyCall() }}>Buy Call</button>
          </div>
        }
        dialog = <div id="dialog" className="buy">
          <ReactToolTip/>
          <div className="inner call">
            <h3><span className="hint_call">Buy Call?</span></h3>
            <table>
              <tbody>
                <tr>
                  <td>Market</td>
                  <td></td>
                  <td>{props.market}</td>
                </tr>
                <tr>
                  <td>Duration</td>
                  <td></td>
                  <td>{commonName[props.dur]}</td>
                </tr>
                <tr>
                  <td data-tip={tooltip_quantity}>Quantity</td>
                  <td></td>
                  <td>⚖&nbsp;
                    <input type="number" id="buy-qty" onChange={props.changeQtyCall} 
                      value={Math.round10(qty, props.constants.UNIT_PRECISION)} step={qtystep}/>
                  </td>
                </tr>
                <tr>
                  <td data-tip={tooltip_averprem}>Avg Premium</td>
                  <td></td>
                  <td>⇑ <span id="avg-prem">{Math.round10(props.premiums.prem, props.constants.UNIT_PRECISION)}</span></td>
                </tr>
                <tr>
                  <td data-tip={tooltip_cost}>Cost</td>
                  <td></td>
                  <td><span id="buy-cost" className="cost">{Math.round10(cost, props.constants.TOKEN_PRECISION)} {props.token}</span></td>
                </tr>
              </tbody>
            </table>
            {actions}
          </div>
        </div>
      }
      if (props.dialog.type === "put") {
        if (props.account === undefined) {
          actions = <div>
            <span className="error">No account selected</span>
            <button onClick={() => { props.closeDialog(); props.cancelDialog() }}>Cancel</button>
          </div>
        } else {
          actions = <div>
            <button onClick={() => { props.closeDialog(); props.cancelDialog() }}>Cancel</button>
            <button onClick={() => { props.closeDialog(); props.buyPut() }}>Buy Put</button>
          </div>
        }
        dialog = <div id="dialog" className="buy">
          <ReactToolTip/>
          <div className="inner put">
            <h3><span className="hint_put">Buy Put?</span></h3>
            <table>
              <tbody>
                <tr>
                  <td>Market</td>
                  <td></td>
                  <td>{props.market}</td>
                </tr>
                <tr>
                  <td>Duration</td>
                  <td></td>
                  <td>{commonName[props.dur]}</td>
                </tr>
                <tr>
                  <td data-tip={tooltip_quantity}>Quantity</td>
                  <td></td>
                  <td>⚖&nbsp; 
                    <input type="number" id="buy-qty" onChange={props.changeQtyPut} 
                      value={Math.round10(qty, props.constants.UNIT_PRECISION)} step={qtystep}/>
                  </td>
                </tr>
                <tr>
                  <td data-tip={tooltip_averprem}>Avg Premium</td>
                  <td></td>
                  <td>⇓ <span id="avg-prem">{Math.round10(props.premiums.prem, props.constants.UNIT_PRECISION)}</span></td>
                </tr>
                <tr>
                  <td data-tip={tooltip_cost}>Cost</td>
                  <td></td>
                  <td><span id="buy-cost" className="cost">{Math.round10(cost, props.constants.TOKEN_PRECISION)} {props.token}</span></td>
                </tr>
              </tbody>
            </table>
            {actions}
          </div>
        </div>
      }
      if (props.dialog.type === "quote") {
        const weight = props.premiums.weight
        const newspot = props.premiums.indicatedSpot
        const tooltip_weight = "Weight = Quantity"
        const tooltip_newspot = "New Spot = (Market Spot * Market Weight + Spot * Weight) / (Market Weight + Weight)"
        const premstep = Math.pow(10, Math.floor(Math.log10(props.premiums.prem))-1)
        const spotstep = premstep
        if (props.account === undefined) {
          actions = <div>
            <span className="error">No account selected</span>
            <button onClick={() => { props.closeDialog(); props.cancelDialog() }}>Cancel</button>
          </div>
        } else {
          actions = <div>
            <button onClick={() => { props.closeDialog(); props.cancelDialog() }}>Cancel</button>
            <button onClick={() => { props.closeDialog(); props.placeQuote() }}>Place Quote</button>
          </div>
        }
        const backingStep = Math.pow(10, Math.floor(Math.log10(props.quote.backing))-1)
        dialog = <div id="dialog" className="quote">
          <ReactToolTip/>
          <div className="inner quote">
            <h3><span className="hint_quote">Place Quote?</span></h3>
            <table>
              <tbody>
                <tr>
                  <td>Market</td>
                  <td></td>
                  <td>{props.market}</td>
                </tr>
                <tr>
                  <td>Duration</td>
                  <td></td>
                  <td>■ {commonName[props.dur]}</td>
                </tr>
                <tr>
                  <td>Backing</td>
                  <td></td>
                  <td>
                    <input type="number" id="quote-backing" onChange={props.changeBacking} value={Math.round10(props.quote.backing, props.constants.TOKEN_PRECISION)} step={backingStep}/> 
                    {props.token}
                  </td>
                </tr>
                <tr>
                  <td data-tip="Observed spot">Spot</td>
                  <td></td>
                  <td>@<input type="number" id="quote-spot" onChange={props.changeSpot} 
                    value={Math.round10(props.premiums.qs, props.constants.SPOT_PRECISION)} step={spotstep}/>
                  </td>
                </tr>
                <tr>
                  <td data-tip="Uncertainty">Premium</td>
                  <td></td>
                  <td>⇕&nbsp;<input type="number" id="quote-prem" onChange={props.changePremium} 
                    value={Math.round10(props.premiums.prem, props.constants.SPOT_PRECISION)} step={premstep}/>
                  </td>
                </tr>
                <tr>
                  <td data-tip={tooltip_weight}>Weight</td>
                  <td></td>
                  <td>⚖ {Math.round10(weight, props.constants.UNIT_PRECISION)} ({Math.round10(weight * 100 / props.weight, props.constants.UNIT_PRECISION)}%)</td>
                </tr>
                <tr>
                  <td data-tip={tooltip_newspot}>New Spot</td>
                  <td></td>
                  <td>@{Math.round10(newspot, props.constants.SPOT_PRECISION)}</td>
                </tr>
              </tbody>
            </table>
            {actions}
          </div>
        </div>
      }
    } else {
      if (props.selected && props.spot !== undefined && props.view.maxp > props.view.minp) {
        if (props.mousestate === 1) {
          var action = <div id="actioncontainer">
            <div id="actionpanel">
              <div id="action">
                <p className="hint_quote">Place Quote</p>
              </div>
              <p>⬅ / ➡ increase or decrease premium</p>
              <p>⬆ / ⬇ select your spot</p>
              <p>Click to fine tune and place order</p>
            </div>
          </div>
        }
        if (props.mousestate === 2) {
          action = <div id="actioncontainer">
            <div id="actionpanel">
              <div id="action">
                <p className="hint_call">Buy Call</p>
              </div>
              <p>⬅ / ➡ increase or decrease ⚖ quantity</p>
              <p>Click to fine tune and place order</p>
            </div>
          </div>
        }
        if (props.mousestate === 3) {
          action = <div id="actioncontainer">
            <div id="actionpanel">
              <div id="action">
                <p className="hint_put">Buy Put</p>
              </div>
              <p>⬅ / ➡ increase or decrease ⚖ quantity</p>
              <p>Click to fine tune and place order</p>
            </div>
          </div>
        }
      }
    }
    if (props.market !== '') {
      var instructions = <div id="instructions">
        <div className="row">
          <div className="section">
            <h5><span className="hint_quote">Place Quote</span></h5>
            <p>By placing a quote you are making a price assertion for the asset, backed by tokens,
            as well as a choosing a premium that reflects how fast you expect the asset's price to change over the duration of the quote. The
            green and red rectangles displayed in the Order Book to the right show the adjusted premiums based
            on how far your quote's price assertion is from the current consensus.</p>
            <h6>Instructions</h6>
            <ol>
              <li>Select the market you are interested in above.</li>
              <li>Select the time duration you are interested in from the table.</li>
              <li>Place a quote by hovering the mouse over the left hand side of the price chart. 
                 Choose the approximate spot price (center line) and premium (top and bottom lines) for
                 your quote.</li>
              <li>Click and a dialog will appear allowing you to specify the backing for the
                 quote, and fine-tune the spot and premium you want. Confirm the quote by clicking 
                 "Place Quote".</li>
            </ol>
          </div>
          <div className="section">
            <h5><span className="hint_call">⇑ Buy Call</span> / <span className="hint_put">Buy Put ⇓</span></h5>
            <p>By buying a call you make a multiple of the premium you pay based on how far the
            consensus price moves higher than the current value. Buying a put works the same way but
            you make a multiple of the premium based on how far the consensus price moves lower from the 
            current value.</p>
            <h6>Instructions</h6>
            <ol>
              <li>Select the market you are interested in above.</li>
              <li>Select the time duration you are interested in from the table.</li>
              <li>Buy a call or put by hovering the mouse over the Order Book. 
               To buy a call, hover above the current spot price indicated by the horizontal line. To buy a
               put, hover below the spot price.</li>
              <li>Click at the approximate amount and a dialog will appear allowing you to adjust the 
               quantity. Confirm the trade by clicking "Buy Call" or "Buy Put"</li>
            </ol>
          </div>
        </div>
      </div>
    }
    if (props.orderbook) {
      var elems = props.durs.sort((a,b) => {
        const intvalA = parseInt(a, 10)
        const intvalB = parseInt(b, 10)
        return intvalA - intvalB
      }).reduce((res,d,n) => {
        const intval = parseInt(d, 10)
        const clazz = parseInt(props.dur, 10) === intval ? " durselected" : ""
        const col = ((n%2) === 0) ? "odd" : "even"
        res.buttons.push(<td key={n}>
          <button onClick={() => props.selectDur(intval)} className={clazz}>■ {commonName[d]}</button>
        </td>)
        const back = isNaN(props.orderbook.totalBacking[d]) ? 0 : props.orderbook.totalBacking[d]
        const wt = isNaN(props.orderbook.totalWeight[d]) ? 0 : props.orderbook.totalWeight[d]
        const prem = wt === 0 ? 0 : back / (props.constants.LEVERAGE * wt)
        res.premiums.push(<td className={col} key={n}>⇕ {Math.round10(prem, props.constants.UNIT_PRECISION)}</td>)
        res.weights.push(<td className={"weight " + col} key={n}>⚖ {Math.round10(wt, props.constants.UNIT_PRECISION)}</td>)
        res.backing.push(<td className={col} key={n}>{Math.round10(back, props.constants.UNIT_PRECISION)} {props.token}</td>)
        return res
      },{
        buttons: [],
        premiums: [],
        weights: [],
        backing: []
      })
      var orderbook = <div id="div-order">
        <table>
          <thead>
            <tr>
              {elems.buttons}
            </tr>
          </thead>
          <tbody>
            <tr>
              {elems.weights}
            </tr>
          </tbody>
        </table>
      </div>
      /*
          <tbody>
            <tr>
              {elems.backing}
            </tr>
          </tbody>
          <tbody>
            <tr>
              {elems.premiums}
            </tr>
          </tbody>
      */
    }
    if (props.spot > 0) {
      const tooltip_marketmass = "Total token backing for this market"
      const tooltip_marketweight = "Sum of all the quote weights for this market (quote weight = premium / backing)"
      //const backing = Math.pow(10, Math.floor(Math.log10(props.quote.backing)))
        //<p id="movemarket">At the current market weight, a quote with backing of 
        //<input type="number" id="quote-backing" onChange={props.changeBacking} value={Math.round10(props.quote.backing, props.constants.TOKEN_PRECISION)} step={backing}/> 
        //&nbsp;{props.token} can move this market {Math.round10(props.quote.backing / (5 * props.weight), -6)} (at most)
        //</p>
      var spot = <div id="spot">
        <ReactToolTip/>
        <p id="spottext" className="actual">Consensus = @{Math.round10(props.spot, props.constants.SPOT_PRECISION)}</p>
        <p id="mass" className="consensus-data" data-tip={tooltip_marketmass}>Token Mass = {Math.round10(props.backing, props.constants.TOKEN_PRECISION)} {props.token}</p>
        <p id="weight" className="consensus-data" data-tip={tooltip_marketweight}>Weight = ⚖ {Math.round10(props.weight, props.constants.UNIT_PRECISION)} {props.token}/unit</p>
      </div>
    }
    var markets = props.markets.map(m => {
      return {
        value: m.name,
        label: m.name + ": " + m.description
      }
    })
    return <div id="div-trading">
      <div className="row">
        <div id="marketSelect">
          <div className="row">
            <div id="div-market">
              <h4>Market</h4>
              <Select
                id="market-select"
                onChange={props.selectMarket}
                value={props.market}
                options={markets}
              />
            </div>
            {action}
            {orderbook}
            <div id="controldiv">
              {spot}
            </div>
          </div>
          <div className="row">
            <div id="chartdiv">
              {dialog}
              <Chart token={props.token}/>
            </div>
          </div>
        </div>
      </div>
      <ActiveTrades token={props.token}/>
      <ActiveQuotes token={props.token}/>
      <div className="row">
        {instructions}
      </div>
    </div>
  }
}

const mapStateToProps = state => ({
  constants: state.app.constants,
  block: state.tendermint.block.number,
  markets: state.microtick.markets,
  market: state.microtick.market.symbol,
  spot: state.microtick.market.spot,
  selected: state.microtick.market.selected,
  view: state.microtick.chart.view,
  weight: state.microtick.market.weight,
  backing: state.microtick.market.backing,
  sumqty: state.microtick.market.sumqty,
  dur: state.microtick.market.dur,
  durs: state.microtick.market.durs,
  qtyAvail: state.microtick.market.qty,
  tradeQty: state.microtick.trade.qty,
  account: state.microtick.account,
  premiums: state.microtick.premiums,
  quote: state.microtick.quote,
  mousestate: state.microtick.chart.mouseState,
  orderbook: state.microtick.orderbook,
  dialog: state.dialog
})

const mapDispatchToProps = dispatch => bindActionCreators({
  selectMarket,
  selectDur,
  changeQtyCall,
  changeQtyPut,
  changeBacking,
  changeSpot,
  changePremium,
  buyCall,
  buyPut,
  placeQuote,
  cancelDialog,
  closeDialog
}, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Home)
