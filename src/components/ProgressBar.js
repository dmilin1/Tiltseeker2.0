import React from 'react'
import { StyleSheet, css } from 'aphrodite';
import { withRouter } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { FontSize, theme } from './../Styling.js';


class ProgressBar extends React.Component {

	constructor(props) {
		super(props)
	}

	render() {
		loadStyles(this.props.theme)
		return (
			<div className={css(styles.progressBarContainer)}>
				<div className={css(styles.progressBar)} style={{ width: this.props.percent*100 + '%' }}/>
			</div>
		)
	}
}


var styles = null;

var loadStyles = (t) => {
	styles = StyleSheet.create({
		progressBarContainer: {
			backgroundColor: theme('primary1', t),
			transition: 'background-color 0.25s, color 0.25s',
			width: '80%',
			height: 20,
			borderRadius: 10,
			padding: 10,
		},
		progressBar: {
			backgroundColor: theme('text1', t),
			transition: 'background-color 0.25s, color 0.25s, width 2.5s ease-out',
			height: '100%',
			borderRadius: 5,
		},
	});
}


export default ProgressBar;
