import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import { withRouter } from "react-router-dom"
import axios from 'axios'
import axiosRetry from 'axios-retry';
import ProgressBar from './../components/ProgressBar.js'

import { FontSize, ItemSize, theme } from './../Styling.js'

axiosRetry(axios, {
	retries: 3,
	retryDelay: axiosRetry.exponentialDelay,
});


class Tiltseek extends React.Component {

	constructor(props) {
		super(props)

		var quotes = [
			`"Stats are good, winning is better" - Faker... probably`,
			`"We'll use Tiltseeker for week 2 at Worlds" - Every NA Team`,
			`"Please be our friend" - Amumu`,
			`"Camp someone who flames as much as Brand" - Bjergsen... probably`,
			`"Camp someone toxic. Like my sister, Cassiopeia" - Katarina`,
			`"Would you like a tent?" - Losing Midlaner`,
			`"Our midlaner has less vision than I do" - Lee Sin`,
			`"With Tiltseeker, you can transform into something better" - Kayn`,
			`"Camp someone who has no mana" - Tyler1... maybe`,
			`"Keep camping. See what happens." - Someone you should keep camping`,
			`"Tiltseeker seems fair and balanced." - CertainlyT`,
		]

		var params = new URLSearchParams(this.props.location.search)
		this.state = {
			region: params.get('region'),
			summonerName: params.get('summonerName'),
			stage: 'loading',
			progress: 0,
			totalProgress: 28,
			quote: quotes[Math.floor(Math.random() * quotes.length)],
			errMsg: '',

			summonerData: null,
			currentGame: null,
			championMasteries: null,
			rankedInfo: null,
			championHistories: null,
			lossStreakHistories: null,
			currentGameVersion: null,
			championData: null,
			championStats: null,
		}
		if (process.env.NODE_ENV === 'development') {
			axios.defaults.baseURL = 'http://localhost:3001/api/' + this.state.region
		} else {
			axios.defaults.baseURL = window.location.protocol + '//' + window.location.host + '/api/' + this.state.region
		}
	}

	incrementProgress = (amt=1) => {
		this.setState(state => {
			return { progress: this.state.progress + amt }
		})
	}

