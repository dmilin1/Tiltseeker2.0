import React, { useState, useContext, useEffect } from 'react'
import { StyleSheet, css } from 'aphrodite'
import { withRouter } from "react-router-dom"

import { FontSize, theme } from '../Styling.js'
import GlobalContext from '../GlobalContext.js';


function BestBans(props) {

    const { axios, globalTheme } = useContext(GlobalContext)
    const [ calculations, setCalculations ] = useState([])
    const [ championData, setChampionData ] = useState()
    const [ gameVersion, setGameVersion ] = useState()
    const [ sortBy, setSortBy ] = useState({ val: 'name', direction: true })

    const tags = [{
        pretty: 'Icon',
        tag: 'id',
        img: true,
        dontProcess: true,
    }, {
        pretty: 'Name',
        tag: 'name',
        dontProcess: true,
    }, {
        pretty: 'Win Rate',
        tag: 'win',
        percent: true,
        decimals: 1,
    }, {
        pretty: 'Kills',
        tag: 'kills',
        perSec: true,
        decimals: 2,
    }, {
        pretty: 'Deaths',
        tag: 'deaths',
        perSec: true,
        decimals: 2,
    },  {
        pretty: 'Assists',
        tag: 'assists',
        perSec: true,
        decimals: 2,
    }, {
        pretty: 'Gold',
        tag: 'goldEarned',
        perSec: true,
        decimals: 0,
    }, {
        pretty: 'Total Dmg to Champs',
        tag: 'totalDamageDealtToChampions',
        perSec: true,
        decimals: 0,
    }, {
        pretty: 'Physical Dmg to Champs',
        tag: 'physicalDamageDealtToChampions',
        perSec: true,
        decimals: 0,
    }, {
        pretty: 'Magic Dmg to Champs',
        tag: 'magicDamageDealtToChampions',
        perSec: true,
        decimals: 0,
    }, {
        pretty: 'True Dmg to Champs',
        tag: 'trueDamageDealtToChampions',
        perSec: true,
        decimals: 0,
    }, {
        pretty: 'Total Dmg Taken',
        tag: 'totalDamageTaken',
        perSec: true,
        decimals: 0,
    }, {
        pretty: 'Dmg To Objectives',
        tag: 'damageDealtToObjectives',
        perSec: true,
        decimals: 0,
    }, {
        pretty: 'Dmg To Turrets',
        tag: 'damageDealtToTurrets',
        perSec: true,
        decimals: 0,
    }, {
        pretty: 'First Blood Participation',
        tag: 'firstBloodParticipate',
        percent: true,
        decimals: 1,
    }, {
        pretty: 'Neutral Minions',
        tag: 'neutralMinionsKilled',
        perSec: true,
        decimals: 1,
    }, {
        pretty: 'Objectives Stolen',
        tag: 'objectivesStolen',
        perSec: true,
        decimals: 3,
    }, {
        pretty: 'Wards Placed',
        tag: 'wardsPlaced',
        perSec: true,
        decimals: 1,
    }, {
        pretty: 'Vision Score',
        tag: 'visionScore',
        perSec: true,
        decimals: 1,
    }, {
        pretty: 'Avg Game Time',
        tag: 'timePlayed',
        cstmFormat: (val) => `${Math.floor(val / 60)}m ${(val % 60).toFixed(0)}s`,
    }]

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
            console.log(stats)

            let calcs = Object.entries(stats.detailedChampStats).filter(data => data[1]?.count ).map((detailedChamp, i) => {
                let [champId, champ] = detailedChamp
                return tags.reduce((cum, tag) => {
                    let unformattedVal = champ[`${tag.tag}${tag.perSec ? 'PerSec' : ''}Avg`]
                    if (tag.dontProcess) {
                        return cum
                    }
                    if (tag.perSec) {
                        unformattedVal *= champ.timePlayedAvg
                    }
                    let val = unformattedVal
                    if (tag.cstmFormat) {
                        val = tag.cstmFormat(val)
                    } else {
                        if (tag.percent) {
                            val *= 100
                        }
                        if (tag.decimals !== undefined) {
                            val = val.toFixed(tag.decimals)
                        }
                    }
                    return {
                        ...cum,
                        [tag.tag + '_unformatted']: unformattedVal,
                        [tag.tag]: val + (tag.percent ? '%' : ''),
                    }
                }, {
                    id: +championData[champId].key,
                    name: championData[champId].name,
                    num: i,
                })
            })
            .sort((a, b) => a.name > b.name ? 1 : -1 )

            console.log(calcs)

            setCalculations(calcs)
            setChampionData(championData)
            setGameVersion(currentGameVersion)
		} catch (e) {
			console.log(e)
		}
    }

    useEffect(() => {calcData()}, [])

    loadStyles(globalTheme)

    return (
        <div className={css(styles.container)}>
            { calculations && championData && gameVersion ? (
                <div className={css(styles.statsContainer)} style={{ gridTemplateColumns: `repeat(${tags.length}, minmax(100px, 1fr))` }}>
                    <div
                        className={css(styles.statsHeader)}
                        style={{
                            gridColumn: `1 / ${tags.length + 1}`,
                            gridTemplateColumns: `repeat(${tags.length}, minmax(100px, 1fr))`
                        }}
                    >
                        { tags.map(tag => 
                            <div
                                className={css(styles.sortTitle)}
                                onClick={() => setSortBy({ val: tag.tag, direction: sortBy.val !== tag.tag ? true : !sortBy.direction })}
                                style={{
                                    ...(tag.img ? {
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 20,
                                        paddingLeft: 25
                                    } : {})
                                }}
                                key={tag.pretty}
                            >
                                {tag.pretty}
                                <span className={css(styles.sortIndicator)}>
                                    { tag.tag === sortBy.val && (sortBy.direction ? '▼' : '▲')}
                                </span>
                            </div>
                        )}
                        <div
                            className={css(styles.seperatorBar)}
                            style={{
                                borderStyle: 'solid',
                                borderWidth: '0px 0px 1px 0px',
                                position: 'sticky',
                                top: 0,
                                gridColumn: `1 / ${tags.length + 1}`
                            }}
                        />
                    </div>
                    {calculations.sort((a, b) => {
                        if (a[`${sortBy.val}_unformatted`] !== undefined) {
                            return (a[`${sortBy.val}_unformatted`] - b[`${sortBy.val}_unformatted`]) * (sortBy.direction ? -1 : 1)
                        } else if (!isNaN(Number(a[sortBy.val]))) {
                            return Number(a[sortBy.val]) - Number(b[sortBy.val]) * (sortBy.direction ? -1 : 1)
                        } else {
                            return (b[sortBy.val] < a[sortBy.val]) ^ sortBy.direction ? -1 : 1
                        }
                    }).map(champ => tags.map(tag =>
                        <div
                            className={css(styles.cellContainer)}
                            key={champ.id + tag.tag}
                            style={{
                                position: 'sticky',
                                ...(tag.img ? {
                                    left: 0,
                                    zIndex: 2,
                                } : {})
                            }}
                        >
                            { tag.img ? (
                                <img className={css(styles.icon)} src={`https://ddragon.leagueoflegends.com/cdn/${gameVersion}/img/champion/${championData[champ.id].id}.png`}/>
                            ) : (
                                champ[tag.tag]
                            )}
                        </div>
                    ))}
                </div>
            ) : null }
        </div>
    );
}

