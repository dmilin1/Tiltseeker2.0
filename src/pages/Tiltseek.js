import React, { useState, useEffect, useContext } from 'react'
import { StyleSheet, css } from 'aphrodite'
import { withRouter, useHistory } from "react-router-dom"
import axios from 'axios'
import axiosRetry from 'axios-retry';

import GlobalContext from '../GlobalContext.js';
import ProgressBar from '../components/ProgressBar.js'
import { regionMap } from '../constants.js'
import { FontSize, ItemSize, theme } from '../Styling.js'
import WinRateCalc from '../utils/WinRateCalc'

axiosRetry(axios, {
	retries: 3,
	retryDelay: axiosRetry.exponentialDelay,
});

const matchesPerPlayer = 20

function Tiltseek(props) {
    const quotes = [
        `"Stats are good, winning is better" - Faker... probably`,
        `"We'll use Tiltseeker for week 2 at Worlds" - Every NA Team`,
        `"Please be our friend" - Amumu`,
        `"Camp someone who flames as much as Brand" - Bjergsen... probably`,
        `"Camp someone toxic. Like my sister, Cassiopeia" - Katarina`,
        `"Would you like a tent?" - Losing Midlaner`,
        `"Our midlaner has less vision than I do" - Lee Sin`,
        `"With Tiltseeker, you can transform into something better" - Kayn`,
        `"Camp someone who has no mana" - Tyler1... maybe`,
        `"Keep camping. See what happens." - Someone you should keep camping`,
        `"Tiltseeker seems fair and balanced." - CertainlyT`,
    ]

    const { axios, globalTheme } = useContext(GlobalContext)
    const history = useHistory()

    const [ quote, setQuote ] = useState(quotes[Math.floor(Math.random() * quotes.length)])
    const [ progress, setProgress ] = useState(0)
    const [ stage, setStage ] = useState({ state: 'loading', error: '' })
    const [ data, setData ] = useState({
        region: (new URLSearchParams(window.location.search)).get('region'),
        summonerName: (new URLSearchParams(window.location.search)).get('summonerName'),
        desktop: (new URLSearchParams(window.location.search)).get('desktop'),
    })
    
    const fetchData = async () => {
        let newData = {}

        const callStack = [{
            progressPts: 1,
            func: async ({ breakEarly }) => {
                try {
                    newData.userSummonerData = (await axios.get(`${data.region}/lol/summoner/v4/summoners/by-name/${data.summonerName}`))?.data
                } catch (e) {
                    if (e?.response?.status === 404) {
                        setStage({ state: 'error', error: `An account with name "${data.summonerName}" does not exist. Make sure the region is correct!` })
                        breakEarly()
                    } else {
                        throw e
                    }
                }
            }
        }, {
            progressPts: 1,
            func: async ({ breakEarly }) => {
                try {
                    newData.currentGame = (await axios.get(`${data.region}/lol/spectator/v4/active-games/by-summoner/${newData.userSummonerData.id}`)).data
                } catch (e) {
                    if (e?.response?.status === 404) {
                        setStage({ state: 'error', error: `"${data.summonerName}" is not in game. Make sure the region is correct!` })
                        breakEarly()
                    } else {
                        throw e
                    }
                }
            }
        }, {
            progressPts: 10,
            func: async ({ partialProgress, ptsAlloted }) => {
                let i = 0
                newData.accountInfos = await Promise.all(newData.currentGame.participants.map(async participant => {
                    let summoner = (await axios.get(`${data.region}/lol/summoner/v4/summoners/${participant.summonerId}`)).data
                    i += 1
                    partialProgress(i / ptsAlloted)
                    return summoner
                }))
            }
        }, {
            progressPts: 10,
            func: async ({ partialProgress, ptsAlloted }) => {
                let i = 0
                newData.championMasteries = await Promise.all(newData.currentGame.participants.map(async participant => {
                    let mastery = null
                    try {
                        mastery = (await axios.get(`${data.region}/lol/champion-mastery/v4/champion-masteries/by-summoner/${participant.summonerId}/by-champion/${participant.championId}`)).data
                    } catch (e) {
                        if (e?.response?.status !== 404) {
                            throw e
                        }
                    }
                    i += 1
                    partialProgress(i / ptsAlloted)
                    return mastery
                }))
            }
        }, {
            progressPts: 10,
            func: async ({ partialProgress, ptsAlloted }) => {
                let i = 0
                newData.rankedInfo = await Promise.all(newData.currentGame.participants.map(async participant => {
                    let ranked = null
                    try {
                        ranked = (await axios.get(`${data.region}/lol/league/v4/entries/by-summoner/${participant.summonerId}`)).data
                    } catch (e) {
                        if (e?.response?.status !== 404) {
                            throw e
                        }
                    }
                    i += 1
                    partialProgress(i / ptsAlloted)
                    return ranked
                }))
            }
        }, {
            progressPts: 10 * matchesPerPlayer,
            func: async ({ partialProgress, ptsAlloted }) => {
                let i = 0
                newData.matchHistories = await Promise.all(newData.currentGame.participants.map(async (participant, playerNum) => {
                    let matchIds = (await axios.get(`${regionMap[data.region]}/lol/match/v5/matches/by-puuid/${newData.accountInfos[playerNum].puuid}/ids?start=0&count=${matchesPerPlayer}&queue=420`)).data
                    let matches = await Promise.all(matchIds.map(async matchId => {
                        let match = (await axios.get(`${regionMap[data.region]}/lol/match/v5/matches/${matchId}`)).data
                        i += 1
                        partialProgress(i / ptsAlloted)
                        return match
                    }))
                    i += matchesPerPlayer - matches.length
                    return matches
                }))
            }
        }, {
            progressPts: 1,
            func: async () => {
                newData.currentGameVersion = (await axios.get(`https://ddragon.leagueoflegends.com/api/versions.json`)).data[0]
            }
        }, {
            progressPts: 1,
            func: async () => {
                newData.championData = (await axios.get(`https://ddragon.leagueoflegends.com/cdn/${newData.currentGameVersion}/data/en_US/champion.json`)).data.data
                for (let champ of Object.values(newData.championData)) {
                    newData.championData[champ.key] = champ
                }
            }
        }, {
            progressPts: 1,
            func: async () => {
                newData.champStats = {}
                let res = (await axios.get(`na/stats`)).data
                for (let champ of res.champStats) {
                    newData.champStats[champ._id] = champ
                }
                newData.detailedChampStats = res.detailedChampStats
                newData.matchups = res.matchups
            }
        }]

        const calcProgressToPoint = (i, currPercent = 1) => {
            let total = callStack.reduce((total, curr) => total + curr.progressPts, 0)
            return ( callStack.slice(0, i).reduce((total, curr) => total + curr.progressPts, 0) + currPercent * callStack[i].progressPts ) / total
        }

        let loadedSuccessfully = false
        for (let [ i, call ] of callStack.entries()) {
            let shouldStop = false
            await call.func({
                partialProgress: (percent) => setProgress(calcProgressToPoint(i, percent)),
                breakEarly: () => shouldStop = true,
                ptsAlloted: call.progressPts
            })
            if (!call.usesPartialProgress) {
                setProgress(calcProgressToPoint(i))
            }
            if (shouldStop) {
                break
            }
            if (i == callStack.length - 1) {
                loadedSuccessfully = true
            }
        }

        console.log(newData)

        setData({
            ...data,
            ...newData
        })
        if (loadedSuccessfully) {
            setStage({ state: 'loaded' })
        }
    }

    useEffect(() => {(async () => {
        await fetchData()
    })()}, [])
    loadStyles(globalTheme)

    return (
        <div className={css(styles.container, data.desktop ? styles.containerDesktop : undefined)}>
            { stage.state == 'loading' ? (
                <>
                    <div className={css(styles.loadingText)}>
                        {quote}
                    </div>
                    <ProgressBar
                        percent={progress}
                        theme={globalTheme}
                    />
                </>
            ) : null }
            { stage.state == 'loaded' ? (
                <DataDisplay data={data}/>
            ) : null }
            { stage.state == 'error' ? (
                <>
                    <div className={css(styles.errContainer)}>
                        <div className={css(styles.errText)}>
                            { stage.error }
                        </div>
                    </div>
                    <div className={css(styles.tryAgainButton)}>
                        <div
                            className={css(styles.tryAgainText)}
                            onClick={() => history.push('/')}
                        >
                            {'Back'}
                        </div>
                    </div>
                </>
            ) : null }
	    </div>
    );
}

