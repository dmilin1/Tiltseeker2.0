import DB from "../db/DB.js";
import Riot, { MatchId, PUUID, Region } from "../riot/Riot.js";
import { getRandomSample, patchToNum } from "../utils/Calculations.js";

const MATCH_ID_LIMIT = 500;
const SEED_USER_LIMIT = 1_000;

export default class DataCollector {
    newestPatchSeen?: string;
    region: Region;
    seedUsers: PUUID[] = [];
    matchIds: MatchId[] = [];
    delayNextStep = 0;

    constructor(region: Region) {
        this.region = region;
    }

    public static async start() {
        await DB.init();
        const dataCollectors = [
            new DataCollector('NA1'),
            new DataCollector('KR'),
            new DataCollector('EUW1'),
        ];
        await Promise.all(dataCollectors.map(dc => dc.run()));
    }

    private async run() {
        while (true) {
            await this.runStep();
        }
    }

    private async runStep() {
        await this.handleDelay();
        await this.cleanup();
        await this.getMatches();
    }

    private async handleDelay() {
        if (this.delayNextStep > 0) {
            console.log(`${this.region} - Delaying next step by ${this.delayNextStep}ms`);
            await new Promise(res => setTimeout(res, this.delayNextStep));
            this.delayNextStep = 0;
        }
    }

    private async cleanup() {
        await this.cleanupOldData();
        await this.cleanupSeedUsers();
        await this.cleanupMatchIds();
        console.log(`${this.region} - Seed users: ${this.seedUsers.length}, Match IDs: ${this.matchIds.length}`)
    }

    private async cleanupOldData() {
        if (this.region !== 'NA1') {
            // Don't need all the data collectors to be deleting old data or
            // we could lose data too quickly. We only need one to do it so
            // we'll just have NA1 do it.
            return;
        }
        const matchCount = await DB.getMatchCount();
        if (matchCount > 30_000_000) {
            const oldestPatch = await DB.getOldestPatch();
            await DB.deleteMatches(oldestPatch);
            console.log(`Deleted matches from patch ${oldestPatch}`);
        }
    }

    private async cleanupSeedUsers() {
        if (this.seedUsers.length === 0 && this.matchIds.length === 0) {
            console.log(`${this.region} - Getting seed users`);
            this.seedUsers = await Riot.getPlayerSample(this.region);
        }
        if (this.seedUsers.length > SEED_USER_LIMIT) {
            this.seedUsers = this.seedUsers.slice(-SEED_USER_LIMIT);
        }
    }

    private async cleanupMatchIds() {
        const users = getRandomSample(this.seedUsers, 10);
        const newMatches = (await Promise.all(users.map(async (puuid) => {
            try {
                const matchIds = await Riot.getMatchHistory(this.region, puuid, 10);
                return matchIds.filter(matchId => matchId?.startsWith(this.region));
            } catch {
                return;
            }
        })))
            .flat()
            .filter(matchId => matchId) as MatchId[];
        for (const matchId of newMatches) {
            if (!this.matchIds.includes(matchId)) {
                this.matchIds.push(matchId);
            }
        }
        if (this.matchIds.length > MATCH_ID_LIMIT) {
            this.matchIds = this.matchIds.slice(-MATCH_ID_LIMIT);
        }
    }

    private async getMatches() {
        const matchIds = getRandomSample(this.matchIds, 10);
        const results = await Promise.all(matchIds.map(async (matchId) => {
            let added = false;
            try {
                const match = await Riot.getMatch(this.region, matchId);
                if (!this.newestPatchSeen || patchToNum(match.patch) >= patchToNum(this.newestPatchSeen)) {
                    this.newestPatchSeen = match.patch;
                    added = await DB.addMatch(match);
                } else if (this.matchIds.length < MATCH_ID_LIMIT / 10) {
                    // We're hitting a new patch and are having trouble finding matches. Time to slow down.
                    this.delayNextStep += 5_000;
                }
                if (added) {
                    for (const participant of match.participants) {
                        if (!this.seedUsers.includes(participant.puuid)) {
                            this.seedUsers.push(participant.puuid);
                        }
                    }
                }
            } catch (e: any) {
                console.error(e);
            }
            return added;
        }));
        console.log(`${this.region} - Added ${results.filter(r => r).length} matches`);
    }
}