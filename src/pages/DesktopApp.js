import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import { withRouter } from "react-router-dom"

import { FontSize, theme } from './../Styling.js'

import profilePic from './../images/profilePic.jpg'


class DesktopApp extends React.Component {

	componentDidMount() {

	}

	render() {
		loadStyles(this.props.theme)
		return (
			<div className={css(styles.container)}>
				<div className={css(styles.descriptionText)}>
					<br/>
					<br/>
					<div
						style={{ margin: '0px 10%' }}
					>
						{`The Tiltseeker Desktop App is an assistive software designed to predict the outcome of a match using only information available from the Champion Select screen. It is a work in progress. Below is an early preview. Join the Tiltseeker Discord at the link in the navbar above to receive updates and gain access to the early alpha.`}
					</div>
					<br/>
					<br/>
				</div>
				<div className={css(styles.videoContainer)}>
					<iframe width="100%" height="100%" src="https://www.youtube.com/embed/efR5Znx8kI0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
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
			flexDirection: 'column',
			flex: 1,
	  },
		descriptionText: {
			color: theme('text1', t),
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			...FontSize.medium,
			transition: 'background-color 0.25s, color 0.25s',
			width: '90%',
			'@media (min-width: 700px)': {
				width: '85%',
			},
			'@media (min-width: 900px)': {
				width: '80%',
			},
			'@media (min-width: 1100px)': {
				width: '75%',
			},
		},
		videoContainer: {
			width: '80%',
			height: '45vw',
			'@media (min-width: 800px)': {
				width: '70%',
				height: '39.375vw',
			},
			'@media (min-width: 1300px)': {
				width: '60%',
				height: '33.75vw',
			},
		},
	});
}


export default withRouter(DesktopApp);
