import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import { withRouter } from "react-router-dom"
import axios from 'axios'
import axiosRetry from 'axios-retry';

import { FontSize, theme } from './../Styling.js'

axiosRetry(axios, {
	retries: 3,
	retryDelay: axiosRetry.exponentialDelay,
});

class Tiltseek extends React.Component {

	constructor(props) {
		super(props)
		var params = new URLSearchParams(this.props.location.search)
		this.state = {
			region: params.get('region'),
			summonerName: params.get('summonerName'),
		}
		if (process.env.NODE_ENV === 'development') {
			axios.defaults.baseURL = 'http://localhost:3001/api/' + this.state.region
		} else {
			axios.defaults.baseURL = window.location.protocol + '//' + window.location.host + '/api/' + this.state.region
		}
	}

	componentDidMount() {
		var summonerData = null
		var currentGame = null
		var championMasteries = []
		var accountInfo = null
		var championHistories = null
		var lossStreakHistories = null

		var err = false
		var errMsg = ''

		axios.get('/lol/summoner/v4/summoners/by-name/' + this.state.summonerName)
		.then(res => {
			summonerData = res.data
			console.log(summonerData)
			return axios.get('/lol/spectator/v4/active-games/by-summoner/' + summonerData.id)
		})

		// Get all players' account info
		.then((res) => {
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

		//  Load championHistories with last games played on current champion
		.then(res => {
			console.log(championMasteries)
			var historyLookups = []
			for (var [i, participant] of Object.entries(currentGame.participants)) {
				historyLookups.push(
					axios.get('/lol/match/v4/matchlists/by-account/' + accountInfo[i].accountId + '?champion=' + participant.championId + '&endIndex=30')
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
			championHistories = res.map((hist) => hist === undefined ? undefined : hist.map((game) => {
				return game.data
			}))
			console.log(championHistories)
			return res
		})

		// Load lossStreakHistories with last 5 games for each account
		.then(res => {
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
			lossStreakHistories = res.map((hist) => hist === undefined ? undefined : hist.map((game) => {
				return game.data
			}))
			console.log(lossStreakHistories)
			return res
		})


		.catch(err => {
			console.log(err)
			if (err.response.config.url.includes('/lol/summoner/v4/summoners/by-name/') && err.response.status === 404) {
				err = true
				errMsg = 'Player does not exist.'
			} else if (err.response.config.url.includes('/lol/spectator/v4/active-games/by-summoner/') && err.response.status === 404) {
				err = true
				errMsg = 'Player not in game. Make sure the region is correct.'
			}
			console.log(err.response)
			console.log(errMsg)
		})
	}

	render() {
		loadStyles(this.props.theme)
		return (
			<div className={css(styles.container)}>
				Template
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
			flex: 1,
	  },
	});
}


export default withRouter(Tiltseek);