function DataDisplay(props) {

    const { globalTheme } = useContext(GlobalContext)

    let { data } = props

    const [ teams, setTeams ] = useState(0)

    let setPopupText = (txt, mouse) => {
        document.querySelector('#infoBoxContainer').style.display = txt ? 'flex' : 'none'
        document.querySelector('#infoBoxContainer').style.top = `${mouse.clientY + 20}px`
        document.querySelector('#infoBoxContainer').style.left = `${mouse.clientX + 3}px`
        document.querySelector('#infoBox').innerText = txt
    }


	let getPercentile = (val, avg, variance) => {
        let std = variance ** 0.5
		var getZPercentile = (z) => {

			// z == number of standard deviations from the mean

			// if z is greater than 6.5 standard deviations from the mean the
			// number of significant digits will be outside of a reasonable range

			if (z < -6.5) {
				return 0.0;
			}

			if (z > 6.5) {
				return 1.0;
			}

			var factK = 1;
			var sum = 0;
			var term = 1;
			var k = 0;
			var loopStop = Math.exp(-23);

			while(Math.abs(term) > loopStop) {
				term = .3989422804 * Math.pow(-1,k) * Math.pow(z,k) / (2 * k + 1) / Math.pow(2,k) * Math.pow(z,k+1) / factK;
				sum += term;
				k++;
				factK *= k;
			}

			sum += 0.5;

			return sum;
		}

		return getZPercentile((val-avg)/std)
	}

    let getPlayerPercentile = (player, trait) => {
        let [ playerData, playerNum ] = player
        if (!data.matchHistories[playerNum]) {
            return 0.5
        }
        let percentiles = []
        for (let match of data.matchHistories[playerNum]) {
            let participant = match.info.participants.filter(p => p.summonerId === playerData.summonerId)[0]
            let champId = participant.championId
            let traitWithoutTime = trait.split('PerSec')[0]
            percentiles.push(getPercentile(
                trait === traitWithoutTime ? participant[trait] : participant[traitWithoutTime] / participant.timePlayed,
                data.detailedChampStats?.[champId]?.[`${trait}Avg`],
                (data.detailedChampStats?.[champId]?.[`${trait}Variance`]) * (trait === traitWithoutTime ? 1 : data.detailedChampStats?.[champId]?.timePlayedAvg)
            ))
        }
        return percentiles
    }


	let calcLosingStreak = (player, numeric=false) => {
        let [ playerData, playerNum ] = player
		let streak = 0
		let history = data.matchHistories[playerNum]
		let lastGameTime = Date.now()
		for (let match of history) {
			let win = match.info.participants.filter(participant => {
				return participant.summonerId == playerData.summonerId
			})[0].win
			if (win || lastGameTime - match.gameCreation < 12 * 60 * 60 * 1000) {
                break
			}
            streak += 1
            lastGameTime = match.gameCreation
		}
		return streak
	}

	let calcWinRate = (player, numeric=false) => {
		var i = player[1]
		var rankedInfo = data.rankedInfo[i]
		var wins = rankedInfo.reduce((total, current) => {
			return total += current.wins
		}, 0)
		var losses = rankedInfo.reduce((total, current) => {
			return total += current.losses
		}, 0)
		if (wins != 0 || losses != 0) {
			var winRate = 100*wins/(wins+losses)
			if (numeric) {
				return winRate/100
			}
			return `${winRate.toFixed(1)}% (${wins}W/${losses}L)`
		} else {
			if (numeric) {
				return null
			}
			return 'not ranked'
		}
	}

	let calcMasteryPoints = (player, numeric=false) => {
		if (data.championMasteries[player[1]]) {
			if (numeric) {
				return data.championMasteries[player[1]].championPoints
			}
			return data.championMasteries[player[1]].championPoints.toLocaleString()
		} else {
			return 0
		}
	}

	let calcLastPlayed = (player, numeric=false) => {
		if (data.championMasteries[player[1]]) {
			var timeSince = ((Date.now() - data.championMasteries[player[1]].lastPlayTime)/(24 * 60 * 60 *1000))
			if (numeric) {
				return timeSince
			}
			return `${timeSince.toFixed(0)} day${timeSince.toFixed(0) === '1' ? '' : 's'} ago`
		} else {
			if (numeric) {
				return null
			}
			return 'never'
		}
	}

	let calcAggression = (player, numeric=false) => {
        let [ playerData, playerNum ] = player
        let dealtPercentiles = getPlayerPercentile(player, 'totalDamageDealtToChampionsPerSec')
        let dealt = dealtPercentiles.reduce((total, percent) => total + percent, 0) / dealtPercentiles.length
        let receivedPercentiles = getPlayerPercentile(player, 'totalDamageTakenPerSec')
        let received = receivedPercentiles.reduce((total, percent) => total + percent, 0) / receivedPercentiles.length
        let percent = (dealt + received) / 2
        if ([playerData.spell1Id, playerData.spell2Id].includes(11 /* SMITE */)) {
		    percent = dealt // ignore received for junglers because of monster damage
        }
        if (dealtPercentiles.length === 0 || receivedPercentiles.length === 0) {
            return null
        }
		if (numeric) {
			return percent
		}
		return `${(100 * percent).toFixed(0)}%${dealtPercentiles.length + receivedPercentiles.length < matchesPerPlayer ? ' ?' : ''}`
	}

	let calcWarding = (player, numeric=false) => {
		let visionPercentiles = getPlayerPercentile(player, 'visionScorePerSec')
        let vision = visionPercentiles.reduce((total, percent) => total + percent, 0) / visionPercentiles.length
        if (visionPercentiles.length === 0) {
            return null
        }
		if (numeric) {
			return vision
		}
		return `${(100 * vision).toFixed(0)}%${visionPercentiles.length < matchesPerPlayer ? ' ?' : ''}`
	}

	let calcTiltScore = (player) => {
		var tiltArr = []

		var losingStreak = calcLosingStreak(player, true)
		if (losingStreak !== null) {
			tiltArr.push(1 - 1/(Math.pow(2,losingStreak)))
		}

		var winRate = calcWinRate(player, true)
		if (winRate !== null) {
			tiltArr.push(1 - winRate)
		}

		var masteryPoints = calcMasteryPoints(player, true)
		if (masteryPoints !== null) {
			tiltArr.push(1/(Math.pow(2,masteryPoints/7000)))
		}

		var lastPlayed = calcLastPlayed(player, true)
		if (lastPlayed !== null) {
			tiltArr.push(1 - 1/(Math.pow(2,lastPlayed/matchesPerPlayer)))
		} else {
			tiltArr.push(1)
		}

		var aggression = calcAggression(player, true)
		if (aggression !== null) {
			tiltArr.push(aggression)
		}

		var warding = calcWarding(player, true)
		if (warding !== null) {
			tiltArr.push(1 - warding)
		}

		if (tiltArr.length >= 5) {
			var tiltScore = 100 * tiltArr.reduce((prev, curr) => prev + curr) / tiltArr.length
			return `${tiltScore.toFixed(1)}%`
		} else {
			return 'not enough data'
		}
	}

	let makeTeam = (team) => {
		let playerDisplay = team.map(player => (
			<div className={css(styles.playerDisplayContainer)} key={`${player[0].summonerName}-player-display`}>
				<div className={css(styles.championIconContainer)}>
					<img
						className={css(styles.championIcon)}
						src={
							'https://ddragon.leagueoflegends.com/cdn/' +
							data.currentGameVersion + '/img/champion/' +
							data.championData[`${player[0].championId}`].id +
							'.png'
						}
					/>
					{player[0].summonerName}
				</div>
				{[
					{
						func: calcLosingStreak,
						desc: 'Number of games a player has lost consecutively with no greater than a 12 hour break between games.'
                    },
					{
						func: calcWinRate,
						desc: 'Winrate in ranked games played this season.'
                    },
					{
						func: calcMasteryPoints,
						desc: 'Mastery points on the currently played champion.'
                    },
					{
						func: calcLastPlayed,
						desc: 'The last time the player used their current champion.'
                    },
					{
						func: calcAggression,
						desc: 'A percentile representing how aggressive a player is on their current champion compared to other players on the same champion. A low aggression Darius may still be somewhat aggressive and a highly aggressive Soraka may still be somewhat passive.'
                    },
					{
						func: calcWarding,
						desc: 'A percentile representing how effectively a player wards on their current champion compared to other players on the same champion. A low warding Janna may still place more wards than the average player, because Jannas tend to ward a lot.'
                    },
					{
						func: calcTiltScore,
						desc: 'An aggregate of all data collected into a score representing the likely benefit of camping/focusing this player.'
                    },
				].map((data, i) => (
					<div
                        key={`${player[0].summonerName}-${i}-data-cell`}
						className={css(styles.field)}
						style={{ backgroundColor: i % 2 == 0 ? theme('primary2', globalTheme) : null }}
						onMouseMove={(e) => setPopupText(data.desc, e)}
						onMouseLeave={(e) => setPopupText(null, e)}
					>
						{data.func(player) ?? 'not enough data'}
					</div>
				))}
			</div>
		))

		let titles = [
			'Losing Streak',
			'Ranked Win Rate',
			'Mastery Points',
			'Last Played',
			'Aggression',
			'Warding',
			'Tilt Score'
		].map((title, i) => (
			<div className={css(styles.fieldTitle)} key={`title-${i}`} style={{ backgroundColor: i % 2 == 0 ? theme('primary2', globalTheme) : null }}>
				{title}
			</div>
		))

		let dmgMagic = 0
		let dmgPhysical = 0
		let dmgTrue = 0
		let dmgTotal = 0

		team.forEach(player => {
            let [ playerData, playerNum ] = player
			dmgMagic += data.detailedChampStats[playerData.championId]?.magicDamageDealtToChampionsPerSecAvg ?? 0
			dmgPhysical += data.detailedChampStats[playerData.championId]?.physicalDamageDealtToChampionsPerSecAvg ?? 0
			dmgTrue += data.detailedChampStats[playerData.championId]?.trueDamageDealtToChampionsPerSecAvg ?? 0
			dmgTotal += data.detailedChampStats[playerData.championId]?.magicDamageDealtToChampionsPerSecAvg ?? 0
			dmgTotal += data.detailedChampStats[playerData.championId]?.physicalDamageDealtToChampionsPerSecAvg ?? 0
			dmgTotal += data.detailedChampStats[playerData.championId]?.trueDamageDealtToChampionsPerSecAvg ?? 0
		})

        let probabilityInput = data.currentGame.participants.reduce((carry, participant, i) => {
            carry[participant.teamId === 100 ? 'allyTeam' : 'opponentTeam']['picks'][i] = { championId: participant.championId }
            return carry
        }, {
            allyTeam: {
                picks: {}
            },
            opponentTeam: {
                picks: {}
            }
        })

        let probabilityData = WinRateCalc.calcProbability(probabilityInput, { matchups: data.matchups })
        let predictedWinRate = probabilityData.probability || 0.5
        let totalSamples = probabilityData.totalSamples

        let blueSideWR = `${(100 * predictedWinRate).toFixed(1)}%${totalSamples < 100_000 ? ' ?' : ''}`
        let redSideWR = `${(100 * (1 - predictedWinRate)).toFixed(1)}%${totalSamples < 100_000 ? ' ?' : ''}`

        let teamColor = team ? (team[0][0].teamId == 100 ? theme('accent3', globalTheme) : theme('accent4', globalTheme)) : ''

		return (
			<div
				className={css(styles.teamContainer)}
			>
				<div style={{ flex: 1 }}/>
				<div className={css(styles.teamWrapper)}>
					<div
						className={css(styles.teamSide)}
						style={{
							color: teamColor,
						}}
					>
						{team.length > 0 ? (team[0][0].teamId == 100 ? `BLUE SIDE` : `RED SIDE`) : ''}
					</div>
                    <div
                        className={css(styles.oddsOfWinning)}
                        style={{
							color: teamColor,
						}}
                        onMouseMove={(e) => setPopupText(`Odds of this team winning.`, e)}
						onMouseLeave={(e) => setPopupText(null, e)}
                    >
                        {team.length > 0 ? (team[0][0].teamId == 100 ? `${blueSideWR}` : `${redSideWR}`) : ''}
                    </div>
					<div
                        className={css(styles.damageContainer)}
                        onMouseMove={(e) => setPopupText(`Estimated damage type ratio of this team.`, e)}
						onMouseLeave={(e) => setPopupText(null, e)}
                    >
						<div
							className={css(styles.damageBarComponent)}
							style={{
								flex: dmgMagic/dmgTotal,
								backgroundColor: theme('accent3', globalTheme),
							}}
						>
							{`${(100*dmgMagic/dmgTotal).toFixed(1)}% AP`}
						</div>
						<div
							className={css(styles.damageBarComponent)}
							style={{
								flex: dmgPhysical/dmgTotal,
								backgroundColor: theme('accent4', globalTheme),
							}}
						>
							{`${(100*dmgPhysical/dmgTotal).toFixed(1)}% AD`}
						</div>
						<div
							className={css(styles.damageBarComponent)}
							style={{
								flex: dmgTrue/dmgTotal,
								backgroundColor: '#fbfbfb',
							}}
						>
							{`${(100*dmgTrue/dmgTotal).toFixed(1)}%`}
						</div>
					</div>
					<div className={css(styles.fieldsContainer)}>
						<div style={{ width: 105 }}/>
						{titles}
					</div>
					{playerDisplay}
				</div>
				<div style={{ flex: 2 }}/>
			</div>
		)
	}


    loadStyles(globalTheme)

    var team1 = data.currentGame.participants.map((participant, index) => {
        return [participant, index]
    }).filter(participant => participant[0].teamId == 100)
    var team2 = data.currentGame.participants.map((participant, index) => {
        return [participant, index]
    }).filter(participant => participant[0].teamId == 200)

    return (
        <div className={css(styles.dataDisplayContainer)}>
            <div
                id='infoBoxContainer'
                className={css(styles.infoBoxContainer)}
                style={{ display: 'none' }}
            >
                <div id='infoBox' className={css(styles.infoBox)}/>
            </div>
            {makeTeam(team1)}
            {makeTeam(team2)}
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
			flexDirection: 'column',
			flex: 1,
			alignItems: 'center',
	  },
		containerDesktop: {
			backgroundColor: 'rgba(0.5,0.5,0.5,0.01)',
			userSelect: 'none',
		},
		loadingText: {
			color: theme('text1', t),
			textAlign: 'center',
			paddingLeft: 20,
			paddingRight: 20,
			transition: 'background-color 0.25s, color 0.25s',
			marginTop: 200,
			marginBottom: 50,
			...FontSize.large,
		},
		errContainer: {
			margin: '200px 20px 50px 20px',
			borderRadius: 20,
			borderWidth: 8,
			borderStyle: 'solid',
			borderColor: theme('accent1', t, true),
			display: 'flex',
			backgroundColor: theme('primary1', t),
			alignItems: 'center',
			justifyContent: 'center',
			transition: 'background-color 0.25s, color 0.25s, border-color 0.25s',
		},
		errText: {
			...FontSize.large,
			color: theme('text1', t),
			padding: '40px 25px',
			transition: 'background-color 0.25s, color 0.25s, border-color 0.25s',
		},
		tryAgainButton: {
			borderRadius: 5,
			borderWidth: 2,
			borderStyle: 'solid',
			borderColor: theme('accent1', t, true),
			display: 'flex',
			backgroundColor: theme('primary1', t),
			alignItems: 'center',
			justifyContent: 'center',
			transition: 'background-color 0.25s, color 0.25s, border-color 0.25s',
			':hover': {
				borderColor: theme('inputHighlight2', t, true),
				backgroundColor: theme('inputHighlightBackground', t),
				cursor: 'pointer',
			},
		},
		tryAgainText: {
			...FontSize.medium,
			color: theme('text1', t),
			padding: '10px 15px',
			transition: 'background-color 0.25s, color 0.25s, border-color 0.25s',
		},
		dataDisplayContainer: {
			...FontSize.mediumSmall,
			display: 'flex',
			alignSelf: 'stretch',
			flex: 1,
			flexWrap: 'wrap',
			justifyContent: 'space-evenly',
		},
		teamContainer: {
			display: 'flex',
			flexDirection: 'column',
			...ItemSize.large,
			justifyContent: 'center',
		},
		teamWrapper: {
			borderStyle: 'solid',
			borderWidth: 5,
			borderRadius: 10,
			borderColor: theme('inputHighlight', t, true),
			backgroundColor: theme('primary1', t),
			transition: 'background-color 0.25s, border-color 0.25s, color 0.25s',
			display: 'flex',
			flexDirection: 'column',
			marginTop: 25,
		},
		playerDisplayContainer: {
			display: 'flex',
			height: '8vh',
			borderColor: theme('inputHighlight', t, true),
			transition: 'background-color 0.25s, border-color 0.25s, color 0.25s',
			borderStyle: 'solid',
			borderWidth: '2px 0px 0px 0px',
		},
		championIconContainer: {
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			wordBreak: 'break-all',
			textAlign: 'center',
			height: '8vh',
			width: 105,
			...FontSize.small,
			color: theme('text1', t),
			transition: 'background-color 0.25s, border-color 0.25s, color 0.25s',
		},
		championIcon: {
			height: '5vh',
			width: '5vh',
			borderRadius: 5,
		},
		fieldsContainer: {
			display: 'flex',
			height: 50,
			borderColor: theme('inputHighlight', t, true),
			transition: 'background-color 0.25s, border-color 0.25s, color 0.25s',
			borderStyle: 'solid',
			borderWidth: '2px 0px 0px 0px',
		},
		fieldTitle: {
			display: 'flex',
			flex: 1,
			alignItems: 'center',
			justifyContent: 'center',
			textAlign: 'center',
			wordBreak: 'break-word',
			color: theme('text1', t),
			transition: 'background-color 0.25s, border-color 0.25s, color 0.25s',
			marginTop: 0.5,
		},
		field: {
			display: 'flex',
			flex: 1,
			padding: '0px 8px',
			alignItems: 'center',
			justifyContent: 'center',
			textAlign: 'center',
			wordBreak: 'break-word',
			color: theme('text1', t),
			transition: 'background-color 0.25s, border-color 0.25s, color 0.25s',
			marginTop: 0.5,
		},
		damageContainer: {
			height: 18,
			display: 'flex',
			transition: 'background-color 0.25s, border-color 0.25s, color 0.25s',
			margin: '0px 20px 20px 20px',
			borderRadius: 10,
			overflow: 'hidden',
		},
		damageBarComponent: {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			paddingBottom: 2,
		},
		teamSide: {
			...FontSize.extraLarge,
			fontFamily: 'Alegreya Sans',
			fontWeight: 600,
			textAlign: 'center',
			marginTop: 5,
		},
        oddsOfWinning: {
            ...FontSize.medium,
			textAlign: 'center',
			marginBottom: 5,
        },
		infoBoxContainer: {
			position: 'absolute',
            minWidth: 225,
			transform: 'translateX(-50%)',
			alignItems: 'center',
			justifyContent: 'center',
			boxShadow: '0px 0px 3px ' + theme('inputHighlight', t, true),
			borderRadius: 10,
		},
		infoBox: {
			backgroundColor: theme('bg1', t),
			maxWidth: 250,
			borderRadius: 10,
			padding: 10,
			borderColor: theme('inputHighlight', t, true),
			transition: 'background-color 0.25s, border-color 0.25s, color 0.25s',
			borderStyle: 'solid',
			borderWidth: 2,
			color: theme('text1', t),
            display: 'flex',
            flex: 1,
            justifyContent: 'center',
		},
	});
}


export default withRouter(Tiltseek);
