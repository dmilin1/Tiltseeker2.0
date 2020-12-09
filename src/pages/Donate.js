import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import { withRouter } from "react-router-dom"

import { FontSize, theme } from './../Styling.js'

import profilePic from './../images/profilePic.jpg'
import axiosRetry from 'axios-retry'

// var stripe = window.Stripe('pk_live_n9tt3dAQE6pqrkzygut35k1Z')
var stripe = window.Stripe('pk_test_bvpzFNK36siET1hGtZkQosZ0')


class Donate extends React.Component {

	constructor() {
		super()
		this.state = {
			price: null,
			pricePerHour: 8, // M10 Tier at 10 GB is $0.08 / hour
			solventFor: null,
			daysBought: null,
		}
	}

	async componentDidMount() {
		this.amountInput.select()

		var params = new URLSearchParams(this.props.location.search)
		if (params.get('session_id')) {
			var donation = (await this.props.axios({
				method: 'post',
				url: '/submitDonation', 
				data: {
					sessionId: params.get('session_id')
				},
			})).data
			var money = this.amtAfterFees(donation.session.amount_total)
			this.setState({
				daysBought: money / ( this.state.pricePerHour * 24 )
			})
		}

		var donations = (await this.props.axios.get('/getDonations'))?.data
		var totalDonated = donations.reduce((sum, donation) => sum + this.amtAfterFees(donation.amount), 0)
		var pricePerSecond = this.state.pricePerHour / (60 * 60)
		var daysLeft = (((donations[0]?.paidAt ?? new Date().getTime() / 1000) + (totalDonated / pricePerSecond)) - (new Date().getTime() / 1000)) / (60 * 60 * 24)
		this.setState({
			solventFor: daysLeft
		})
		console.log(donations)
		console.log(totalDonated)
	}

	makeDonation(amt) {
		stripe.redirectToCheckout({
			items: [{ 
				sku: process.env.NODE_ENV == 'development' ? 'sku_GmMuGMGc8jTd4g' : 'sku_GmMK7lAi6vfMnN', quantity: parseInt(amt)
			}],
			successUrl: window.location.origin + '/donate?session_id={CHECKOUT_SESSION_ID}',
			cancelUrl: window.location.origin + '/donate',
		})
		.then(function (result) {
			if (result.error) {
				alert(result.error.message)
			}
		})
	}

	amtAfterFees(amt) {
		return amt * 0.971 - 0.3
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
					<div className={css(styles.daysLeft)} style={{ opacity: this.state.daysBought ? 1 : 0, height: this.state.daysBought ? 40 : 0 }}>
						{`Thank you for keeping Tiltseeker running for ${(this.state.daysBought)?.toFixed(2) ?? '...'} more days`}
					</div>
					<br/>
					<div className={css(styles.daysLeft)} style={{ opacity: this.state.solventFor != null ? 1 : 0, height: this.state.solventFor ? 40 : 0 }}>
						{`With a monthly cost of $${(this.state.pricePerHour * 24 * 30 / 100).toFixed(2)}, Tiltseeker has funds to run for ${(this.state.solventFor)?.toFixed(2) ?? '...'} days`}
					</div>
					<br/>
					<br/>
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
		daysLeft: {
			color: theme('text1', t),
			...FontSize.large,
			fontWeight: 'bold',
			textAlign: 'center',
			transition: 'background-color 0.25s, color 0.25s, opacity 1s, height 1s',
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