	componentDidMount() {

		var summonerData = null
		var currentGame = null
		var championMasteries = []
		var accountInfo = null
		var rankedInfo = []
		var championHistories = null
		var lossStreakHistories = null

		var currentGameVersion = null
		var championData = null
		var championStats = {}

		var errMsg = ''

		axios.get('/lol/summoner/v4/summoners/by-name/' + this.state.summonerName)
		.then(res => {
			this.incrementProgress(1)
			summonerData = res.data
			console.log(summonerData)
			return axios.get('/lol/spectator/v4/active-games/by-summoner/' + summonerData.id)
		})

		// Get all players' account info
		.then((res) => {
			this.incrementProgress(1)
			currentGame = res.data
			console.log(currentGame)
			var accountInfoLookups = []
			for (var [i, participant] of Object.entries(currentGame.participants)) {
				accountInfoLookups.push(axios.get('/lol/summoner/v4/summoners/' + participant.summonerId))
			}
			return axios.all(accountInfoLookups)
		})

		// Load champion masteries
		.then(res => {
			this.incrementProgress(1)
			accountInfo = res.map(single => {
				return single.data
			})
			console.log(accountInfo)
			var masteryLookups = []
			console.log(currentGame.participants)
			for (let [i, participant] of Object.entries(currentGame.participants)) {
				masteryLookups.push(
					axios.get('/lol/champion-mastery/v4/champion-masteries/by-summoner/' + participant.summonerId + '/by-champion/' + participant.championId)
					.then((res) => {
						championMasteries[i] = res.data
					}).
					catch((err) => {
						console.log(err)
					})
				)
			}
			return axios.all([res, axios.all(masteryLookups)])
		})

		// Load ranked info
		.then(res => {
			this.incrementProgress(1)
			var rankedLookups = []
			for (let [i, participant] of Object.entries(currentGame.participants)) {
				rankedLookups.push(
					axios.get('/lol/league/v4/entries/by-summoner/' + participant.summonerId)
					.then((res) => {
						rankedInfo[i] = res.data[0]
					}).
					catch((err) => {
						console.log(err)
					})
				)
			}
			return axios.all([res, axios.all(rankedLookups)])
		})

		//  Load championHistories with last games played on current champion
		.then(res => {
			this.incrementProgress(1)
			console.log(rankedInfo)
			console.log(championMasteries)
			var historyLookups = []
			for (var [i, participant] of Object.entries(currentGame.participants)) {
				historyLookups.push(
					axios.get('/lol/match/v4/matchlists/by-account/' + accountInfo[i].accountId + '?champion=' + participant.championId + '&endIndex=30&queue=400&queue=420&queue=430&queue=440')
					.catch(err => {
						console.log('err')
					})
				)
			}
			return axios.all(historyLookups)
		})
		.then(res => {
			var fullHistoryLookups = []
			console.log(res)
			var matchCount = res.reduce((total, player) => total + (player ? player.data.matches.length : 0), 0)
			for (var player of res) {
				var matchSet = []
				if (player === undefined) {
					fullHistoryLookups.push(undefined)
				} else {
					for (var match of player.data.matches) {
						matchSet.push(new Promise((resolve, reject) => {
							// fix to load matches that were played in different regions
							axios.get(
								axios.defaults.baseURL.replace(/[^/]*$/, '') +
								match.platformId.toLowerCase() +
								'/lol/match/v4/matches/' + match.gameId
							)
							.then(data => {
								this.incrementProgress(15/matchCount)
								resolve(data)
							})
							.catch(err => reject(err))
						}))
					}
					fullHistoryLookups.push(axios.all(matchSet))
				}
			}
			return axios.all(fullHistoryLookups)
		})
		.then(res => {
			this.incrementProgress(1)
			championHistories = res.map((hist) => hist === undefined ? undefined : hist.map((game) => {
				return game.data
			}))
			console.log(championHistories)
			return res
		})

		// Load lossStreakHistories with last 5 games for each account
		.then(res => {
			this.incrementProgress(1)
			console.log(championMasteries)
			var historyLookups = []
			for (var [i, participant] of Object.entries(currentGame.participants)) {
				historyLookups.push(
					axios.get('/lol/match/v4/matchlists/by-account/' + accountInfo[i].accountId + '?endIndex=5')
					.catch(err => {
						console.log('err')
					})
				)
			}
			return axios.all(historyLookups)
		})
		.then(res => {
			this.incrementProgress(1)
			var fullHistoryLookups = []
			console.log(res)
			for (var player of res) {
				var matchSet = []
				if (player === undefined) {
					fullHistoryLookups.push(undefined)
				} else {
					for (var match of player.data.matches) {
						matchSet.push(axios.get('/lol/match/v4/matches/' + match.gameId))
						// axios.get('/lol/match/v4/matches/' + match.gameId)
						// .then(res => {})
						// .catch(err => {console.log(err)})
					}
					fullHistoryLookups.push(axios.all(matchSet))
				}
			}
			return axios.all(fullHistoryLookups)
		})
		.then(res => {
			this.incrementProgress(1)
			lossStreakHistories = res.map((hist) => hist === undefined ? undefined : hist.map((game) => {
				return game.data
			}))
			console.log(lossStreakHistories)
			return res
		})

		// Load currentGameVersion, championData, and championStats
		.then(res => {
			this.incrementProgress(1)
			return axios.get('https://ddragon.leagueoflegends.com/api/versions.json')
		})
		.then(res => {
			this.incrementProgress(1)
			currentGameVersion = res.data[0]
			return axios.get(`https://ddragon.leagueoflegends.com/cdn/${currentGameVersion}/data/en_US/champion.json`)
		})
		.then(res => {
			this.incrementProgress(1)
			championData = res.data.data
			for (var champ of Object.keys(championData)) {
				championData[championData[champ].key] = championData[champ]
			}
			console.log(res.data.data)
			return axios.get('/stats')
		})
		.then(res => {
			this.incrementProgress(1)
			for (var champ of res.data) {
				championStats[champ._id] = champ
			}
			console.log(championStats)
			this.setState({
				summonerData: summonerData,
				currentGame: currentGame,
				championMasteries: championMasteries,
				rankedInfo: rankedInfo,
				championHistories: championHistories,
				lossStreakHistories: lossStreakHistories,
				currentGameVersion: currentGameVersion,
				championData: championData,
				championStats: championStats,
				stage: 'loaded',
			})
			return
		})


		.catch(err => {
			console.log(err)
			if (err.response.config.url.includes('/lol/summoner/v4/summoners/by-name/') && err.response.status === 404) {
				errMsg = `An account with name "${this.state.summonerName}" does not exist. Make sure the region is correct!`
			} else if (err.response.config.url.includes('/lol/spectator/v4/active-games/by-summoner/') && err.response.status === 404) {
				errMsg = `"${this.state.summonerName}" is not in game. Make sure the region is correct!`
			} else {
				errMsg = err.response.statusText
			}
			console.log(errMsg)
			this.setState({ errMsg: errMsg, stage: 'error' })
		})
	}

