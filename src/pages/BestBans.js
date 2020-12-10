import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import { withRouter } from "react-router-dom"
import axios from 'axios'
import axiosRetry from 'axios-retry';

import { FontSize, theme } from './../Styling.js'

import profilePic from './../images/profilePic.jpg'

var stripe = window.Stripe('pk_live_n9tt3dAQE6pqrkzygut35k1Z')


axiosRetry(axios, {
	retries: 3,
	retryDelay: axiosRetry.exponentialDelay,
});


class BestBans extends React.Component {

	constructor() {
		super()
		this.state = {
			
		}

		if (process.env.NODE_ENV === 'development') {
			axios.defaults.baseURL = 'http://localhost:3001/api/' + this.state.region
		} else {
			axios.defaults.baseURL = window.location.protocol + '//' + window.location.host + '/api/na'
		}
	}

	async componentDidMount() {
		try {

			// Load currentGameVersion, championData, and championStats
			
			var currentGameVersion = (await axios.get('https://ddragon.leagueoflegends.com/api/versions.json')).data[0]

			var championData = (await axios.get(`https://ddragon.leagueoflegends.com/cdn/${currentGameVersion}/data/en_US/champion.json`)).data.data
			
			for (var champ of Object.keys(championData)) {
				championData[championData[champ].key] = championData[champ]
			}

			var stats = (await axios.get('/stats')).data
			this.setCalculatedBans(stats, championData)
		} catch (e) {
			console.log(e)
		}
	}

	setCalculatedBans(stats, championData) {
		var results = {}

		var champStats = stats.champStats

		var totalMatches = champStats.reduce((sum, champ) => sum + champ.count, 0)/10

		console.log(totalMatches)

		console.log(champStats)

		console.log(championData)

		for (var champ of champStats) {
			results[champ._id] = {
				influence: 10000 * ( champ.winRateAvg - 0.5 ) * ( champ.count / totalMatches ) / ( 1 - (champ.banRateAvg ?? 0) ),
				pickRate: champ.count / totalMatches,
				winRate: champ.winRateAvg,
				banRate: champ.banRateAvg ?? '?',
			}
		}

		this.setState({
			calculations: results,
			championData: championData,
		})
	}

