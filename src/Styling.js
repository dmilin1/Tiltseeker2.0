
const themes = {
	bg1: {
		light: '#BBB',
		dark: '#686868',
	},
	primary1: {
		light: '#DDD',
		dark: '#333',
	},
	primary2: {
		light: '#D4D4D4',
		dark: '#3B3B3B',
	},
	accent1: {
		light: '#BBB',
		dark: '#555',
	},
	accent2: {
		light: '#C8C8C8',
		dark: '#181818',
	},
	accent3: {
		light: '#2898fa',
		dark: '#2898fa',
	},
	accent4: {
		light: '#fa3232',
		dark: '#fa3232',
	},
	inputHighlight: {
		light: '#C8C8C8',
		dark: 'black',
	},
	inputHighlight2: {
		light: '#EEE',
		dark: 'black',
	},
	button: {
		light: '#AAA',
		dark: '#888',
	},
	buttonAccent: {
		light: 'white',
		dark: '#DDD',
	},
	buttonHovered: {
		light: '#EEE',
		dark: '#555',
	},
	buttonHoveredAccent: {
		light: '#EEE',
		dark: '#EEE',
	},
	buttonPressed: {
		light: 'white',
		dark: '#222',
	},
	inputHighlightBackground: {
		light: '#EAEAEA',
		dark: '#333',
	},
	text1: {
		light: '#0C0C0C',
		dark: '#F3F3F3',
	},
	text2: {
		light: 'white',
		dark: 'black',
	}
}

const FontSize = {
	small: {
		fontSize: 8,
		'@media (min-width: 600px)': {
			fontSize: 10,
		},
		'@media (min-width: 800px)': {
			fontSize: 12,
		},
		'@media (min-width: 1000px)': {
			fontSize: 13,
		},
	},
	mediumSmall: {
		fontSize: 8,
		'@media (min-width: 600px)': {
			fontSize: 12,
		},
		'@media (min-width: 800px)': {
			fontSize: 14,
		},
		'@media (min-width: 1000px)': {
			fontSize: 16,
		},
	},
	medium: {
		fontSize: 12,
		'@media (min-width: 600px)': {
			fontSize: 15,
		},
		'@media (min-width: 800px)': {
			fontSize: 18,
		},
		'@media (min-width: 1000px)': {
			fontSize: 21,
		},
	},
	mediumLarge: {
		fontSize: 15,
		'@media (min-width: 600px)': {
			fontSize: 18,
		},
		'@media (min-width: 800px)': {
			fontSize: 21,
		},
		'@media (min-width: 1000px)': {
			fontSize: 23,
		},
	},
	large: {
		fontSize: 18,
		'@media (min-width: 600px)': {
			fontSize: 21,
		},
		'@media (min-width: 800px)': {
			fontSize: 24,
		},
		'@media (min-width: 1000px)': {
			fontSize: 27,
		},
	},
	extraLarge: {
		fontSize: 22,
		'@media (min-width: 600px)': {
			fontSize: 25,
		},
		'@media (min-width: 800px)': {
			fontSize: 29,
		},
		'@media (min-width: 1000px)': {
			fontSize: 32,
		},
	},
	logo: {
		fontSize: 70,
		'@media (min-width: 600px)': {
			fontSize: 100,
		},
		'@media (min-width: 800px)': {
			fontSize: 130,
		},
		'@media (min-width: 1000px)': {
			fontSize: 160,
		},
	},
};

const InputSize = {
	small: {
		height: 20,
		'@media (min-width: 600px)': {
			height: 20,
		},
		'@media (min-width: 800px)': {
			height: 20,
		},
		'@media (min-width: 1000px)': {
			height: 20,
		},
	},
	medium: {
		fontSize: 12,
		'@media (min-width: 600px)': {
			fontSize: 15,
		},
		'@media (min-width: 800px)': {
			fontSize: 18,
		},
		'@media (min-width: 1000px)': {
			fontSize: 21,
		},
	},
	mediumLarge: {
		fontSize: 15,
		'@media (min-width: 600px)': {
			fontSize: 18,
		},
		'@media (min-width: 800px)': {
			fontSize: 21,
		},
		'@media (min-width: 1000px)': {
			fontSize: 23,
		},
	},
	large: {
		fontSize: 18,
		'@media (min-width: 600px)': {
			fontSize: 21,
		},
		'@media (min-width: 800px)': {
			fontSize: 24,
		},
		'@media (min-width: 1000px)': {
			fontSize: 27,
		},
	},
	logo: {
		fontSize: 70,
		'@media (min-width: 600px)': {
			fontSize: 100,
		},
		'@media (min-width: 800px)': {
			fontSize: 130,
		},
		'@media (min-width: 1000px)': {
			fontSize: 160,
		},
	},
};

const ItemSize = {
	large: {
		minWidth: '90%',
		'@media (min-width: 1100px)': {
			minWidth: '80%',
		},
		'@media (min-width: 1350px)': {
			minWidth: '45%',
			maxWidth: '45%',
		},
		'@media (min-width: 1550px)': {
			minWidth: '40%',
			maxWidth: '40%',
		},
	},
};

const theme = (key, type, invert=false) => {
	if (!invert) {
		return themes[key][type]
	}	else {
		return themes[key][type === 'dark' ? 'light' : 'dark']
	}
}

export { theme, FontSize, ItemSize }