	render() {
		// console.log(this.state.progress)
		loadStyles(this.props.theme)
		return (
			<div className={css(styles.container)}>
				{ this.state.stage == 'loading' ? (
					<>
						<div className={css(styles.loadingText)}>
							{this.state.quote}
						</div>
						<ProgressBar
							progress={this.state.progress}
							percent={this.state.totalProgress == 0 ? 0 : this.state.progress/this.state.totalProgress}
							theme={this.props.theme}
						/>
					</>
				) : null }
				{ this.state.stage == 'loaded' ? (
					<DataDisplay
						theme={this.props.theme}
						summonerData={this.state.summonerData}
						currentGame={this.state.currentGame}
						championMasteries={this.state.championMasteries}
						rankedInfo={this.state.rankedInfo}
						championHistories={this.state.championHistories}
						lossStreakHistories={this.state.lossStreakHistories}
						currentGameVersion={this.state.currentGameVersion}
						championData={this.state.championData}
						championStats={this.state.championStats}
					/>
				) : null }
				{ this.state.stage == 'error' ? (
					<>
						<div className={css(styles.errContainer)}>
							<div className={css(styles.errText)}>
								{this.state.errMsg}
							</div>
						</div>
						<div className={css(styles.tryAgainButton)}>
							<div
								className={css(styles.tryAgainText)}
								onClick={() => this.props.history.push('/')}
							>
								{'Back'}
							</div>
						</div>
					</>
				) : null }
	    </div>
	  );
	}
}

class DataDisplay extends React.Component {

	constructor(props) {
		super(props)
		// summonerData
		// currentGame
		// championMasteries
		// rankedInfo
		// championHistories
		// lossStreakHistories
		// currentGameVersion
		// championData
		// championStats
	}


	getPercentile = (val, avg, std) => {
		var getZPercentile = (z) => {

			// z == number of standard deviations from the mean

			// if z is greater than 6.5 standard deviations from the mean the
			// number of significant digits will be outside of a reasonable range

			if (z < -6.5) {
				return 0.0;
			}

			if (z > 6.5) {
				return 1.0;
			}

			var factK = 1;
			var sum = 0;
			var term = 1;
			var k = 0;
			var loopStop = Math.exp(-23);

			while(Math.abs(term) > loopStop) {
				term = .3989422804 * Math.pow(-1,k) * Math.pow(z,k) / (2 * k + 1) / Math.pow(2,k) * Math.pow(z,k+1) / factK;
				sum += term;
				k++;
				factK *= k;
			}

			sum += 0.5;

			return sum;
		}

		return getZPercentile((val-avg)/std)
	}

	calcLosingStreak = (player, numeric=false) => {
		var streak = 0
		var history = this.props.lossStreakHistories[player[1]]
		var lastGameTime = Date.now()
		for (var i = 0; i < history.length; i++) {
			var win = history[i].participants[history[i].participantIdentities.filter(participant => {
				return participant.player.summonerId == player[0].summonerId
			})[0].participantId - 1].stats.win
			if (!win && lastGameTime - history[i].gameCreation < 12 * 60 * 60 * 1000) {
				streak += 1
				lastGameTime = history[i].gameCreation
			} else {
				break
			}
		}
		return streak
	}

	calcWinRate = (player, numeric=false) => {
		var i = player[1]
		var rankedInfo = this.props.rankedInfo
		if (rankedInfo[i]) {
			var winRate = 100*rankedInfo[i].wins/(rankedInfo[i].wins+rankedInfo[i].losses)
			if (numeric) {
				return winRate/100
			}
			return `${winRate.toFixed(1)}% (${rankedInfo[i].wins}/${rankedInfo[i].wins+rankedInfo[i].losses})`
		} else {
			if (numeric) {
				return null
			}
			return 'not ranked'
		}
	}

	calcMasteryPoints = (player, numeric=false) => {
		if (this.props.championMasteries[player[1]]) {
			if (numeric) {
				return this.props.championMasteries[player[1]].championPoints
			}
			return this.props.championMasteries[player[1]].championPoints.toLocaleString()
		} else {
			return 0
		}
	}

