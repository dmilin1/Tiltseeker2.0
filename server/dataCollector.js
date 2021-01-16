const mongoose = require('mongoose');
const axios = require('axios');
const axiosRetry = require('axios-retry');

axiosRetry(axios, {
	retries: 3,
	retryDelay: axiosRetry.exponentialDelay,
});

axios.interceptors.response.use((res) => {
    return res;
  }, (err) => {
		var promise = new Promise((resolve, reject) => {
			if (err.response.status === 429) {
				console.log('waiting ' + (err.response.headers['retry-after'] * 1000 + 500) + ' for request')
				setTimeout(() => {
					axios.get(err.response.config.url, {
						headers: err.response.config.headers
					})
					.then((res) => resolve(res))
					.catch((err) => reject(err))
				}, err.response.headers['retry-after'] * 1000 + 500)
			} else {
				reject(err)
			}
		})
    return promise;
  });


// define database models
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;


const matchSchema = new Schema({
	matchId: { type: Number, required: true, unique: true },
	queueId: { type: Number, required: true },
	gameVersion: { type: String, required: true },
	gameDuration: { type: Number, required: true },
	gameCreation: { type: Number, required: true },
	players: [{ type: ObjectId, ref: 'Player' }],
});

const Match = mongoose.model('Match', matchSchema);



const playerSchema = new Schema({
	championId: { type: Number, required: true },
	win: { type: Number, required: true },
	gameDuration: { type: Number, required: true },

	spell1Id: { type: Number, required: true },
	spell2Id: { type: Number, required: true },

	firstBloodKill: { type: Number, required: true },
	firstBloodAssist: { type: Number, required: true },
	visionScore: { type: Number, required: true },
	magicDamageDealtToChampions: { type: Number, required: true },
	physicalDamageDealtToChampions: { type: Number, required: true },
	trueDamageDealtToChampions: { type: Number, required: true },
	totalDamageDealtToChampions: { type: Number, required: true },
	magicalDamageTaken: { type: Number, required: true },
	physicalDamageTaken: { type: Number, required: true },
	trueDamageTaken: { type: Number, required: true },
	totalDamageTaken: { type: Number, required: true },
	damageDealtToObjectives: { type: Number, required: true },
	damageDealtToTurrets: { type: Number, required: true },
	kills: { type: Number, required: true },
	deaths: { type: Number, required: true },
	assists: { type: Number, required: true },
	visionScore: { type: Number, required: true },
	wardsKilled: { type: Number, required: true },
	neutralMinionsKilledTeamJungle: { type: Number, required: true },
	neutralMinionsKilledEnemyJungle: { type: Number, required: true },
	damageSelfMitigated: { type: Number, required: true },
	firstInhibitorKill: { type: Number, required: true },
	firstInhibitorAssist: { type: Number, required: true },
	goldEarned: { type: Number, required: true },
	timeCCingOthers: { type: Number, required: true },
	totalHeal: { type: Number, required: true },


	// reviewsPosted: [{ type: ObjectId, ref: 'Review' }],
	// reviewsAbout: [{ type: ObjectId, ref: 'Review' }],
	// ratingTotal: { type: Number, required: true, default: 0 },
	// ratingCount: { type: Number, required: true, default: 0 },
	// gigsCompleted: { type: Number, required: true, default: 0 },
	// stripeId: String,
	// pushNotificationId: String,
});

const Player = mongoose.model('Player', playerSchema);



const loginSchema = new Schema({
	hash: { type: String, required: true, },
	date: { type: Date, default: Date.now },
});

const Login = mongoose.model('Login', loginSchema);



const matchupsSchema = new Schema({
		matchups: { type: Object },
		version: { type: String },
	}, {
		timestamps: true
	}
);

const Matchups = mongoose.model('Matchups', matchupsSchema);



const donationSchema = new Schema({
		sessionId: { type: String, required: true, unique: true },
		amount: { type: Number, required: true },
		paidAt: { type: Number, required: true },
		donation: { type: Object },
	}, {
		timestamps: true
	}
);

