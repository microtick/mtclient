import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import './index.css'

const About = props => {
  return <div id="div-about">
    <h4>Microtick Decentralized Oracle</h4>
    <p>Limited Testnet Release</p>
    <p>{props.version}</p>
    <p className="just"><span className="title">Confidential Information.</span> By accessing this site, you agree to keep all materials confidential.  You agree not to 
    disseminate or otherwise provide any material obtained from this site to any person not currently 
    an Authorized User defined as a user who has been granted access to this site. Prohibited dissemination 
    includes, but is not limited to, publishing or posting information, screenshots or other content 
    to other websites or any public site. Any non-confidential use must be authorized in writing and 
    in advance by either Microtick or its authorized representatives.</p>
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
