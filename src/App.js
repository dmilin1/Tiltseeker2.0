import React from 'react'
import { BrowserRouter, Route } from "react-router-dom";
import { StyleSheet, css } from 'aphrodite';
import cookie from 'react-cookies'
import axios from 'axios'
import axiosRetry from 'axios-retry';


import { regions } from './constants.js'

import { library } from '@fortawesome/fontawesome-svg-core'
// import { fab } from '@fortawesome/free-brands-svg-icons'
import { faHome, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons'


import Navbar from './components/Navbar.js'
import Home from './pages/Home.js'
import BestBans from './pages/BestBans.js'
import About from './pages/About.js'
import Donate from './pages/Donate.js'
import DesktopApp from './pages/DesktopApp.js'
import Tiltseek from './pages/Tiltseek.js'
import CompChecker from './pages/CompChecker.js'


library.add(faHome, faToggleOn, faToggleOff)

Array.range = (start, end) => Array.from({length: (end - start)}, (v, k) => k + start);


axiosRetry(axios, {
	retries: 3,
	retryDelay: axiosRetry.exponentialDelay,
});
if (process.env.NODE_ENV === 'development') {
	axios.defaults.baseURL = 'http://localhost:3001/api/na1'
} else {
	axios.defaults.baseURL = window.location.protocol + '//' + window.location.host + '/api/na1'
}

class App extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			theme: cookie.load('theme') || 'dark',
			regions: regions,
			selectedRegion: cookie.load('region') || {
				name: 'NA',
				code: 'na1',
			},
			summonerName: cookie.load('summonerName'),
		}
	}

	componentDidMount() {
		this.connectToServer()
	}

	connectToServer = () => {
		fetch('/')
	}

	setTheme = (theme) => {
		this.setState({ theme: theme })
		cookie.save('theme', theme)
	}

	setRegion = (region) => {
		this.setState({ selectedRegion: region })
		cookie.save('region', region)
	}

	setSummonerName = (summonerName) => {
		this.setState({ summonerName: summonerName })
		cookie.save('summonerName', summonerName)
	}

	render() {
		var params = new URLSearchParams(window.location.href)
		var desktop = params.get('desktop')
		return (
			<BrowserRouter>
				<div className={css(styles.flex)}>
					{!desktop ? (
						<Navbar
							theme={this.state.theme}
							setTheme={this.setTheme}
						/>
					) : null}
					<Route path="/" exact render={(props) => {return (
						<Home
							theme={this.state.theme}
							regions={this.state.regions}
							selectedRegion={this.state.selectedRegion}
							setRegion={this.setRegion}
							summonerName={this.state.summonerName}
							setSummonerName={this.setSummonerName}
						/>
					)}} />
					<Route path="/tiltseek/" render={(props) => {return (
						<Tiltseek
							theme={this.state.theme}
							regions={this.state.regions}
							desktop={desktop}
						/>
					)}} />
					<Route path="/about/" render={(props) => {return (
						<About
							theme={this.state.theme}
						/>
					)}} />
					<Route path="/desktopapp/" render={(props) => {return (
						<DesktopApp
							theme={this.state.theme}
						/>
					)}} />
					<Route path="/donate/" render={(props) => {return (
						<Donate
							theme={this.state.theme}
						/>
					)}} />
					<Route path="/bestbans/" render={(props) => {return (
						<BestBans
							theme={this.state.theme}
						/>
					)}} />
					<Route path="/compchecker/" render={(props) => {return (
						<CompChecker
							theme={this.state.theme}
							axios={axios}
						/>
					)}} />
		    </div>
			</BrowserRouter>
	  );
	}
}

export default App;



const styles = StyleSheet.create({
  flex: {
    display: 'flex',
		flex: 1,
		flexDirection: 'column',
		alignItems: 'stretch',
		minHeight: '100vh',
  },
});
