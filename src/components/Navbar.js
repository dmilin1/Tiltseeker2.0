import React from 'react'
import { StyleSheet, css } from 'aphrodite';
import { withRouter } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { FontSize, theme } from './../Styling.js';


// import './Navbar.css';



class Navbar extends React.Component {

	render() {
		loadStyles(this.props.theme)
		return (
			<div className={css(styles.container)}>
				<Button
					icon='home'
					url='/'
					{...this.props}
				/>
				<Button
					text='Desktop App'
					url='/app'
					{...this.props}
				/>
				<Button
					text='Discord'
					func={() => {
						window.open('https://discord.gg/HVwkvFX')
					}}
					{...this.props}
				/>
				<Button
					text='Donate'
					url='/donate'
					{...this.props}
				/>
				<Button
					text='About'
					url='/about'
					{...this.props}
				/>
				<div className={css(styles.buttonRightAlign)}/>
				<Button
					icon={this.props.theme === 'light' ? 'toggle-off' : 'toggle-on'}
					text={this.props.theme === 'light' ? 'Light Mode' : 'Dark Mode'}
					func={() => {
						this.props.setTheme(this.props.theme === 'light' ? 'dark' : 'light')
					}}
					{...this.props}
				/>
	    </div>
	  );
	}
}

class Button extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			hovered: false,
			mouseDown: false,
		}
	}

	clicked = () => {
		if (this.props.func) {
			this.props.func()
		} else {
			if (!(this.props.location.pathname === this.props.url)) {
				this.props.history.push(this.props.url)
			}
		}
	}

	render() {
		return (
			<div
				className={css(
					styles.button,
					this.state.hovered && styles.buttonHovered,
					this.state.mouseDown && styles.buttonClicked,
					this.props.rightSide && styles.buttonRightAlign,
				)}
				onMouseOver={() => this.setState({hovered: true})}
				onMouseOut={() => this.setState({hovered: false})}
				onMouseDown={() => this.setState({mouseDown: true})}
				onMouseUp={() => this.setState({mouseDown: false})}
				onMouseLeave={() => this.setState({mouseDown: false})}
				onClick={() => this.clicked()}
			>
				{this.props.icon ? (
					<FontAwesomeIcon icon={this.props.icon} />

				) : null}
				{this.props.icon && this.props.text ? (
					<div>
					&nbsp;
					</div>
				) : null}
				{this.props.text}
			</div>
		);
	}
}


var styles = null;

var loadStyles = (t) => {
	styles = StyleSheet.create({
		container: {
			display: 'flex',
			backgroundColor: theme('primary1', t),
			height: 60,
			justifyContent: 'flex-start',
			transition: 'background-color 0.25s, color 0.25s',
	  },
		button: {
			display: 'flex',
			maxWidth: '15vw',
			flex: 1,
			color: theme('text1', t),
			alignItems: 'center',
			justifyContent: 'center',
			fontSize: 5,
			...FontSize.mediumLarge,
			transition: 'background-color 0.25s, color 0.25s',
			cursor: 'pointer',
			textAlign: 'center',
			fontFamily: 'Roboto',
			fontWeight: 300,
		},
		buttonHovered: {
			backgroundColor: theme('accent1', t),
			color: theme('accent3', t),
		},
		buttonClicked: {
			backgroundColor: theme('accent2', t),
			transition: 'background-color 0s',
		},
		buttonRightAlign: {
			marginLeft: 'auto',
		}
	});
}


export default withRouter(Navbar);