var styles = null;

var loadStyles = (t) => {
	styles = StyleSheet.create({
		container: {
            color: theme('text2', t, true),
			backgroundColor: theme('bg1', t),
			transition: 'background-color 0.25s, color 0.25s',
			display: 'flex',
			alignItems: 'stretch',
			justifyContent: 'center',
			flexDirection: 'column',
			flex: 1,
		},
        sortTitle: {
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
            alignItems: 'center',
            display: 'flex',
			backgroundColor: theme('primary1', t),
        },
        sortIndicator: {
            fontSize: 12,
            marginLeft: 4,
        },
		statsContainer: {
			display: 'grid',
			gridTemplateRows: 'auto',
			columnGap: 10,
			rowGap: 10,
            height: '85vh',
			borderStyle: 'solid',
			borderColor: theme('accent1', t),
			backgroundColor: theme('primary1', t),
			margin: '30px 0 30px 0',
            overflowY: 'scroll',
            maxWidth: '95%',
			'@media (min-width: 600px)': {
				margin: '30px 5vw 30px 5vw',
                maxWidth: '90%',
			},
			'@media (min-width: 1000px)': {
				alignSelf: 'center',
                maxWidth: '85%',
			},
            '::-webkit-scrollbar': {
                width: 10,
                height: 10,
            },
            '::-webkit-scrollbar-track': {
                background: theme('primary1', t),
            },
            '::-webkit-scrollbar-thumb': {
                backgroundColor: '#737373',
                borderRadius: 10,
                border: `1px solid ${theme('text1', t)}`,
            }
		},
        statsHeader: {
            paddingTop: 10,
            position: 'scroll',
            display: 'grid',
            position: 'sticky',
            top: 0,
            gap: 10,
            backgroundColor: theme('primary1', t),
            zIndex: 10
        },
		seperatorBar: {
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			textAlign: 'center',
			color: theme('text2', t, true),
			backgroundColor: theme('primary1', t),
		},
        cellContainer: {
            fontWeight: 300,
            fontSize: 16,
            flex: 1, display: 'flex', alignItems: 'center',
			backgroundColor: theme('primary1', t),
        },
        icon: {
            height: 35,
            width: 35,
            marginLeft: 25,
        },
	})
}


export default withRouter(BestBans);