const Donation = mongoose.model('Donation', donationSchema);



class DataCollector {
	constructor() {
		this.maxAgeToClear = (3 * 24 * 60 * 60 * 1000) // 3 days
		this.maxAgeForNewData = (2.5 * 24 * 60 * 60 * 1000) // 3 days
		this.maxMatches = 40000

		this.refreshInterval = 900000 // 15 minutes

		this.stats = null

		this.currentlyRefreshing = false
		this.pause = false
		this._connect()

		this.refreshData()
		this.interval = setInterval(() => {
			if (!this.pause) { this.refreshData() }
		}, 900000)
	}

	_connect() {
		if (process.env.MONGODB_URI) {
			var mongodbUri = process.env.MONGODB_URI
		} else {
			var mongodbUri = process.env.DB_URL
		}
		mongoose.connect(
			mongodbUri,
			{
				useNewUrlParser: true,
				useFindAndModify: false,
				useUnifiedTopology: true,
			},
			(err) => {
				if (err) {
					console.log("FAILED TO CONNECT TO DATABASE");
					console.log(err);
				} else {
					console.log("Connected to database");
				}
		});
	}

	pause(num=0) {
		clearTimeout(this.timer)
		this.timer = setTimeout(() => this.pause = true, num)
	}

	unPause(num=0) {
		clearTimeout(this.timer)
		this.timer = setTimeout(() => this.pause = false, num)
	}

	togglePause(num=0) {
		clearTimeout(this.timer)
		this.timer = setTimeout(() => this.pause = !this.pause, num)
	}

	print() {
		console.log(
			'paused: ' + this.pause
		)
	}

