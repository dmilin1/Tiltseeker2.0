import React from 'react'
import { BrowserRouter, Route } from "react-router-dom";
import { StyleSheet, css } from 'aphrodite';
import cookie from 'react-cookies'


import { library } from '@fortawesome/fontawesome-svg-core'
// import { fab } from '@fortawesome/free-brands-svg-icons'
import { faHome, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons'


import Navbar from './components/Navbar.js'
import Home from './pages/Home.js'
import Tiltseek from './pages/Tiltseek.js'


library.add(faHome, faToggleOn, faToggleOff)




class App extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			theme: cookie.load('theme') || 'dark',
			regions: [
				{
					name: 'NA',
					code: 'na1',
				},
				{
					name: 'EUW',
					code: 'euw1',
				},
				{
					name: 'EUNE',
					code: 'eun1',
				},
				{
					name: 'BR',
					code: 'br1',
				},
				{
					name: 'TR',
					code: 'tr1',
				},
				{
					name: 'RU',
					code: 'ru',
				},
				{
					name: 'LAN',
					code: 'la1',
				},
				{
					name: 'LAS',
					code: 'la2',
				},
				{
					name: 'OCE',
					code: 'oc1',
				},
				{
					name: 'KR',
					code: 'kr',
				},
				{
					name: 'JP',
					code: 'jp1',
				},
			],
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
		return (
			<BrowserRouter>
				<div className={css(styles.flex)}>
					<Navbar
						theme={this.state.theme}
						setTheme={this.setTheme}
					/>
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

						/>
					)}} />
					<Route path="/about/" component={null} />
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
