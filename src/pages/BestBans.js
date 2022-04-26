import React, { useState, useContext, useEffect } from 'react'
import { StyleSheet, css } from 'aphrodite'
import { withRouter } from "react-router-dom"

import { FontSize, theme } from './../Styling.js'
import GlobalContext from '../GlobalContext.js';


function BestBans(props) {

    const { axios, globalTheme } = useContext(GlobalContext)
    const [ calculations, setCalculations ] = useState([])
    const [ championData, setChampionData ] = useState()
    const [ sortBy, setSortBy ] = useState({ val: 'influence', direction: true })

    const calcData = async () => {
        try {
			// Load currentGameVersion, championData, and championStats
			
			let currentGameVersion = (await axios.get('https://ddragon.leagueoflegends.com/api/versions.json')).data[0]
			let championData = (await axios.get(`https://ddragon.leagueoflegends.com/cdn/${currentGameVersion}/data/en_US/champion.json`)).data.data
			
            championData = Object.values(championData).reduce((c, champ) => ({ ...c, [champ.key]: champ }), championData)

			let stats = (await axios.get('/na/stats')).data

            let champStats = stats.champStats
            let totalMatches = champStats.reduce((sum, champ) => sum + champ.count, 0)/10

            console.log(totalMatches)
            console.log(champStats)
            console.log(championData)

            let calcs = champStats.map(champ => ({
                id: champ._id,
                name: championData[champ._id].name,
                influence: 10000 * ( champ.winRateAvg - 0.5 ) * ( champ.pickRateAvg ?? ( champ.count / totalMatches ) ) / ( 1 - (champ.banRateAvg ?? 0) ),
                pickRate: champ.pickRateAvg ?? ( champ.count / totalMatches ),
                winRate: champ.winRateAvg,
                banRate: champ.banRateAvg ?? '?',
            }))
            .sort((a, b) => b.influence - a.influence)
            .map((champ, i) => ({ num: i, ...champ }))

            console.log(calcs)

            setCalculations(calcs)
            setChampionData(championData)
		} catch (e) {
			console.log(e)
		}
    }

    useEffect(() => {calcData()}, [])

    loadStyles(globalTheme)

    return (
        <div className={css(styles.container)}>
            { calculations && championData ? (
                <>
                    <div className={css(styles.picturesContainer)}>
                        {calculations.sort((a, b) => b.influence - a.influence).slice(0, 16).map((champ, i) => {
                            return (
                                <div className={css(styles.pictureContainer)} key={i}>
                                    <img className={css(styles.picture)} src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championData[champ.id].id}_0.jpg`}/>
                                    <div key={champ.id}>
                                        <div style={{ fontWeight: 600, fontSize: 17, }}>
                                            {`
                                                #${i + 1} 
                                                ${championData[champ.id].name}
                                            `}
                                        </div>
                                        <div style={{ fontWeight: 300, fontSize: 15, }}>
                                        {`Influence: ${champ.influence.toFixed(0)}`}
                                        </div>
                                        <div style={{ fontWeight: 300, fontSize: 15, }}>
                                        {`Win Rate: ${(champ.winRate * 100).toFixed(2)}%`}
                                        </div>
                                        <div style={{ fontWeight: 300, fontSize: 15, }}>
                                        {`Pick Rate: ${(champ.pickRate * 100).toFixed(2)}%`}
                                        </div>
                                        <div style={{ fontWeight: 300, fontSize: 15, }}>
                                        {`Ban Rate: ${(champ.banRate * 100).toFixed(2)}%`}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    
                    <div className={css(styles.explanationText)}>

                        Players often ban emotionally based on frusturation, perceived power, and popular opinion. But these ban choices are rarely ideal for winning. This list contains the ideal bans assuming nothing is known about what champions will be chosen. It's important to note that there are a few scenarios where these are not the best bans. For example, banning out a teammate's champion and causing tilt or banning a high influence champion if you know your team will counter pick them.

                        <div style={{ marginTop: 15 }}/>

                        Ideal ban strategy is to ban champions with a high winrate who also have a high playrate. In this list, "Influence" represents the average losses per 10,000 games that you can expect due to that champion being on the other team. By banning that champion, you are in effect negating those losses.

                    </div>
                    
                    <div className={css(styles.statsContainer)}>
                        <div
                            className={css(styles.champStatContainer)}
                            style={{
                                borderStyle: 'solid',
                                borderWidth: '0px 0px 1px 0px',
                                paddingBottom: 10,
                                position: 'sticky',
                                top: 0,
                            }}
                        >
                            {[{
                                prettyTitle: '#',
                                calcField: 'num',
                                fieldWidth: 1,
                            }, {
                                prettyTitle: 'Name',
                                calcField: 'name',
                                fieldWidth: 5,
                            }, {
                                prettyTitle: 'Influence',
                                calcField: 'influence',
                            }, {
                                prettyTitle: 'Win Rate',
                                calcField: 'winRate',
                            }, {
                                prettyTitle: 'Pick Rate',
                                calcField: 'pickRate',
                            }, {
                                prettyTitle: 'Ban Rate',
                                calcField: 'banRate',
                            }, {
                                prettyTitle: 'ID',
                                calcField: 'id',
                                fieldWidth: 1,
                            }, ].map((elem, i) => (
                                <div
                                    className={css(styles.sortTitle)}
                                    key={i}
                                    style={{ flex: elem.fieldWidth ?? 3 }}
                                    onClick={() => setSortBy({ val: elem.calcField, direction: sortBy.val !== elem.calcField ? true : !sortBy.direction })}
                                >
                                    {elem.prettyTitle}
                                    <span className={css(styles.sortIndicator)}>
                                        { sortBy.val === elem.calcField && (sortBy.direction ? '▼' : '▲')}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {calculations.sort((a, b) => {
                            if (typeof a[sortBy.val] === 'number') {
                                return (b[sortBy.val] - a[sortBy.val]) * (sortBy.direction ? 1 : -1)
                            } else {
                                return (b[sortBy.val] > a[sortBy.val]) ^ sortBy.direction ? 1 : -1
                            }
                        }).map((champ, i) => {
                            return (
                                <div className={css(styles.champStatContainer)} key={i}>
                                    <div style={{ fontWeight: 300, fontSize: 16, flex: 1 }}>
                                        {`${champ.num + 1}`}
                                    </div>
                                    <div
                                        className={css(styles.champStatName)}
                                        style={{ fontWeight: 400, fontSize: 16, flex: 5 }}
                                    >
                                        {`${champ.name}`}
                                    </div>
                                    <div style={{ fontWeight: 300, fontSize: 16, flex: 3 }}>
                                        {`${champ.influence.toFixed(0)}`}
                                    </div>
                                    <div style={{ fontWeight: 300, fontSize: 16, flex: 3 }}>
                                        {`${(champ.winRate * 100).toFixed(2)}%`}
                                    </div>
                                    <div style={{ fontWeight: 300, fontSize: 16, flex: 3 }}>
                                        {`${(champ.pickRate * 100).toFixed(2)}%`}
                                    </div>
                                    <div style={{ fontWeight: 300, fontSize: 16, flex: 3 }}>
                                        {`${(champ.banRate * 100).toFixed(2)}%`}
                                    </div>
                                    <div style={{ fontWeight: 300, fontSize: 16, flex: 1 }}>
                                        {`${champ.id}`}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            ) : null }
        </div>
    );
}

var styles = null;

var loadStyles = (t) => {
	styles = StyleSheet.create({
		container: {
			backgroundColor: theme('bg1', t),
			transition: 'background-color 0.25s, color 0.25s',
			display: 'flex',
			alignItems: 'stretch',
			justifyContent: 'center',
			flexDirection: 'column',
			flex: 1,
		},
		picturesContainer: {
			display: 'grid',
			gridTemplateColumns: 'auto auto auto auto',
			gridTemplateRows: 'auto',
			columnGap: 10,
			rowGap: 30,
			justifyItems: 'center',
			marginTop: 40,
			'@media (min-width: 1100px)': {
				width: 1100,
				alignSelf: 'center',
			},
		},
		pictureContainer: {
			width: '20vw',
			maxWidth: 200,
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			textAlign: 'center',
			color: theme('text2', t, true),
		},
		picture: {
			maxWidth: '100%',
			maxHeight: '300px',
		},
        sortTitle: {
            fontWeight: 600,
            fontSize: 18,
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
            display: 'flex',
        },
        sortIndicator: {
            fontSize: 12,
            marginLeft: 4,
        },
		statsContainer: {
			display: 'grid',
			gridTemplateColumns: 'auto',
			gridTemplateRows: 'auto',
			columnGap: 10,
			rowGap: 10,
			borderStyle: 'solid',
			borderColor: theme('accent1', t),
			backgroundColor: theme('primary1', t),
			padding: '0px 10px 10px 10px',
			margin: '30px 0 30px 0',
			'@media (min-width: 600px)': {
				margin: '30px 5vw 30px 5vw',
			},
			'@media (min-width: 1000px)': {
				width: 850,
				alignSelf: 'center',
			},
		},
		champStatContainer: {
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			textAlign: 'center',
			color: theme('text2', t, true),
			backgroundColor: theme('primary1', t),
            paddingTop: 10,
		},
        champStatName: {
            '@media (max-width: 600px)': {
                paddingLeft: 5,
                textAlign: 'left',
			},
        },
		explanationText: {
			color: theme('text1', t),
			fontSize: 18,
			margin: '30px 10px 0 10px',
			'@media (min-width: 600px)': {
				margin: '30px 5vw 0 5vw',
			},
			borderStyle: 'solid',
			borderColor: theme('accent1', t),
			borderRadius: 5,
			padding: '15px 25px',
			backgroundColor: theme('primary1', t),
			'@media (min-width: 1100px)': {
				width: 945,
				alignSelf: 'center',
			},
		}
	})
}


export default withRouter(BestBans);
