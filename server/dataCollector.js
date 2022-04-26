const mongoose = require('mongoose');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const pantryLib = require('pantry-node')

const realPantry = new pantryLib(process.env.PANTRY_ID)

const sleep = (time) => new Promise(res => setTimeout(res, time))

const doWithRetry = async (func, attempts, ...args) => {
    try {
        return await func(...args)
    } catch (e) {
        if (attempts <= 0) {
            console.log('doWithRetry failed')
            throw e
        } else {
            console.log('caught: ', e)
            try {
                await sleep(Date.now() - (new Date(JSON.parse(e).error.nextValidRequestDate)).getTime() + 10000 * Math.random())
            } catch (e) {
                await sleep(2000 + 10000 * Math.random())
            }
            return await doWithRetry(func, attempts - 1, ...args)
        }
    }
}

// Override pantry functions to include retry
pantry = new pantryLib(process.env.PANTRY_ID)
pantry.basket.create    = (...args) => doWithRetry(realPantry.basket.create.bind(realPantry.basket), 3, ...args)
pantry.basket.delete    = (...args) => doWithRetry(realPantry.basket.delete.bind(realPantry.basket), 3, ...args)
pantry.basket.get       = (...args) => doWithRetry(realPantry.basket.get.bind(realPantry.basket), 3, ...args)
pantry.basket.link      = (...args) => doWithRetry(realPantry.basket.link.bind(realPantry.basket), 3, ...args)
pantry.basket.update    = (...args) => doWithRetry(realPantry.basket.update.bind(realPantry.basket), 3, ...args)
pantry.details          = (...args) => doWithRetry(realPantry.details.bind(realPantry), 3, ...args)

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
	neutralMinionsKilled: { type: Number, required: true },
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


class ChampStats {
    EXP_MOVING_AVG_FACTOR = 10000
    CHUNKS_PER_BASKET = 6
    RIOT_HEADERS = { headers: {
        'X-Riot-Token': process.env.RIOT_API
    }}
    PARTICIPANT_FIELDS = [
        {
            sourceKey: 'win',
        }, {
            sourceKey: 'timePlayed',
            stdDev: true
        }, {
            // summoner spells needs weird stuff done
            cstmKey: ({ participant, champId }) => {
                let prexistingKeys = Object.keys(this.data[champId]).filter(key => key.startsWith('summoner_')).map(key => `summoner_${key.split('_')[1]}_`)
                let uniqueKeys = [...new Set([`summoner_${participant.summoner1Id}_`, `summoner_${participant.summoner2Id}_`, ...prexistingKeys])]
                return uniqueKeys
            },
            cstmVal: ({ participant, keys }) => {
                return keys.map(key => [participant.summoner1Id, participant.summoner2Id].includes(Number(key.split('_')[1])) ? 1 : 0 )
            }
        }, {
            sourceKey: 'firstBloodParticipate',
            cstmVal: ({participant}) => +(participant.firstBloodKill || participant.firstBloodAssist),
        }, {
            sourceKey: 'visionScore',
            stdDev: true,
            perSecond: true,
        }, {
            sourceKey: 'magicDamageDealtToChampions',
            stdDev: true,
            perSecond: true,
        }, {
            sourceKey: 'physicalDamageDealtToChampions',
            stdDev: true,
            perSecond: true,
        }, {
            sourceKey: 'trueDamageDealtToChampions',
            stdDev: true,
            perSecond: true,
        }, {
            sourceKey: 'totalDamageDealtToChampions',
            stdDev: true,
            perSecond: true,
        }, {
            sourceKey: 'totalDamageTaken',
            stdDev: true,
            perSecond: true,
        }, {
            sourceKey: 'damageDealtToObjectives',
            stdDev: true,
            perSecond: true,
        }, {
            sourceKey: 'damageDealtToTurrets',
            stdDev: true,
            perSecond: true,
        }, {
            sourceKey: 'kills',
            stdDev: true,
            perSecond: true,
        }, {
            sourceKey: 'deaths',
            stdDev: true,
            perSecond: true,
        }, {
            sourceKey: 'assists',
            stdDev: true,
            perSecond: true,
        }, {
            sourceKey: 'wardsPlaced',
            stdDev: true,
            perSecond: true,
        }, {
            sourceKey: 'neutralMinionsKilled',
            stdDev: true,
            perSecond: true,
        }, {
            sourceKey: 'objectivesStolen',
            perSecond: true,
        }, {
            sourceKey: 'goldEarned',
            stdDev: true,
            perSecond: true,
        }, 
    ]

    version = null
    data = null

    constructor(v) {
        (async () => {
            await this.getData()
            this.fetch()
        })()
    }

