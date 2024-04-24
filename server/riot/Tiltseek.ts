import DB from "../db/DB.js";
import Riot, { Region, SummonerName, PUUID, OngoingMatch, Match, MatchId, ChampionId, PlayerChampionMastery, RankedStats, SummonerId, Team } from "./Riot.js";

type Performance = {
    championId: ChampionId;
    aggression: number;
    vision: number;
    total: number;
}

export type ExpectedDamage = {
    magic: number,
    physical: number,
    true: number,
    total: number,
}

export type TiltseekData = {
    team: Team,
    damage: ExpectedDamage,
    players: {
        team: Team,
        name: string,
        championId: ChampionId,
        losingStreak: number,
        performance: Performance,
        championMastery: PlayerChampionMastery,
        rankedStats: RankedStats,
    }[];
}[];

export default class Tiltseek {

    private static async getPlayerHistories(region: Region, puuids: PUUID[]): Promise<Match[][]> {
        return await Promise.all(puuids.map(async (puuid) => {
            const matchHistory = await Riot.getMatchHistory(region, puuid, 20);
            const matches = (await Promise.all(matchHistory.map(async (matchId: MatchId) => {
                try {
                    return await Riot.getMatch(region, matchId)
                } catch (_) {
                    // Sometimes matches can't be found. Not sure why. Maybe Riot is purging them or they're bot games?
                    return null;
                }
            })));
            return matches.filter((match) => match) as Match[];
        }));
    }

    /**
     * Takes two inputs. The first is a specific statistic representing a player's performance in a match.
     * The second is the average of that statistic for a champion. The function returns a normalized value
     * from 0 to 1 representing how much the player's performance deviates from the average. The weird const
     * makes it so that the function returns 0.5 for an input of 1. It can be derived using the Math.atanh()
     * function, but it's slow, so I just hardcoded it.
     */
    private static normalize(playerVal: number, expectedVal: number): number {
        const ratio = playerVal / expectedVal;
        return Math.tanh(ratio/1.820478453);
    }

    private static async calculatePlayerPerformance(puuid: PUUID, playerHistory: Match[]): Promise<Performance> {
        const playerPerformances = await Promise.all(playerHistory.map(async (match) => {
            const participant = match.participants.find((p) => p.puuid === puuid)!;
            const champStats = (await DB.getChampionStats(await DB.getNewestPatch()))[participant.championId];
            const participantKDATotalPerSecond = (participant.kills + participant.deaths + participant.assists) / match.duration;
            const participantVisionPerSecond = participant.visionScore / match.duration;
            const champKDATotalPerSecond = 1_000 * (champStats.kills + champStats.deaths + champStats.assists) / champStats.timePlayed / champStats.total;
            const champVisionPerSecond = 1_000 * champStats.visionScore / champStats.timePlayed / champStats.total;
            return {
                championId: participant.championId,
                aggression: this.normalize(participantKDATotalPerSecond, champKDATotalPerSecond),
                vision: this.normalize(participantVisionPerSecond, champVisionPerSecond),
                total: 1,
            };
        }));
        return {
            championId: playerPerformances[0]?.championId ?? 0,
            aggression: playerPerformances.reduce((acc, p) => acc + p.aggression, 0) / playerPerformances.length,
            vision: playerPerformances.reduce((acc, p) => acc + p.vision, 0) / playerPerformances.length,
            total: playerPerformances.length,
        };
    }

    private static async calculateExpectedDamage(champions: ChampionId[]): Promise<ExpectedDamage> {
        const championStats = await DB.getChampionStats(await DB.getNewestPatch());
        return champions.reduce((acc, championId) => {
            const champStats = championStats[championId];
            acc.magic += champStats.magicDamageDealtToChampions / champStats.total;
            acc.physical += champStats.physicalDamageDealtToChampions / champStats.total;
            acc.true += champStats.trueDamageDealtToChampions / champStats.total;
            acc.total += champStats.totalDamageDealtToChampions / champStats.total;
            return acc;
        }, {
            magic: 0,
            physical: 0,
            true: 0,
            total: 0,
        });
    }

    private static calculateLosingStreak(puuid: PUUID, playerHistory: Match[]): number {
        let streak = 0;
        let time = Date.now() / 1_000;
        for (let i = playerHistory.length - 1; i >= 0; i--) {
            if (
                playerHistory[i].createdAt > time - 60 * 60 * 6
                && playerHistory[i].participants.find((p) => p.puuid === puuid)?.win === false
            ) {
                time = playerHistory[i].createdAt;
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    public static async tiltseek(region: Region, summonerName: SummonerName): Promise<TiltseekData> {
        let puuid: PUUID;
        let currentMatch: OngoingMatch;
        let playersPUUIDs: PUUID[];
        let playersSummonerIds: SummonerId[];
        let playersPerformance: Performance[];
        let playerLosingStreaks: number[];
        let playersChampionMasteries: PlayerChampionMastery[];
        let playersRankedStats: RankedStats[];
        try {
            puuid = await Riot.summonerNameToPUUID(region, summonerName);
        } catch (_) {
            throw new Error('Player not found. Did you remember to include their player tag?');
        }
        try {
            currentMatch = await Riot.getCurrentMatch(region, puuid);
            playersPUUIDs = currentMatch.participants.map((p) => p.puuid);
            playersSummonerIds = currentMatch.participants.map((p) => p.summonerId);
        } catch (_) {
            throw new Error('Player not in game');
        }
        /**
         * This looks absolutely atrocious, and that's because it is. However, it's the only way
         * for us to make the dozens of requests that we need in the most parallel way possible.
         * If we didn't, looking up a player would take ~20 seconds, which is unacceptable.
         */
        [
            /* eslint-disable-next-line prefer-const */
            [playersPerformance, playerLosingStreaks],
            /* eslint-disable-next-line prefer-const */
            playersChampionMasteries,
            /* eslint-disable-next-line prefer-const */
            playersRankedStats,
        ] = await Promise.all([
            (async () => {
                const histories = await this.getPlayerHistories(region, playersPUUIDs);
                const performance = await Promise.all(histories.map((history, i) =>
                    this.calculatePlayerPerformance(playersPUUIDs[i], history)
                ));
                const losingStreaks = histories.map((history, i) =>
                    this.calculateLosingStreak(playersPUUIDs[i], history)
                );
                return [performance, losingStreaks];
            })(),
            (async () => {
                return await Promise.all(currentMatch.participants.map(participant =>
                    Riot.getPlayerChampionMastery(region, puuid, participant.championId)
                ));
            })(),
            (async () => {
                return await Promise.all(playersSummonerIds.map(summonerId =>
                    Riot.getRankedStats(region, summonerId)
                ));
            })(),
        ]);
        const players = currentMatch.participants.map((p, i) => ({
            team: p.team,
            name: p.name,
            championId: p.championId,
            losingStreak: playerLosingStreaks[i],
            performance: playersPerformance[i],
            championMastery: playersChampionMasteries[i],
            rankedStats: playersRankedStats[i],
        }));
        const teams = [{
            players: players.filter(p => p.team === Team.BLUE),
            team: Team.BLUE,
        }, {
            players: players.filter(p => p.team === Team.RED),
            team: Team.RED,
        }];
        return await Promise.all(teams.map(async ({ players, team }) => ({
            team: team,
            damage: await this.calculateExpectedDamage(players.map(p => p.championId)),
            players,
        })));
    }
}