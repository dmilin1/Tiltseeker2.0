import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import { withRouter } from "react-router-dom"

import { FontSize, theme } from './../Styling.js'

import profilePic from './../images/profilePic.jpg'


class About extends React.Component {

	componentDidMount() {

	}

	render() {
		loadStyles(this.props.theme)
		return (
			<div className={css(styles.container)}>
				<div className={css(styles.profilePic)}>
					<img src={profilePic} alt="Logo" style={{ maxWidth: '100%' }}/>
				</div>
				<div className={css(styles.nameText)}>
					{`Dimitrie Milinovich III`}
				</div>
				<div className={css(styles.descriptionText)}>
					<br/>
					<br/>
					<div
						style={{ margin: '0px 10%' }}
					>
						{`I'm a Software Engineering graduate student at San Jose State University specializing in Data Science. League of Legends and computing have been longtime passions of mine and Tiltseeker is a culmination of my biggest hobbies.`}
					</div>
					<br/>
					<br/>
					<br/>
					<h4>{`The Story:`}</h4>
					{`One day, it occured to me that the materials I was studing in school could be applied to the game I love in order to create an advantage. The next few days, I spent my spare time putting together a simple Python script that would find indicators about my opponents that I could use to win. For example, I quickly discovered that losing streaks were a good indicator of which lane to camp. A few weeks later, I mentioned my program on the /r/LeagueOfLegends subreddit and received a lot of encouragement to build it into a usable website!`}
					<br/>
					<br/>
					{`The initial version of Tiltseeker took me almost a year to complete. I had no experience with web development so I had to learn as I worked. The current website is the second iteration of Tiltseeker built with modern web technologies I've learned since version 1.0.`}
					<br/>
					<br/>
					<br/>
					<h4>{`Hire Me!`}</h4>
					{`While I am an active student, I'm always looking for opportunities! My dream job is to work in eSports analytics or on a machine learning project that could help humanity. If you or someone you know can help make that happen, I'd love to hear from you!`}
					<br/>
					<br/>
					<br/>
					<a href="https://github.com/dmilin1" target="_blank">GitHub</a>
					<br/>
					<br/>
					<a href="https://www.linkedin.com/in/dimitrie-milinovich-359b1215b/" target="_blank">LinkedIn</a>
					<br/>
					<br/>
					<a href="mailto:contact@tiltseeker.com" target="_blank">Email</a>
					<br/>
					<br/>
					{`League NA: dmilin (add me and we can duo!)`}
					<br/>
					<br/>
					<br/>
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
		profilePic: {
			width: 125,
			height: 125,
			borderRadius: 500,
			overflow: 'hidden',
			marginTop: 50,
		},
		nameText: {
			marginTop: 10,
			color: theme('text1', t),
			...FontSize.mediumLarge,
			transition: 'background-color 0.25s, color 0.25s',
		},
		descriptionText: {
			color: theme('text1', t),
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
		}
	});
}


export default withRouter(About);