    async setVersion(v=null) {
        this.version = v ?? (await axios.get('https://ddragon.leagueoflegends.com/api/versions.json')).data[0]
    }

    async getData() {
        if (this.version === null) {
            await this.setVersion()
        }
        console.log('loading data')
        let basketsOfVersion = (await pantry.details()).baskets.filter(basket => basket.name.split('_')[0] === this.version)
        let allData = []
        for (let basket of basketsOfVersion) {
            await sleep(2000)
            allData.push(pantry.basket.get(basket.name))
        }
        allData = await Promise.all(allData)
        await sleep(2000)
        console.log('loaded data')
        this.data = Object.assign({ matchCount: 0, lastGameId: null }, ...allData)
        console.log(this.data.matchCount)
    }

    async save() {
        let i = 0
        let baskets = (await pantry.details()).baskets
        while (true) {
            let basketName = `${this.version}_${i}-${i + this.CHUNKS_PER_BASKET-1}`
            let createOrUpdate = !baskets.find(basket => basket.name === basketName) ? 'create' : 'update'
            let chunk = Object.fromEntries(Object.entries(this.data).slice(i, i + this.CHUNKS_PER_BASKET))
            if (!Object.keys(chunk).length) {
                break
            }
            await pantry.basket[createOrUpdate](basketName, chunk)
            await sleep(2000)
            i += this.CHUNKS_PER_BASKET
        }
        console.log('data saved')
    }

    async deleteSavedData() {
        let baskets = (await pantry.details()).baskets
        await Promise.all(baskets.map(async basket => {
            let res = await pantry.basket.delete(basket.name)
            console.log(res)
            await sleep(2000)
            return res
        }))
        this.data = null
    }

    async addMatch(match) {
        this.data.matchCount += 1
        this.data.lastGameId = match.metadata.matchId
        for (let participant of match.info.participants) {
            let champId = participant.championId
            if (!this.data[champId]) {
                this.data[champId] = { count: 1 }
            } else {
                this.data[champId].count += 1
            }
            this.PARTICIPANT_FIELDS.forEach(field => {
                let keys = field.cstmKey?.({ participant, champId }) ?? field.sourceKey
                let vals = ( field.cstmVal?.({ participant, champId, keys }) ?? participant[field.sourceKey] )
                keys = Array.isArray(keys) ? keys : [keys]
                vals = Array.isArray(vals) ? vals : [vals]
                keys = keys.map(key => `${key}${field.perSecond ? 'PerSec' : ''}`)
                vals = field.perSecond ? vals.map(val => val / participant.timePlayed) : vals
                for (let i of Array(keys.length).keys()) {
                    let key = keys[i]
                    let val = vals[i]
                    let windowSize = Math.min(this.data[champId].count, this.EXP_MOVING_AVG_FACTOR)
                    let oldAvg = (this.data[champId][`${key}Avg`] ?? 0)
                    let newAvg = oldAvg + ( val - oldAvg ) / windowSize
                    this.data[champId][`${key}Avg`] = newAvg
                    if (field.stdDev && windowSize > 1) {
                        let oldStdDev = (this.data[champId][`${key}StdDev`] ?? 0)
                        this.data[champId][`${key}Variance`] = oldStdDev * (windowSize - 2) / (windowSize - 1) + (val - newAvg) ** 2 / (windowSize - 1)
                    }
                }
            })
        }
        if (this.data.matchCount % 250 == 0) {
            await this.save()
        }
    }

