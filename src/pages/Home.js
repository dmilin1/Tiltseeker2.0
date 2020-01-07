import React from 'react'
import { StyleSheet, css } from 'aphrodite';
import { withRouter } from "react-router-dom";

import { FontSize, theme } from './../Styling.js';


class Home extends React.Component {

	componentDidMount() {
		this.summonerInput.select()
	}

	makeRegions = () => {
		var regions = this.props.regions.map((region) => {
			return (
				<div
					className={region.code === this.props.selectedRegion.code ? css(styles.region, styles.selectedRegion) : css(styles.region)}
					onClick={() => this.props.setRegion(region)}
					key={region.code}
				>
					{region.name}
				</div>
			)
		})
		return (
			<div className={css(styles.regionsContainer)}>
				{regions}
			</div>
		)
	}

	search = () => {
		this.props.history.push(
			'/tiltseek' +
			'?region=' + this.props.selectedRegion.code +
			'&summonerName=' + this.props.summonerName
		)
	}

	render() {
		loadStyles(this.props.theme)
		return (
			<div className={css(styles.container)}>
				<div className={css(styles.centering)}>
					<div className={css(styles.logo)}>
						<div className={css(styles.logoText)}>
							<span style={{fontStyle: 'oblique'}}>Tilt</span>seeker
						</div>
					</div>
					{this.makeRegions()}
					<div className={css(styles.summonerInputContainer)}>
						<input
							className={css(styles.summonerInput)}
							value={this.props.summonerName}
							onChange={(e) => this.props.setSummonerName(e.target.value)}
							ref={(me) => {this.summonerInput = me}}
							onKeyDown={e => e.key === 'Enter' ? this.search() : null}
							type="text"
							name="summonerName"
							placeholder="Summoner"
						/>
					</div>
					<div
						className={css(styles.searchButton)}
						onClick={() => this.search()}
					>
						Find Camping Spot
					</div>
				</div>
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
			justifyContent: 'center',
			flexDirection: 'column',
			flex: 1,
	  },
		centering: {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			flexDirection: 'column',
			marginTop: '-15%',
		},
		logo: {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			flex: 1,
		},
		logoText: {
			fontFamily: 'Roboto',
			fontStyle: 'bold',
			...FontSize.logo,
			fontWeight: 900,
			stroke: 'white',
			strokeWidth: 3,
			webkitTextStrokeWidth: 3,
			webkitTextStrokeColor: 'white',
			textShadow: '0 0 5px #BBB',
			textAlign: 'center',
		},
		summonerInputContainer: {
			display: 'flex',
			flex: 1,
			paddingTop: 25,
			alignItems: 'center',
			justifyContent: 'center',
			width: '60%',
			'@media (min-width: 600px)': {
				width: '50%',
			},
			'@media (min-width: 900px)': {
				width: '40%',
			},
			'@media (min-width: 1300px)': {
				width: '30%',
			},
		},
		summonerInput: {
			height: 20,
			paddingTop: '2%',
			paddingBottom: '2%',
			width: '100%',
			borderRadius: 10,
			outline: 'none',
			borderWidth: 2,
			borderStyle: 'solid',
			fontFamily: 'Montserrat',
			textAlign: 'center',
			...FontSize.medium,
			transition: 'background-color 0.25s, border-color 0.25s, color 0.25s',
			color: theme('text2', t, true),
			borderColor: theme('inputHighlight', t, true),
			backgroundColor: theme('primary1', t),
			':focus': {
				borderColor: theme('inputHighlight2', t, true),
				backgroundColor: theme('inputHighlightBackground', t),
			},
			':hover': {
				borderColor: theme('inputHighlight2', t, true),
				backgroundColor: theme('inputHighlightBackground', t),
			}
		},
		searchButton: {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			height: 35,
			...FontSize.medium,
			minWidth: '40%',
			'@media (min-width: 600px)': {
				minWidth: '30%',
			},
			'@media (min-width: 900px)': {
				minWidth: '20%',
			},
			'@media (min-width: 1300px)': {
				minWidth: '15%',
			},
			marginTop: 25,
			borderRadius: 10,
			outline: 'none',
			borderWidth: 2,
			borderStyle: 'solid',
			transition: 'background-color 0.25s, border-color 0.25s, color 0.25s',
			color: theme('text2', t, false),
			borderColor: theme('buttonAccent', t, false),
			backgroundColor: theme('button', t),
			':hover': {
				borderColor: theme('buttonHoveredAccent', t, false),
				backgroundColor: theme('buttonHovered', t),
				color: theme('text2', t, true),
				cursor: 'pointer',
			}
		},
		regionsContainer: {
			display: 'flex',
			alignItems: 'stretch',
			justifyContent: 'center',
			overflow: 'hidden',
			height: 40,
			borderRadius: 10,
			borderWidth: 2,
			borderStyle: 'solid',
			outline: 'none',color: theme('text2', t, false),
			backgroundColor: theme('buttonAccent', t, false),
			borderColor: theme('buttonAccent', t, false),
			minWidth: '60%',
			'@media (min-width: 600px)': {
				minWidth: '50%',
			},
			'@media (min-width: 900px)': {
				minWidth: '45%',
			},
			'@media (min-width: 1300px)': {
				minWidth: '40%',
			},
		},
		region: {
			...FontSize.small,
			flex: 1,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			color: theme('text2', t, false),
			cursor: 'pointer',
			backgroundColor: theme('button', t),
			transition: 'background-color 0.15s, border-color 0.25s, color 0.25s',
			':hover': {
				borderColor: theme('buttonHoveredAccent', t, false),
				backgroundColor: theme('buttonHovered', t),
				color: theme('accent3', t, true),
				cursor: 'pointer',
			},
			':active': {
				backgroundColor: theme('buttonPressed', t),
			}
		},
		selectedRegion: {
			color: theme('text2', t, true),
			':hover': {
				color: theme('text2', t, true),
			},
		},
	});
}


export default withRouter(Home);
