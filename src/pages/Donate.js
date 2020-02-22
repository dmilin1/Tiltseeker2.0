import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import { withRouter } from "react-router-dom"

import { FontSize, theme } from './../Styling.js'

import profilePic from './../images/profilePic.jpg'

var stripe = window.Stripe('pk_live_n9tt3dAQE6pqrkzygut35k1Z')


class Donate extends React.Component {

	constructor() {
		super()
		this.state = {
			price: null,
		}
	}

	componentDidMount() {
		this.amountInput.select()

		var params = new URLSearchParams(this.props.location.search)
		if (params.get('donated') == 'true') {
			alert('Thank you for making Tiltseeker possible!')
		}
	}

	makeDonation(amt) {
		stripe.redirectToCheckout({
			items: [{sku: 'sku_GmMK7lAi6vfMnN', quantity: parseInt(amt)}],
			successUrl: window.location.protocol + '//tiltseeker.com/donate?donated=true',
			cancelUrl: window.location.protocol + '//tiltseeker.com/donate',
		})
		.then(function (result) {
			if (result.error) {
				alert(result.error.message)
			}
		})
	}

	render() {
		loadStyles(this.props.theme)

		var makeDonationButtons = () => {
			var buttons = [1, 5, 10, 25, 50, 100].map((amt) => {
				return (
					<div
						className={css(styles.donateButtons)}
						onClick={() => this.makeDonation(amt)}
						key={amt}
					>
						{'$' + amt}
					</div>
				)
			})
			return (
				<div className={css(styles.donateButtonsContainer)}>
					{buttons}
				</div>
			)
		}

		return (
			<div className={css(styles.container)}>
				<div className={css(styles.donationText)}>
					{`Tiltseeker is a passion project that I work on in my spare time. It is run entirely off of donations provided by generous and passionate League of Legends players. If you'd like to help support me in keeping Tiltseeker's servers running, you can donate through the form below. All donations are one time payments only.`}
					<br/>
					<br/>
					<br/>
					<div style={{ margin: '0px 40px', textAlign: 'center' }}>
						{`I really hate ads, and your support in keeping Tiltseeker beautiful and ad free for everyone is greatly appreciated.`}
					</div>
				</div>
				{makeDonationButtons()}
				<div className={css(styles.amountContainer)}>
					<input
						className={css(styles.amountInput)}
						value={ this.state.price ? '$' + this.state.price : '' }
						onChange={(e) => this.setState({ price: e.target.value.split('.')[0].replace(/\D/g,'') })}
						ref={(me) => {this.amountInput = me}}
						onKeyDown={e => e.key === 'Enter' ? this.makeDonation(this.state.price) : null}
						type="text"
						name="amount"
						placeholder="$"
					/>
				</div>
				<div
					className={css(styles.donateButton)}
					onClick={() => this.makeDonation(this.state.price)}
				>
					Donate
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
			alignItems: 'center',
			justifyContent: 'center',
			flexDirection: 'column',
			flex: 1,
	  },
		donationText: {
			color: theme('text1', t),
			...FontSize.medium,
			transition: 'background-color 0.25s, color 0.25s',
			width: '80%',
			'@media (min-width: 700px)': {
				width: '75%',
			},
			'@media (min-width: 900px)': {
				width: '70%',
			},
			'@media (min-width: 1100px)': {
				width: '65%',
			},
		},
		amountContainer: {
			paddingTop: 25,
			alignItems: 'center',
			justifyContent: 'center',
			maxWidth: 100,
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
		amountInput: {
			height: 50,
			paddingTop: '2%',
			paddingBottom: '2%',
			width: '100%',
			borderRadius: 10,
			outline: 'none',
			borderWidth: 2,
			borderStyle: 'solid',
			fontFamily: 'Montserrat',
			textAlign: 'center',
			...FontSize.large,
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
			},
			'::selection': {
				backgroundColor: '#CCC',
			},
		},
		donateButton: {
			display: 'flex',
			marginBottom: 200,
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
		donateButtonsContainer: {
			display: 'flex',
			alignItems: 'stretch',
			justifyContent: 'center',
			overflow: 'hidden',
			height: 35,
			marginTop: 65,
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
		donateButtons: {
			...FontSize.mediumSmall,
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
	});
}


export default withRouter(Donate);