	render() {
		loadStyles(this.props.theme)

		return (
			<div className={css(styles.container)}>
				{ this.state.championData ? (
					<>
						<div className={css(styles.picturesContainer)}>
							{Object.entries(this.state.calculations).sort((a, b) => b[1].influence - a[1].influence).slice(0, 16).map((arr, i) => {
								var champId = arr[0]
								var data = arr[1]
								return (
									<div className={css(styles.pictureContainer)}>
										<img className={css(styles.picture)} src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${this.state.championData[champId].id}_0.jpg`}/>
										<div key={champId}>
											<div style={{ fontWeight: 600, fontSize: 17, }}>
												{`
													#${i + 1} 
													${this.state.championData[champId].name}
												`}
											</div>
											<div style={{ fontWeight: 300, fontSize: 15, }}>
											{`Influence: ${data.influence.toFixed(0)}`}
											</div>
											<div style={{ fontWeight: 300, fontSize: 15, }}>
											{`Win Rate: ${(data.winRate * 100).toFixed(2)}%`}
											</div>
											<div style={{ fontWeight: 300, fontSize: 15, }}>
											{`Pick Rate: ${(data.pickRate * 100).toFixed(2)}%`}
											</div>
											<div style={{ fontWeight: 300, fontSize: 15, }}>
											{`Ban Rate: ${(data.banRate * 100).toFixed(2)}%`}
											</div>
										</div>
									</div>
								)
							})}
						</div>
						
						<div className={css(styles.explanationText)}>

							Players often ban emotionally based on frusturation, perceived power, and popular opinion. But these ban choices are rarely ideal for winning. This list contains the ideal bans assuming nothing is known about what champions will be chosen. It's important to note that there are a few scenarios where these are not the best bans. For example, banning out a teammate's champion and causing tilt or banning a high influence champion if you know your team will counter pick them.

							<div style={{ marginTop: 15 }}/>

							Ideal ban strategy is to ban champions with a high winrate who also have a high playrate. In this list, "Influence" represents the average losses per 10,000 games that you can expect due to that champion being on the other team. By banning that champion, you are in effect negating those losses.

						</div>
						
						<div className={css(styles.statsContainer)}>
							<div
								className={css(styles.champStatContainer)}
								style={{
									borderStyle: 'solid',
									borderWidth: '0px 0px 1px 0px',
									paddingBottom: 10,
								}}
							>
								<div style={{ fontWeight: 600, fontSize: 18, flex: 1 }}>
								{`#`}
								</div>
								<div style={{ fontWeight: 600, fontSize: 18, flex: 5 }}>
									{`Name`}
								</div>
								<div style={{ fontWeight: 600, fontSize: 18, flex: 5 }}>
									{`Influence`}
								</div>
								<div style={{ fontWeight: 600, fontSize: 18, flex: 5 }}>
									{`Win Rate`}
								</div>
								<div style={{ fontWeight: 600, fontSize: 18, flex: 5 }}>
									{`Pick Rate`}
								</div>
								<div style={{ fontWeight: 600, fontSize: 18, flex: 5 }}>
									{`Ban Rate`}
								</div>
							</div>
							{Object.entries(this.state.calculations).sort((a, b) => b[1].influence - a[1].influence).map((arr, i) => {
								var champId = arr[0]
								var data = arr[1]
								return (
									<div className={css(styles.champStatContainer)}>
										<div style={{ fontWeight: 300, fontSize: 16, flex: 1 }}>
										{`${i + 1}`}
										</div>
										<div style={{ fontWeight: 400, fontSize: 16, flex: 5 }}>
											{`${this.state.championData[champId].name}`}
										</div>
										<div style={{ fontWeight: 300, fontSize: 16, flex: 5 }}>
											{`${data.influence.toFixed(0)}`}
										</div>
										<div style={{ fontWeight: 300, fontSize: 16, flex: 5 }}>
											{`${(data.winRate * 100).toFixed(2)}%`}
										</div>
										<div style={{ fontWeight: 300, fontSize: 16, flex: 5 }}>
											{`${(data.pickRate * 100).toFixed(2)}%`}
										</div>
										<div style={{ fontWeight: 300, fontSize: 16, flex: 5 }}>
											{`${(data.banRate * 100).toFixed(2)}%`}
										</div>
									</div>
								)
							})}
						</div>
					</>
				) : null }
	    	</div>
		);
	}
}

var styles = null;

var loadStyles = (t) => {
	styles = StyleSheet.create({
		container: {
			backgroundColor: theme('bg1', t),
			transition: 'background-color 0.25s, color 0.25s',
			display: 'flex',
			alignItems: 'stretch',
			justifyContent: 'center',
			flexDirection: 'column',
			flex: 1,
		},
		picturesContainer: {
			display: 'grid',
			gridTemplateColumns: 'auto auto auto auto',
			gridTemplateRows: 'auto',
			columnGap: 10,
			rowGap: 30,
			justifyItems: 'center',
			marginTop: 40,
			'@media (min-width: 1100px)': {
				width: 1100,
				alignSelf: 'center',
			},
		},
		pictureContainer: {
			width: '20vw',
			maxWidth: 200,
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			textAlign: 'center',
			color: theme('text2', t, true),
		},
		picture: {
			maxWidth: '100%',
			maxHeight: '300px',
		},
		statsContainer: {
			display: 'grid',
			gridTemplateColumns: 'auto',
			gridTemplateRows: 'auto',
			columnGap: 10,
			rowGap: 10,
			borderStyle: 'solid',
			borderColor: theme('accent1', t),
			backgroundColor: theme('primary1', t),
			padding: '10px 5px',
			margin: '30px 0 30px 0',
			'@media (min-width: 600px)': {
				margin: '30px 5vw 30px 5vw',
			},
			'@media (min-width: 1000px)': {
				width: 850,
				alignSelf: 'center',
			},
		},
		champStatContainer: {
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			textAlign: 'center',
			color: theme('text2', t, true),
		},
		explanationText: {
			color: theme('text1', t),
			fontSize: 18,
			margin: '30px 10px 0 10px',
			'@media (min-width: 600px)': {
				margin: '30px 5vw 0 5vw',
			},
			borderStyle: 'solid',
			borderColor: theme('accent1', t),
			borderRadius: 5,
			padding: '15px 25px',
			backgroundColor: theme('primary1', t),
			'@media (min-width: 1100px)': {
				width: 945,
				alignSelf: 'center',
			},
		}
	})
}


export default withRouter(BestBans);