	async getGoodData() {
		var currentGameVersion = (await axios.get('https://ddragon.leagueoflegends.com/api/versions.json')).data[0]
		var championData = (await axios.get(`https://ddragon.leagueoflegends.com/cdn/${currentGameVersion}/data/en_US/champion.json`)).data.data
		var championIds = Object.values(championData).map(champ => Number(champ.key)).sort((a, b) => a - b)

		var noDataChamps = []

		var batchSize = 10

		var batchedChampionIds = [...Array(Math.ceil(championIds.length/batchSize)).keys()].map(i => championIds.slice(i*batchSize, (i+1)*batchSize))

		var stats = {}

		for (var idBatch of batchedChampionIds) {
			var statsBatch = await Promise.all(idBatch.map(async (id) => { 
				return (await axios.get(`https://apix1.op.lol/mega/?ep=champion&v=8&patch=0&cid=${id}&lane=default&tier=all&queue=420&region=all`)).data
			}))
			statsBatch.forEach((champData, i) => {
				var champId = idBatch[i]
			
				try {
					// gameDurationAvg is estimate. No way to get perfect number right now.

					var champStats = champData.stats.reduce((accum, [key, name, idkWhatThisIs, value, percentile, rank]) => {
						accum[key] = value
						return accum
					}, {})

					var objectiveStats = Object.entries(champData.objective).reduce((accum, [key, data]) => {
						accum[key] = data['win'][0]
						return accum
					}, {})

					stats[champId] = {
						_id: champId,
						count: champData.n,
						winRateAvg: champData.header.wr / 100,
						banRateAvg: champData.header.br / 100,
						pickRateAvg: champData.header.pr / 100,

						spell1Id: champData.summary.sums[0],
						spell2Id: champData.summary.sums[1],

						firstBloodParticipateAvg: objectiveStats.blood1 / 100,
						magicDamageDealtToChampionPerSecsAvg: champStats.magicDamage,
						physicalDamageDealtToChampionsPerSecAvg: champStats.physicalDamage,
						trueDamageDealtToChampionsPerSecAvg: champStats.trueDamage,
						totalDamageDealtToChampionsPerSecAvg: champStats.damage,
						totalDamageTakenPerSecAvg: champStats.damageTaken,
						killsPerSecAvg: champStats.kills,
						deathsPerSecAvg: champStats.deaths,
						assistsPerSecAvg: champStats.assists,
						neutralMinionsKilledTeamJunglePerSecAvg: champStats.teamJungleCS,
						neutralMinionsKilledEnemyJunglePerSecAvg: champStats.enemyJungleCS,
						firstInhibitorParticipateAvg: objectiveStats.inhibitor1 / 100,
						goldEarnedPerSecAvg: champStats.gold,
						totalHealPerSecAvg: champStats.heal,
					}
				} catch (e) {
					noDataChamps.push(champId)
				}
			})
		}

		if (noDataChamps.length > 5) {
			throw Error('failed to fetch stats from lolalytics')
		}

		console.log('fetched stats from lolalytics')


		var matchups = {}

		championIds.forEach((champA, i) => championIds.slice(i).forEach((champB, i) => {
			matchups[`${champA}v${champB}`] = 0
			matchups[`${champA}v${champB}_total`] = 0
			matchups[`${champA}w${champB}`] = 0
			matchups[`${champA}w${champB}_total`] = 0
		}))

		for (var idBatch of batchedChampionIds) {

			var countersBatch = await Promise.all(idBatch.map(async (id) => { 
				return (await axios.get(`https://apix1.op.lol/mega/?ep=counter&p=d&v=1&patch=0&cid=${id}&lane=default&tier=all`)).data
			}))

			var synergiesBatch = await Promise.all(idBatch.map(async (id) => { 
				return (await axios.get(`https://apix1.op.lol/mega/?ep=champion2&v=8&patch=0&cid=${id}&lane=default&tier=all&queue=420&region=all`)).data
			}))

			var lanes = ['top', 'jungle', 'mid', 'support', 'bottom']

			lanes.forEach(lane => {
				countersBatch.forEach((counter, i) => (counter[`enemy_${lane}`] || []).forEach(([champB, gamesPlayed, gamesWon, enemyOverallLaneWinrate]) => {
					var champA = idBatch[i]
					if (champA <= champB) {
						matchups[`${champA}v${champB}`] += Number(gamesWon)
						matchups[`${champA}v${champB}_total`] += Number(gamesPlayed)
					}
				}))
				synergiesBatch.forEach((synergy, i) => (synergy[`team_${lane}`] || []).forEach(([champB, gamesPlayed, gamesWon, enemyOverallLaneWinrate]) => {
					var champA = idBatch[i]
					if (champA <= champB) {
						matchups[`${champA}w${champB}`] += Number(gamesWon)
						matchups[`${champA}w${champB}_total`] += Number(gamesPlayed)
					}
				}))
			})

			countersBatch.forEach((counter, i) => {
				var champId = idBatch[i]
				matchups[`${champId}w${champId}`] = counter.win
				matchups[`${champId}w${champId}_total`] = counter.pick
			})
		}

		console.log('fetched synergies and counters from lolalytics')

		return {
			stats,
			matchups
		}
	}

