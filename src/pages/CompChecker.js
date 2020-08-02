import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import { withRouter } from "react-router-dom"
import axios from 'axios'
import axiosRetry from 'axios-retry';

import { FontSize, ItemSize, theme } from '../Styling.js'

import WinRateCalc from '../utils/WinRateCalc'

axiosRetry(axios, {
	retries: 3,
	retryDelay: axiosRetry.exponentialDelay,
});


class CompChecker extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			stats: null,
			championData: null,
			championDataUnfilled: null,
			currentGameVersion: null,
			loadingProgress: 'inProgress',
			inputStates: {},
			inputTexts: {},
			highlightIndex: 0,
		}
		this.inputs = {}
		this.highlightedChamp = null
	}

	async componentWillMount() {
		try {
			var currentGameVersion = (await axios.get('https://ddragon.leagueoflegends.com/api/versions.json')).data[0]

			var championDataUnfilled = (await axios.get(`https://ddragon.leagueoflegends.com/cdn/${currentGameVersion}/data/en_US/champion.json`)).data.data
			var championData = JSON.parse(JSON.stringify(championDataUnfilled))


			for (var champ of Object.keys(championData)) {
				championData[championData[champ].key] = championData[champ]
				championData[championData[champ].name] = championData[champ]
			}

			var stats = (await this.props.axios.get('/stats')).data

			console.log(stats)
			console.log(championData)

			var loadingProgress = 'complete'
			this.setState({ stats, championData, currentGameVersion, championDataUnfilled, loadingProgress })
		} catch {
			this.setState({ loadingProgress: 'fail' })
		}
	}

	render() {
		loadStyles(this.props.theme)

		if (this.state.loadingProgress == 'complete') {
			var probabilityInput = {
				allyTeam: {
					picks: {}
				},
				opponentTeam: {
					picks: {}
				}
			}
	
			Object.entries(this.inputs).forEach(entry => {
				var num = parseInt(entry[0])
				var champStr = entry[1].value
				var champ = this.state.championData[champStr]
	
				if (champ) {
					probabilityInput[num < 5 ? 'allyTeam' : 'opponentTeam']['picks'][num] = { championId: champ.key }
				}
			})
	
			var probabilityData = WinRateCalc.calcProbability(probabilityInput, this.state.stats)
			var winRate = probabilityData.probability || 0.5
			var totalSamples = probabilityData.totalSamples
	
			return (
				<div className={css(styles.container)}>
					<div
						className={css(styles.inputsContainer)}
						onKeyDown={e => {
							switch (e.keyCode) {
								case 38: // up arrow
									this.setState({ highlightIndex: this.state.highlightIndex - 1 })
									break
								case 40: // down arrow
									this.setState({ highlightIndex: this.state.highlightIndex + 1 })
									break
								case 13: // enter key
									var position = Object.entries(this.state.inputStates).filter(entry => entry[1] == 'focused')[0][0]
									if (this.highlightedChamp) {
										this.inputs[position].value = this.highlightedChamp.name
										this.inputs[position].blur()
									}
									break
							}
						}}
					>
						{ [0,1].map(team => (
							<div className={css(styles.teamContainer)}>
								<div
									className={css(styles.percentageText)}
									style={{
										color: team == 0 ? theme('accent3', this.props.theme) : theme('accent4', this.props.theme),
									}}
								>
									{((team == 0 ? winRate : 1 - winRate ) * 100).toFixed(1) + '%'}
								</div>
								{Array.range(0 + 5 * team, 5 + 5 * team).map(i => (
									<div className={css(styles.inputContainer)}>
										<input
											className={css(styles.input)}
											key={i}
											ref={me => this.inputs[i] = me}
											style={this.state.championData[this.inputs[i] && this.inputs[i].value] ? {
												background: `url('https://ddragon.leagueoflegends.com/cdn/${this.state.currentGameVersion}/img/champion/${this.state.championData[this.inputs[i].value].id}.png') 4px 3px/34px 34px no-repeat scroll`,
											} : {}}
											onFocus={e => this.setState({
												inputStates: {
													...this.state.inputStates,
													[i]: 'focused',
												},
												highlightIndex: 0,
											})}
											onBlur={e => setTimeout(() => this.setState({ inputStates: {
												...this.state.inputStates,
												[i]: 'blurred',
											}}), 100)}
											onChange={
												text => this.setState({ inputTexts: {
													...this.state.inputTexts,
													[i]: this.inputs[i].value,
												}})
											}
										/>
										{ this.state.inputStates[i] == 'focused' ? (
											<div className={css(styles.champListContainer)}>
												{ Object.values(this.state.championDataUnfilled).sort((a, b) => {
													var searchStr = this.state.inputTexts[i] ? this.state.inputTexts[i].toLowerCase() : ''
													var scores = [a, b].map(champ => {
														var targetStr = champ.name.toLowerCase()
														var score = 0
														var startsWithCounter = 0
														while (targetStr.startsWith(searchStr.slice(0, startsWithCounter)) && startsWithCounter < searchStr.length + 1) {
															startsWithCounter += 1
														}
														score += startsWithCounter * 10
														searchStr.split('').forEach(searchChar => {
															targetStr.split('').forEach(targetChar => {
																if (searchChar == targetChar) {
																	score += 1
																}
															})
														})
	
														if (targetStr.includes(searchStr)) {
															score += 100
														}
														
														return score
													})
													return scores[1] - scores[0]
												}).map((champ, j) => {
													if (this.state.highlightIndex == j) {
														this.highlightedChamp = champ
													}
													return (
														<div
															className={css(styles.champListItem)}
															onClick={e => {
																this.inputs[i].value = champ.name
															}}
															style={this.state.highlightIndex == j ? {
																backgroundColor: theme('accent1', this.props.theme)
															} : {}}
														>
															<img className={css(styles.champListPic)} src={`https://ddragon.leagueoflegends.com/cdn/${this.state.currentGameVersion}/img/champion/${champ.id}.png`}/>
															{champ.name}
														</div>
													)
												})}
											</div>
										) : null}
									</div>
								))}
							</div>
							
						))}
					</div>
					{`${totalSamples} matches used in calculation`}
				</div>
			);
		} else if (this.state.loadingProgress == 'fail') {
			return (
				<div className={css(styles.container)}>
					{'Failed to load'}
				</div>
			)
		} else {
			return (
				<div className={css(styles.container)}/>
			)
		}
		
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
			color: theme('text1', t),
		},
		inputsContainer: {
			display: 'flex',
			width: '100%',
			margin: 20,
			maxWidth: 1200,
			gridTemplateColumns: 'repeat(5, 20% [col-start])',
		},
		teamContainer: {
			display: 'flex',
			alignItems: 'center',
			flex: 1,
			flexDirection: 'column',
			margin: 10,
		},
		percentageText: {
			...FontSize.medium,
		},
		inputContainer: {
			display: 'flex',
			justifyContent: 'center',
			flex: 1,
			width: '100%',
			margin: 15,
		},
		input: {
			backgroundColor: theme('inputHighlightBackground', t),
			color: theme('text1', t),
			textAlign: 'center',
			outline: 'none',
			borderWidth: 2,
			borderStyle: 'solid',
			fontFamily: 'Montserrat',
			borderColor: theme('inputHighlight', t, true),
			borderRadius: 5,
			width: '50vw',
			maxWidth: 350,
			height: 40,
			padding: 0,
			margin: 0,
			...FontSize.mediumSmall,
		},
		champListContainer: {
			backgroundColor: theme('primary1', t),
			position: 'absolute',
			width: '50vw',
			maxWidth: 350,
			flex: 1,
			height: 300,
			overflowY: 'scroll',
			marginTop: 45,
		},
		champListItem: {
			display: 'flex',
			alignItems: 'center',
			margin: '2px 0px',
			color: theme('text1', t),
			cursor: 'pointer',
			':hover': {
				backgroundColor: theme('accent1', t),
			},
		},
		champListPic: {
			width: 30,
			height: 30,
			marginRight: 5,
		}
	});
}


export default withRouter(CompChecker);