    async fetch() {
        const fetchCurrGameId = async () => (await axios.get('https://na1.api.riotgames.com/lol/spectator/v4/featured-games', this.RIOT_HEADERS)).data.gameList[0].gameId - 150000
        const skipPattern = [1,1,1].concat((()=>{let[x, y]=[1,1];let l=[];while(l.length<50){[x,y]=[y,x+y];l.push(x);l.concat([...Array(l.length).keys()])};return l})().flatMap((v,i)=>[v,...[...Array(i)].map((_,i)=>1)]))
        let currentGameId = await fetchCurrGameId()
        let skips = 0
        let consecutiveNewVersions = 0

        console.log(`${currentGameId} (${this.data?.matchCount}): initial game id`)
        while (true) {
            await sleep(this.data?.matchCount < 100000 ? 50 : this.data.matchCount / 50)
            let match = null
            try {
                match = (await axios.get('https://americas.api.riotgames.com/lol/match/v5/matches/NA1_' + currentGameId, this.RIOT_HEADERS)).data
            } catch (e) {
                if (skips > 150) {
                    console.log('No matches found in a while. Resetting...')
                    currentGameId = await fetchCurrGameId()
                    skips = 0
                }
                if (e?.response?.status == 404) {
                    console.log(`${currentGameId} (${this.data?.matchCount}): skipped - does not exist`)
                    currentGameId += skipPattern[skips]
                    skips += 1
                } else {
                    console.log('Weird Riot server error. Waiting...')
                    currentGameId += 1
                    await sleep(1000 * 60 * 5)
                }
                continue
            }
            let hrsSinceGame = ( Date.now() - match.info.gameStartTimestamp ) / ( 1000 * 60 * 60 )
            skips = 0
            currentGameId += 1
            if (!this.version.startsWith(match.info.gameVersion.split('.').slice(0,2).join('.'))) {
                console.log(`${currentGameId} (${this.data?.matchCount}): skipped - wrong game version`)
                consecutiveNewVersions += 1
                if (consecutiveNewVersions > 10) {
                    console.log(`Many new game versions discovered. Clearing old data.`)
                    await this.deleteSavedData()
                    await this.setVersion()
                    await this.getData()
                }
                continue
            } else {
                consecutiveNewVersions = 0
            }
            if (match.info.queueId !== 420) {
                console.log(`${currentGameId} (${this.data?.matchCount}): skipped - wrong game mode`)
                continue
            }
            if (hrsSinceGame < 1.5) {
                console.log('All caught up. Waiting...')
                await sleep(1000 * 60 * 1)
                continue
            } else if (hrsSinceGame > 15) {
                console.log('Matches too old. Will find newer match. Waiting...')
                await sleep(1000 * 60 * 1)
                currentGameId = await fetchCurrGameId()
                continue
            }
            console.log(`${currentGameId} (${this.data?.matchCount}): found - played ${hrsSinceGame.toPrecision(3)} hours ago`)
            await this.addMatch(match)
        }
    }
}

class DataCollector {
	constructor() {
		this.maxAgeToClear = (3 * 24 * 60 * 60 * 1000) // 3 days
		this.maxAgeForNewData = (2.5 * 24 * 60 * 60 * 1000) // 2.5 days
		this.maxMatches = 40000

		this.refreshInterval = 900000 // 15 minutes

		this.stats = null
        this.champStats = new ChampStats()

		this._connect()
        setInterval(() => this.getStats(), this.refreshInterval)
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

	async getMatchups() {
		var currentGameVersion = (await axios.get('https://ddragon.leagueoflegends.com/api/versions.json')).data[0]
		var championData = (await axios.get(`https://ddragon.leagueoflegends.com/cdn/${currentGameVersion}/data/en_US/champion.json`)).data.data
		var championIds = Object.values(championData).map(champ => Number(champ.key)).sort((a, b) => a - b)

		var noDataChamps = []

		var batchSize = 10

		var batchedChampionIds = [...Array(Math.ceil(championIds.length/batchSize)).keys()].map(i => championIds.slice(i*batchSize, (i+1)*batchSize))

		var stats = {}

		for (var idBatch of batchedChampionIds) {
			var statsBatch = await Promise.all(idBatch.map(async (id) => { 
				return (await axios.get(`https://axe.lolalytics.com/mega/?ep=champion&v=1&patch=0&cid=${id}&lane=default&tier=all&queue=420&region=all`)).data
			}))
			statsBatch.forEach((champData, i) => {
				var champId = idBatch[i]
			
				try {
					stats[champId] = {
						_id: champId,
						count: champData.n,

						winRateAvg: champData.header.wr / 100,
						banRateAvg: champData.header.br / 100,
						pickRateAvg: champData.header.pr / 100,
						
						defaultLane: champData.header.defaultLane,
						lanes: {
							top: champData.nav.lanes.top / 100,
							jungle: champData.nav.lanes.jungle / 100,
							middle: champData.nav.lanes.middle / 100,
							bottom: champData.nav.lanes.bottom / 100,
							support: champData.nav.lanes.support / 100,
						},

						spell1Id: champData.summary.sums[0],
						spell2Id: champData.summary.sums[1],
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
				return (await axios.get(`https://axe.lolalytics.com/mega/?ep=counter&p=d&v=1&patch=0&cid=${id}&lane=default&tier=all`)).data
			}))

			var synergiesBatch = await Promise.all(idBatch.map(async (id) => { 
				return (await axios.get(`https://axe.lolalytics.com/mega/?ep=champion2&v=1&patch=0&cid=${id}&lane=default&tier=all&queue=420&region=all`)).data
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
        let [ stats, matchups ] = [{}, {}]

		try {
            ({ stats, matchups } = await this.getMatchups())

			console.log('Successfully fetched data from lolalytics')
		} catch (e) {
			console.log(e)
			console.log('Failed to fetch data from lolalytics')
		}

		this.stats = {
			matchups: matchups,
            champStats: Object.values(stats),
		}
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