	async getStats() {
		var champStats = await Player.aggregate([{
			$group: {
				_id: '$championId',
				count: { $sum: 1 },
				winRateAvg: { $avg: '$win' },
				gameDurationAvg: { $avg: '$gameDuration' },

				spell1Id: { $max: '$spell1Id' },
				spell2Id: { $max: '$spell2Id' },

				firstBloodParticipateAvg: { $avg: { $max: ['$firstBloodKill','$firstBloodAssist'] } },
				visionScorePerSecAvg: { $avg: { $divide: [ '$visionScore', '$gameDuration' ] } },
				magicDamageDealtToChampionPerSecsAvg: { $avg: { $divide: [ '$magicDamageDealtToChampions', '$gameDuration' ] } },
				physicalDamageDealtToChampionsPerSecAvg: { $avg: { $divide: [ '$physicalDamageDealtToChampions', '$gameDuration' ] } },
				trueDamageDealtToChampionsPerSecAvg: { $avg: { $divide: [ '$trueDamageDealtToChampions', '$gameDuration' ] } },
				totalDamageDealtToChampionsPerSecAvg: { $avg: { $divide: [ '$totalDamageDealtToChampions', '$gameDuration' ] } },
				magicalDamageTakenPerSecAvg: { $avg: { $divide: [ '$magicalDamageTaken', '$gameDuration' ] } },
				physicalDamageTakenPerSecAvg: { $avg: { $divide: [ '$physicalDamageTaken', '$gameDuration' ] } },
				trueDamageTakenPerSecAvg: { $avg: { $divide: [ '$trueDamageTaken', '$gameDuration' ] } },
				totalDamageTakenPerSecAvg: { $avg: { $divide: [ '$totalDamageTaken', '$gameDuration' ] } },
				damageDealtToObjectivesAvg: { $avg: '$damageDealtToObjectives' },
				damageDealtToTurretsAvg: { $avg: '$damageDealtToTurrets' },
				killsPerSecAvg: { $avg: { $divide: [ '$kills', '$gameDuration' ] } },
				deathsPerSecAvg: { $avg: { $divide: [ '$deaths', '$gameDuration' ] } },
				assistsPerSecAvg: { $avg: { $divide: [ '$assists', '$gameDuration' ] } },
				wardsKilledPerSecAvg: { $avg: { $divide: [ '$wardsKilled', '$gameDuration' ] } },
				neutralMinionsKilledTeamJunglePerSecAvg: { $avg: { $divide: [ '$neutralMinionsKilledTeamJungle', '$gameDuration' ] } },
				neutralMinionsKilledEnemyJunglePerSecAvg: { $avg: { $divide: [ '$neutralMinionsKilledEnemyJungle', '$gameDuration' ] } },
				damageSelfMitigatedPerSecAvg: { $avg: { $divide: [ '$damageSelfMitigated', '$gameDuration' ] } },
				firstInhibitorParticipateAvg: { $avg: { $max: ['$firstInhibitorKill','$firstInhibitorAssist'] } },
				goldEarnedPerSecAvg: { $avg: { $divide: [ '$goldEarned', '$gameDuration' ] } },
				timeCCingOthersPerSecAvg: { $avg: { $divide: [ '$timeCCingOthers', '$gameDuration' ] } },
				totalHealPerSecAvg: { $avg: { $divide: [ '$totalHeal', '$gameDuration' ] } },


				winRateStdDev: { $stdDevPop: '$win' },
				gameDurationStdDev: { $stdDevPop: '$gameDuration' },

				firstBloodParticipateStdDev: { $stdDevPop: { $max: ['$firstBloodKill','$firstBloodAssist'] } },
				visionScorePerSecStdDev: { $stdDevPop: { $divide: [ '$visionScore', '$gameDuration' ] } },
				magicDamageDealtToChampionsPerSecStdDev: { $stdDevPop: { $divide: [ '$magicDamageDealtToChampions', '$gameDuration' ] } },
				physicalDamageDealtToChampionsPerSecStdDev: { $stdDevPop: { $divide: [ '$physicalDamageDealtToChampions', '$gameDuration' ] } },
				trueDamageDealtToChampionsPerSecStdDev: { $stdDevPop: { $divide: [ '$trueDamageDealtToChampions', '$gameDuration' ] } },
				totalDamageDealtToChampionsPerSecStdDev: { $stdDevPop: { $divide: [ '$totalDamageDealtToChampions', '$gameDuration' ] } },
				magicalDamageTakenPerSecStdDev: { $stdDevPop: { $divide: [ '$magicalDamageTaken', '$gameDuration' ] } },
				physicalDamageTakenPerSecStdDev: { $stdDevPop: { $divide: [ '$physicalDamageTaken', '$gameDuration' ] } },
				trueDamageTakenPerSecStdDev: { $stdDevPop: { $divide: [ '$trueDamageTaken', '$gameDuration' ] } },
				totalDamageTakenPerSecStdDev: { $stdDevPop: { $divide: [ '$totalDamageTaken', '$gameDuration' ] } },
				damageDealtToObjectivesStdDev: { $stdDevPop: '$damageDealtToObjectives' },
				damageDealtToTurretsStdDev: { $stdDevPop: '$damageDealtToTurrets' },
				killsPerSecStdDev: { $stdDevPop: { $divide: [ '$kills', '$gameDuration' ] } },
				deathsPerSecStdDev: { $stdDevPop: { $divide: [ '$deaths', '$gameDuration' ] } },
				assistsPerSecStdDev: { $stdDevPop: { $divide: [ '$assists', '$gameDuration' ] } },
				wardsKilledPerSecStdDev: { $stdDevPop: { $divide: [ '$wardsKilled', '$gameDuration' ] } },
				neutralMinionsKilledTeamJunglePerSecStdDev: { $stdDevPop: { $divide: [ '$neutralMinionsKilledTeamJungle', '$gameDuration' ] } },
				neutralMinionsKilledEnemyJunglePerSecStdDev: { $stdDevPop: { $divide: [ '$neutralMinionsKilledEnemyJungle', '$gameDuration' ] } },
				damageSelfMitigatedPerSecStdDev: { $stdDevPop: { $divide: [ '$damageSelfMitigated', '$gameDuration' ] } },
				firstInhibitorParticipateStdDev: { $stdDevPop: { $max: ['$firstInhibitorKill','$firstInhibitorAssist'] } },
				goldEarnedPerSecStdDev: { $stdDevPop: { $divide: [ '$goldEarned', '$gameDuration' ] } },
				timeCCingOthersPerSecStdDev: { $stdDevPop: { $divide: [ '$timeCCingOthers', '$gameDuration' ] } },
				totalHealPerSecStdDev: { $stdDevPop: { $divide: [ '$totalHeal', '$gameDuration' ] } },
			}
		}])


		try {
			var goodData = await this.getGoodData()

			for (var champData of champStats) {
				// fix perSec stats
				Object.keys(goodData.stats[champData._id]).forEach(key => {
					if (key.toLowerCase().includes('persec')) {
						goodData.stats[champData._id][key] /= champData.gameDurationAvg
					}
				})

				Object.assign(champData, goodData.stats[champData._id])
			}

			var fullMatchups = goodData.matchups

			console.log('Successfully fetched data from lolalytics')
		} catch (e) {
			console.log(e)
			console.log('Failed to fetch data from lolalytics. Using self hosted data instead.')

			var matchupFiles = await Matchups.find({ updatedAt: { $gt: new Date() - 1000 * 60 * 60 * 24 * 14 }})

			var fullMatchups = {}
			
			for (var matchups of matchupFiles) {
				for (var arr of Object.entries(matchups.matchups)) {
					var matchup = arr[0]
					var score = arr[1]
					fullMatchups[matchup] = fullMatchups[matchup] ? fullMatchups[matchup] + score : score
				}
			}
		}

		this.stats = {
			champStats: champStats,
			matchups: fullMatchups,
		}
	}

