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
						{`I'm a Software Engineering graduate from San Jose State University specializing in Full Stack Web Development and Data Science. League of Legends and computing have been longtime passions of mine and Tiltseeker is a culmination of my biggest hobbies.`}
					</div>
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
					<h4>{`Contact Me!`}</h4>
					{`I love hearing from others who have a passion for data in gaming. Whether you're searching for an advertising partner, looking for an API to use to collect stats, or simply working on your senior project and need ideas, I'd love to chat! Reach out at any of the links below, or through the Tiltseeker Discord channel (link the in navbar above).`}
					<br/>
					<br/>
					<br/>
					<a className={css(styles.contactLink)} href="https://github.com/dmilin1" target="_blank" rel="noopener noreferrer">GitHub</a>
					<br/>
					<br/>
					<a className={css(styles.contactLink)} href="https://www.linkedin.com/in/dimitrie-milinovich-359b1215b/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
					<br/>
					<br/>
					<a className={css(styles.contactLink)} href="mailto:contact@tiltseeker.com" target="_blank" rel="noopener noreferrer">Email</a>
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
		},
        contactLink: {
            color: theme('text1', t),
            backgroundColor: theme('primary1', t),
            padding: 5,
            borderRadius: 5,
            borderColor: theme('accent1', t),
            borderStyle: 'solid',
            borderWidth: 2,
        }
	});
}


export default withRouter(About);