	calcLastPlayed = (player, numeric=false) => {
		if (this.props.championMasteries[player[1]]) {
			var timeSince = ((Date.now() - this.props.championMasteries[player[1]].lastPlayTime)/(24 * 60 * 60 *1000))
			if (numeric) {
				return timeSince
			}
			return `${timeSince.toFixed(0)} day${timeSince == 1 ? '' : 's'} ago`
		} else {
			if (numeric) {
				return null
			}
			return 'never'
		}
	}

	calcAggression = (player, numeric=false) => {
		var champId = player[0].championId
		var typical = this.props.championStats[champId]
		if (!this.props.championHistories[player[1]] || this.props.championHistories[player[1]].length < 10) {
			if (numeric) {
				return null
			}
			return 'not enough data'
		}
		var percentiles = []
		for (var match of this.props.championHistories[player[1]]) {
			var participant = match.participants[match.participantIdentities.filter(participant => {
				return participant.player.summonerId == player[0].summonerId
			})[0].participantId - 1]

			percentiles.push((this.getPercentile(
				participant.stats.totalDamageDealtToChampions/match.gameDuration,
				typical.totalDamageDealtToChampionsPerSecAvg,
				typical.totalDamageDealtToChampionsPerSecStdDev,
			) + this.getPercentile(
				participant.stats.totalDamageTaken/match.gameDuration,
				typical.totalDamageTakenPerSecAvg,
				typical.totalDamageTakenPerSecStdDev,
			))/2)
		}
		var percent = (100 * percentiles.reduce((a, b) => a + b) / percentiles.length)
		if (numeric) {
			return percent/100
		}
		return `${percent.toFixed(0)}%${percentiles.length < 20 ? ' ?' : ''}`
	}

	calcWarding = (player, numeric=false) => {
		var champId = player[0].championId
		var typical = this.props.championStats[champId]
		if (!this.props.championHistories[player[1]] || this.props.championHistories[player[1]].length < 10) {
			if (numeric) {
				return null
			}
			return 'not enough data'
		}
		var percentiles = []
		for (var match of this.props.championHistories[player[1]]) {
			var participant = match.participants[match.participantIdentities.filter(participant => {
				return participant.player.summonerId == player[0].summonerId
			})[0].participantId - 1]

			percentiles.push(this.getPercentile(
				participant.stats.visionScore/match.gameDuration,
				typical.visionScorePerSecAvg,
				typical.visionScorePerSecStdDev,
			))
		}
		var percent = (100 * percentiles.reduce((a, b) => a + b) / percentiles.length)
		if (numeric) {
			return percent/100
		}
		return `${percent.toFixed(0)}%${percentiles.length < 20 ? ' ?' : ''}`
	}

	calcTiltScore = (player) => {
		var tiltArr = []

		var losingStreak = this.calcLosingStreak(player, true)
		if (losingStreak !== null) {
			tiltArr.push(1 - 1/(Math.pow(2,losingStreak)))
		}

		var winRate = this.calcWinRate(player, true)
		if (winRate !== null) {
			tiltArr.push(1 - winRate)
		}

		var masteryPoints = this.calcMasteryPoints(player, true)
		if (masteryPoints !== null) {
			tiltArr.push(1/(Math.pow(2,masteryPoints/7000)))
		}

		var lastPlayed = this.calcLastPlayed(player, true)
		if (lastPlayed !== null) {
			tiltArr.push(1 - 1/(Math.pow(2,lastPlayed/20)))
		} else {
			tiltArr.push(1)
		}

		var aggression = this.calcAggression(player, true)
		if (aggression !== null) {
			tiltArr.push(aggression)
		}

		var warding = this.calcWarding(player, true)
		if (warding !== null) {
			tiltArr.push(1 - warding)
		}
		console.log(tiltArr)

		if (tiltArr.length >= 5) {
			var tiltScore = 100 * tiltArr.reduce((prev, curr) => prev + curr) / tiltArr.length
			return `${tiltScore.toFixed(1)}%`
		} else {
			return 'not enough data'
		}
	}