	refreshData() {
		if (this.currentlyRefreshing) {
			return
		}

		var ageLimitToClear = Date.now() - this.maxAgeToClear
		var ageLimitForNewData = Date.now() - this.maxAgeForNewData

		var clearOldMatches = () => {
			return new Promise((resolve, reject) => {
				Match.find({
					gameCreation: { $lt: ageLimitToClear }
				}, (err, doc) => {
					var matchesToDelete = []
					var oldPlayers = []
					for (var match of doc) {
						oldPlayers.push(...match.players)
						matchesToDelete.push(match._id)
					}
					Player.deleteMany({
						_id: { $in: oldPlayers }
					}, (err, doc) => {
						if (err) {
							reject(err)
						} else {
							Match.deleteMany({
								_id: { $in: matchesToDelete }
							}, (err, doc) => {
								if (err) {
									reject(err)
								} else {
									console.log(doc.deletedCount + ' old matches were removed')
									resolve()
								}
							})
						}
					})
				})
			})
		}

		var getInitialPlayers = () => {
			var getInitialPlayersPromise = new Promise((resolve, reject) => {
				axios.get('https://na1.api.riotgames.com/lol/spectator/v4/featured-games', {
					headers: {
						'X-Riot-Token': process.env.RIOT_API
					}
				})
				.then((res) => {
					var summonerNames = []
					for (var game of res.data.gameList) { for (var player of game.participants) { summonerNames.push(player.summonerName) }}
					var promises = summonerNames.map(name =>
						axios.get('https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/' + encodeURI(name), {
							headers: {
								'X-Riot-Token': process.env.RIOT_API
							}
						})
					)
					axios.all(promises)
					.then(res => {
						resolve(res.map(res => res.data.accountId))
					})
					.catch((err) => {
						reject('Failed to get featured games.')
					})
				})
				.catch((err) => {
					reject('Failed to get featured games.')
				})
			})
			return getInitialPlayersPromise
		}

		var addMatchToDatabase = (match) => {
			var promise = new Promise((resolve, reject) => {

				var newMatch = new Match()

				newMatch.matchId = match.gameId;
				newMatch.queueId = match.queueId;
				newMatch.gameVersion = match.gameVersion;
				newMatch.gameDuration = match.gameDuration;
				newMatch.gameCreation = match.gameCreation;
				newMatch.players = []

				// console.log(match)

				var matchups = {}

				match.participants.forEach((participant, i) => {
					if (i >= match.participants.length - 1) { return }
					match.participants.forEach((otherParticipant, j) => {
						var [a, b] = [participant, otherParticipant].sort((a, b) => a.championId - b.championId)
						var key = a.championId + (a.teamId == b.teamId ? 'w' : 'v') + b.championId
						matchups[key] = a.stats.win ? 1 : 0
					})
				});

				var increments = Object.entries(matchups).reduce((total, current) => {
					total['matchups.' + current[0]] = current[1]
					total['matchups.' + current[0] + '_total'] = 1
					return total
				}, {})

				Matchups.findOneAndUpdate(
					{ version: newMatch.gameVersion },
					{ $inc: increments },
					{ upsert: true },
				).then(res => {
					// console.log(res)
				}).catch(err => {
					// console.log(err)
				})


				var newPlayers = []

				for (let [i, participant] of Object.entries(match.participants)) {
					var player = new Player()

					player.championId = participant.championId
					player.win = participant.stats.win
					player.gameDuration = match.gameDuration

					player.spell1Id = [participant.spell1Id, participant.spell2Id].sort()[0]
					player.spell2Id = [participant.spell1Id, participant.spell2Id].sort()[1]

					player.firstBloodKill = participant.stats.firstBloodKill
					player.firstBloodAssist = participant.stats.firstBloodAssist
					player.visionScore = participant.stats.visionScore
					player.magicDamageDealtToChampions = participant.stats.magicDamageDealtToChampions
					player.physicalDamageDealtToChampions = participant.stats.physicalDamageDealtToChampions
					player.trueDamageDealtToChampions = participant.stats.trueDamageDealtToChampions
					player.totalDamageDealtToChampions = participant.stats.totalDamageDealtToChampions
					player.magicalDamageTaken = participant.stats.magicalDamageTaken
					player.physicalDamageTaken = participant.stats.physicalDamageTaken
					player.trueDamageTaken = participant.stats.trueDamageTaken
					player.totalDamageTaken = participant.stats.totalDamageTaken
					player.damageDealtToObjectives = participant.stats.damageDealtToObjectives
					player.damageDealtToTurrets = participant.stats.damageDealtToTurrets
					player.kills = participant.stats.kills
					player.deaths = participant.stats.deaths
					player.assists = participant.stats.assists
					player.visionScore = participant.stats.visionScore
					player.wardsKilled = participant.stats.wardsKilled
					player.neutralMinionsKilledTeamJungle = participant.stats.neutralMinionsKilledTeamJungle
					player.neutralMinionsKilledEnemyJungle = participant.stats.neutralMinionsKilledEnemyJungle
					player.damageSelfMitigated = participant.stats.damageSelfMitigated
					player.firstInhibitorKill = Boolean(participant.stats.firstInhibitorKill)
					player.firstInhibitorAssist = Boolean(participant.stats.firstInhibitorAssist)
					player.goldEarned = participant.stats.goldEarned
					player.timeCCingOthers = participant.stats.timeCCingOthers
					player.totalHeal = participant.stats.totalHeal

					newPlayers.push(player)
					newMatch.players.push(player._id)
				}


				newMatch.save((err, doc) => {
					if (err) {
						reject(err)
					} else {
						console.log('match ' + match.gameId + ' added')
						Player.insertMany(newPlayers, (err, doc => {
							if (err) {
								reject(err)
							} else {
								resolve()
							}
						}))
					}
				})

			})
			return promise
		}

		var collectMatches = (players, potentialMatches = []) => {
			return new Promise((externalResolve, externalReject) => {
				new Promise((resolve, reject) => {
					var earliestMatchesAllowed = ageLimitForNewData

					var selectedPlayerIndex = Math.floor(Math.random()*players.length)
					var selectedPlayer = players[selectedPlayerIndex]
					players.splice(selectedPlayerIndex, 1)

					if (potentialMatches.length === 0) {
						axios.get('https://na1.api.riotgames.com/lol/match/v4/matchlists/by-account/' + selectedPlayer + '?beginTime=' + earliestMatchesAllowed + '&queue=400&queue=420', {
							headers: {
								'X-Riot-Token': process.env.RIOT_API
							}
						})
						.then(res => {
							for (var match of res.data.matches) {
								potentialMatches.push(match.gameId)
							}
							resolve()
						})
						.catch(err => {
							console.log('matches not found')
							if (err.response.status === 404) {
								resolve()
							}
						})
					} else {
						Match.estimatedDocumentCount()
						.then(count => {
							if (count < this.maxMatches) {
								var selectedMatchIndex = Math.floor(Math.random()*potentialMatches.length)
								var selectedMatch = potentialMatches[selectedMatchIndex]
								potentialMatches.splice(selectedMatchIndex, 1)
								axios.get('https://na1.api.riotgames.com/lol/match/v4/matches/' + selectedMatch, {
									headers: {
										'X-Riot-Token': process.env.RIOT_API
									}
								})
								.then(res => {
									addMatchToDatabase(res.data)
									.then(() => {
										for (var participant of res.data.participantIdentities) {
											players.push(participant.player.currentAccountId)
										}
										resolve()
									})
									.catch((err) => {
										if (err.name === 'MongoError' && err.code === 11000) {
											console.log('duplicate match rejected')
											resolve()
										} else {
											console.log(err)
											reject('failed to add match to database')
										}
									})
								})
								.catch(res => {
									reject('failed to get match data')
								})
							} else {
								resolve('complete')
							}
						})
					}
				})
				.then(res => {
					if (res != 'complete') {
						externalResolve(collectMatches(players, potentialMatches))
					} else {
						console.log('finished loading matches')
						externalResolve()
					}
				})
			})
		}


		console.log('refreshing data')
		this.currentlyRefreshing = true

		return new Promise((resolve, reject) => {
			clearOldMatches()
			.then(res => {
				return getInitialPlayers()
			})
			.then(res => {
				return collectMatches(res)
			})
			.then(res => {
				this.currentlyRefreshing = false
				resolve()
				return this.getStats()
			})
			.catch(err => {
				console.log(err)
				this.currentlyRefreshing = false
				reject(err)
			})
		})

	}

	loginAttempt(hash) {
		var newLogin = new Login()
		newLogin.hash = hash
		newLogin.save()
	}

	async saveDonation(donation) {
		var newDonation = new Donation()
		newDonation.donation = donation
		newDonation.sessionId = donation.session.id
		newDonation.amount = donation.session.amount_total
		newDonation.paidAt = donation.customer.created
		await newDonation.save()
	}

	async getDonations() {
		return await Donation.aggregate([
			{
				'$project': {
				'amount': true, 
				'paidAt': true
				}
			}, {
				'$sort': {
				'paidAt': 1
				}
			}
		])
	}
}

exports.DataCollector = DataCollector;
