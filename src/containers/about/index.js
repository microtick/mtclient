import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import './index.css'

const About = props => {
  return <div id="div-about">
    <h4>Microtick Decentralized Oracle</h4>
    <p>Game of Zones Release</p>
    <p className="just"><span className="title">Disclaimer of warranties.</span> Your use of this site, including any consensus prices, simulated contracts or trades contained therein, 
    is entirely at your own risk. This service is provided "As Is", and to the maximum extent
    permitted by applicable law, Microtick and its affiliates disclaim[s] all guarantees and warranties, whether 
    express, implied, or statutory regarding the site and related materials therein.</p>
  </div>
}

const mapStateToProps = state => ({
  version: state.tendermint.app.version
})

const mapDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(About)
