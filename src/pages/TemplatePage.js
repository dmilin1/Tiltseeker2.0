import React from 'react'
import { StyleSheet, css } from 'aphrodite';
import { withRouter } from "react-router-dom";

import { FontSize, theme } from './../Styling.js';


class Template extends React.Component {

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

	  },
	});
}


export default withRouter(Template);
