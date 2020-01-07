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
	players: [{ type: ObjectId, ref: 'Player' }]
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


class DataCollector {
	constructor() {
		this.maxAge = (3 * 24 * 60 * 60 * 1000) // 3 days
		this.maxMatches = 100

		this.pause = false
		this._connect()
		this.refreshData()
	}

	_connect() {
		if (process.env.MONGODB_URI) {
			var mongodbUri = process.env.MONGODB_URI
		} else {
			var mongodbUri = 'mongodb://' + encodeURIComponent(process.env.DBUSER) + ':' + encodeURIComponent(process.env.DBPASS) + '@ds259518.mlab.com:59518/heroku_zf74kbvq'
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

	refreshData() {
		var ageLimit = Date.now() - this.maxAge // 3 days ago

		var clearOldMatches = () => {
			return new Promise((resolve, reject) => {
				Match.find({
					gameCreation: { $lt: ageLimit }
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
					var earliestMatchesAllowed = ageLimit

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

		var getStats = () => {
			return new Promise((resolve, reject) => {
				Player.aggregate([{
					$group: {
						_id: '$championId',
						count: { $sum: 1 },
						winRate: { $avg: '$win' },
						gameDuration: { $avg: '$gameDuration' },

						spell1Id: { $max: '$spell1Id' },
						spell2Id: { $max: '$spell2Id' },

						firstBloodParticipate: { $avg: { $max: ['$firstBloodKill','$firstBloodAssist'] } },
						visionScore: { $avg: '$visionScore' },
						magicDamageDealtToChampions: { $avg: '$magicDamageDealtToChampions' },
						physicalDamageDealtToChampions: { $avg: '$physicalDamageDealtToChampions' },
						trueDamageDealtToChampions: { $avg: '$trueDamageDealtToChampions' },
						damageDealtToObjectives: { $avg: '$damageDealtToObjectives' },
						damageDealtToTurrets: { $avg: '$damageDealtToTurrets' },
						kills: { $avg: '$kills' },
						deaths: { $avg: '$deaths' },
						assists: { $avg: '$assists' },
						visionScore: { $avg: '$visionScore' },
						wardsKilled: { $avg: '$wardsKilled' },
						neutralMinionsKilledTeamJungle: { $avg: '$neutralMinionsKilledTeamJungle' },
						neutralMinionsKilledEnemyJungle: { $avg: '$neutralMinionsKilledEnemyJungle' },
						damageSelfMitigated: { $avg: '$damageSelfMitigated' },
						firstInhibitorParticipate: { $avg: { $max: ['$firstInhibitorKill','$firstInhibitorAssist'] } },
						goldEarned: { $avg: '$goldEarned' },
						timeCCingOthers: { $avg: '$timeCCingOthers' },
						totalHeal: { $avg: '$totalHeal' },
					}
				}, {
					$addFields: { championId: "$_id" }
				}], (err, doc) => {
					if (err) {
						console.log(err)
						reject()
					} else {
						console.log(doc)
						console.log(doc.length)
						resolve()
					}
				})
			})
		}

		clearOldMatches()
		.then(res => {
			return getInitialPlayers()
		})
		.then(res => {
			return collectMatches(res)
		})
		.then(res => {
			return getStats()
		})

	}

}

exports.DataCollector = DataCollector;