	makeTeam = (team) => {
		var playerDisplay = team.map(player => (
			<div className={css(styles.playerDisplayContainer)}>
				<div className={css(styles.championIconContainer)}>
					<img
						className={css(styles.championIcon)}
						src={
							'https://ddragon.leagueoflegends.com/cdn/' +
							this.props.currentGameVersion + '/img/champion/' +
							this.props.championData[`${player[0].championId}`].id +
							'.png'
						}
					/>
					{player[0].summonerName}
				</div>
				{[
					this.calcLosingStreak,
					this.calcWinRate,
					this.calcMasteryPoints,
					this.calcLastPlayed,
					this.calcAggression,
					this.calcWarding,
					this.calcTiltScore,
				].map((data, i) => (
					<div className={css(styles.field)} style={{ backgroundColor: i % 2 == 0 ? theme('primary2', this.props.theme) : null }}>
						{data(player)}
					</div>
				))}
			</div>
		))

		var titles = [
			'Losing Streak',
			'Ranked Win Rate',
			'Mastery Points',
			'Last Played',
			'Aggression',
			'Warding',
			'Tilt Score'
		].map((title, i) => (
			<div className={css(styles.fieldTitle)} style={{ backgroundColor: i % 2 == 0 ? theme('primary2', this.props.theme) : null }}>
				{title}
			</div>
		))

		var dmgMagic = 0
		var dmgPhysical = 0
		var dmgTrue = 0
		var dmgTotal = 0

		team.map(player => {
			dmgMagic += this.props.championStats[player[0].championId].magicDamageDealtToChampionPerSecsAvg
			dmgPhysical += this.props.championStats[player[0].championId].physicalDamageDealtToChampionsPerSecAvg
			dmgTrue += this.props.championStats[player[0].championId].trueDamageDealtToChampionsPerSecAvg
			dmgTotal += this.props.championStats[player[0].championId].magicDamageDealtToChampionPerSecsAvg
			dmgTotal += this.props.championStats[player[0].championId].physicalDamageDealtToChampionsPerSecAvg
			dmgTotal += this.props.championStats[player[0].championId].trueDamageDealtToChampionsPerSecAvg
		})

		return (
			<div className={css(styles.teamContainer)}>
				<div style={{ flex: 1 }}/>
				<div className={css(styles.teamWrapper)}>
					<div
						className={css(styles.teamSide)}
						style={{
							color: team.length > 0 ? (team[0][0].teamId == 100 ? theme('accent3', this.props.theme) : theme('accent4', this.props.theme)) : '',
						}}
					>
						{team.length > 0 ? (team[0][0].teamId == 100 ? 'BLUE SIDE' : 'RED SIDE') : ''}
					</div>
					<div className={css(styles.damageContainer)}>
						<div
							className={css(styles.damageBarComponent)}
							style={{
								flex: dmgMagic/dmgTotal,
								backgroundColor: theme('accent3', this.props.theme),
							}}
						>
							{`${(100*dmgMagic/dmgTotal).toFixed(1)}% AP`}
						</div>
						<div
							className={css(styles.damageBarComponent)}
							style={{
								flex: dmgPhysical/dmgTotal,
								backgroundColor: theme('accent4', this.props.theme),
							}}
						>
							{`${(100*dmgPhysical/dmgTotal).toFixed(1)}% AD`}
						</div>
						<div
							className={css(styles.damageBarComponent)}
							style={{
								flex: dmgTrue/dmgTotal,
								backgroundColor: '#fbfbfb',
							}}
						>
							{`${(100*dmgTrue/dmgTotal).toFixed(1)}%`}
						</div>
					</div>
					<div className={css(styles.fieldsContainer)}>
						<div style={{ width: 105 }}/>
						{titles}
					</div>
					{playerDisplay}
				</div>
				<div style={{ flex: 2 }}/>
			</div>
		)
	}

