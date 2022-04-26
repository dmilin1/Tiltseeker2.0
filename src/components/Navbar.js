import React, { useState, useEffect, useContext } from 'react'
import { StyleSheet, css } from 'aphrodite';
import { withRouter } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { FontSize, theme } from './../Styling.js';
import GlobalContext from '../GlobalContext.js';


// import './Navbar.css';



function Navbar(props) {

    const { axios, globalTheme } = useContext(GlobalContext)

    loadStyles(globalTheme)
    return (
        <div className={css(styles.container)}>
            <Button
                icon='home'
                url='/'
                {...props}
            />
            <Dropdown
                text='Tools'
            >
                <Button
                    text='Best Bans'
                    url='/bestbans'
                    dropdown={true}
                    {...props}
                />
                <Button
                    text='Champion Stats'
                    url='/championstats'
                    dropdown={true}
                    {...props}
                />
                <Button
                    text='Composition Analyzer'
                    url='/compchecker'
                    dropdown={true}
                    {...props}
                />
                <Button
                    text='Desktop App'
                    url='/desktopapp'
                    dropdown={true}
                    {...props}
                />
            </Dropdown>
            <Button
                text='Discord'
                func={() => {
                    window.open('https://discord.gg/HVwkvFX')
                }}
                {...props}
            />
            <Button
                text='Donate'
                url='/donate'
                {...props}
            />
            <Button
                text='About'
                url='/about'
                {...props}
            />
            <div className={css(styles.buttonRightAlign)}/>
            <Button
                icon={globalTheme === 'light' ? 'toggle-off' : 'toggle-on'}
                text={globalTheme === 'light' ? 'Light Mode' : 'Dark Mode'}
                func={() => {
                    props.setTheme(globalTheme === 'light' ? 'dark' : 'light')
                }}
                {...props}
            />
	    </div>
    );
}

function Dropdown(props) {
    const [ open, setOpen ] = useState(false)

    useEffect(() => {
        // const handleClick = () => setOpen(false)
        // document.body.addEventListener('click', handleClick, true)
        // return document.body.removeEventListener('click', handleClick)
    }, [])

    return (
        <div
            className={css(styles.dropdownContainer)}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onClick={(e) => setOpen(true)}
            onTouchCancel={() => setOpen(false)}
        >
            <Button
                text={props.text}
                func={() => setOpen(!open)}
            />
            { open ? (
                <>
                    <div className={css(styles.dropdownSeperator)}/>
                    <div className={css(styles.dropdownBox)}>
                        { props.children }
                    </div>
                </>
            ) : null }
        </div>
    )
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
                    this.props.dropdown && styles.buttonInDropdown,
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
            zIndex: 100,
	    },
        dropdownContainer: {
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
			color: theme('text1', t),
			maxWidth: '15vw',
			flex: 1,
        },
        dropdownSeperator: {
            backgroundColor: theme('text1', t),
            height: 1,
            marginTop: -1,
        },
        dropdownBox: {
            position: 'absolute',
			backgroundColor: theme('primary1', t),
            top: '100%',
            minWidth: '100%',
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
            minHeight: 55,
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
		},
        buttonInDropdown: {
            minWidth: 'fit-content',
            maxWidth: 'unset',
            padding: '0px 10px',
        }
	});
}


export default withRouter(Navbar);