	render() {
		loadStyles(this.props.theme)

		var team1 = this.props.currentGame.participants.map((participant, index) => {
			return [participant, index]
		}).filter(participant => participant[0].teamId == 100)
		var team2 = this.props.currentGame.participants.map((participant, index) => {
			return [participant, index]
		}).filter(participant => participant[0].teamId == 200)



		return (
			<div className={css(styles.dataDisplayContainer)}>
				{this.makeTeam(team1)}
				{this.makeTeam(team2)}
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
			flexDirection: 'column',
			flex: 1,
			alignItems: 'center',
	  },
		loadingText: {
			color: theme('text1', t),
			textAlign: 'center',
			paddingLeft: 20,
			paddingRight: 20,
			transition: 'background-color 0.25s, color 0.25s',
			marginTop: 200,
			marginBottom: 50,
			...FontSize.large,
		},
		errContainer: {
			margin: '200px 20px 50px 20px',
			borderRadius: 20,
			borderWidth: 8,
			borderStyle: 'solid',
			borderColor: theme('accent1', t, true),
			display: 'flex',
			backgroundColor: theme('primary1', t),
			alignItems: 'center',
			justifyContent: 'center',
			transition: 'background-color 0.25s, color 0.25s, border-color 0.25s',
		},
		errText: {
			...FontSize.large,
			color: theme('text1', t),
			padding: '40px 25px',
			transition: 'background-color 0.25s, color 0.25s, border-color 0.25s',
		},
		tryAgainButton: {
			borderRadius: 5,
			borderWidth: 2,
			borderStyle: 'solid',
			borderColor: theme('accent1', t, true),
			display: 'flex',
			backgroundColor: theme('primary1', t),
			alignItems: 'center',
			justifyContent: 'center',
			transition: 'background-color 0.25s, color 0.25s, border-color 0.25s',
			':hover': {
				borderColor: theme('inputHighlight2', t, true),
				backgroundColor: theme('inputHighlightBackground', t),
				cursor: 'pointer',
			},
		},
		tryAgainText: {
			...FontSize.medium,
			color: theme('text1', t),
			padding: '10px 15px',
			transition: 'background-color 0.25s, color 0.25s, border-color 0.25s',
		},
		dataDisplayContainer: {
			...FontSize.mediumSmall,
			display: 'flex',
			alignSelf: 'stretch',
			flex: 1,
			flexWrap: 'wrap',
			justifyContent: 'space-evenly',
		},
		teamContainer: {
			display: 'flex',
			flexDirection: 'column',
			...ItemSize.large,
			justifyContent: 'center',
		},
		teamWrapper: {
			borderStyle: 'solid',
			borderWidth: 5,
			borderRadius: 10,
			borderColor: theme('inputHighlight', t, true),
			backgroundColor: theme('primary1', t),
			transition: 'background-color 0.25s, border-color 0.25s, color 0.25s',
			display: 'flex',
			flexDirection: 'column',
			marginTop: 25,
		},
		playerDisplayContainer: {
			display: 'flex',
			height: '8vh',
			borderColor: theme('inputHighlight', t, true),
			transition: 'background-color 0.25s, border-color 0.25s, color 0.25s',
			borderStyle: 'solid',
			borderWidth: '2px 0px 0px 0px',
		},
		championIconContainer: {
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			wordBreak: 'break-all',
			textAlign: 'center',
			height: '8vh',
			width: 105,
			...FontSize.small,
			color: theme('text1', t),
			transition: 'background-color 0.25s, border-color 0.25s, color 0.25s',
		},
		championIcon: {
			height: '5vh',
			width: '5vh',
			borderRadius: 5,
		},
		fieldsContainer: {
			display: 'flex',
			height: 50,
			borderColor: theme('inputHighlight', t, true),
			transition: 'background-color 0.25s, border-color 0.25s, color 0.25s',
			borderStyle: 'solid',
			borderWidth: '2px 0px 0px 0px',
		},
		fieldTitle: {
			display: 'flex',
			flex: 1,
			alignItems: 'center',
			justifyContent: 'center',
			textAlign: 'center',
			wordBreak: 'break-word',
			color: theme('text1', t),
			transition: 'background-color 0.25s, border-color 0.25s, color 0.25s',
			marginTop: 0.5,
		},
		field: {
			display: 'flex',
			flex: 1,
			padding: '0px 8px',
			alignItems: 'center',
			justifyContent: 'center',
			textAlign: 'center',
			wordBreak: 'break-word',
			color: theme('text1', t),
			transition: 'background-color 0.25s, border-color 0.25s, color 0.25s',
			marginTop: 0.5,
		},
		damageContainer: {
			height: 18,
			display: 'flex',
			transition: 'background-color 0.25s, border-color 0.25s, color 0.25s',
			margin: '0px 20px 20px 20px',
			borderRadius: 10,
			overflow: 'hidden',
		},
		damageBarComponent: {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			paddingBottom: 2,
		},
		teamSide: {
			...FontSize.extraLarge,
			fontFamily: 'Alegreya Sans',
			fontWeight: 600,
			textAlign: 'center',
			marginTop: 10,
			marginBottom: 10,
		}
	});
}


export default withRouter(Tiltseek);
