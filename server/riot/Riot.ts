import { getRandomSample } from "../utils/Calculations.js";

export type RoutingValue = 'AMERICAS' | 'ASIA' | 'EUROPE' | 'SEA';
export type Region = 'NA1' | 'BR1' | 'EUN1' | 'EUW1' | 'JP1' | 'KR' | 'LA1' | 'LA2' | 'OC1' | 'TR1' | 'RU';
export enum Team {
    RED = 'Red',
    BLUE = 'Blue',
}

/* Makes a generic into a distinct type */
type Distinct<T, DistinctName> = T & { __TYPE__: DistinctName };

export type SummonerName = Distinct<string, 'SummonerName'>;
export type PUUID = Distinct<string, 'PUUID'>;
export type SummonerId = Distinct<string, 'SummonerId'>;
export type MatchId = Distinct<string, 'MatchId'>;
export type ChampionId = Distinct<number|string, 'MatchId'>;

export type Match = {
    id: MatchId;
    patch: string;
    createdAt: number;
    duration: number;
    bans: number[];
    participants: {
        win: boolean;
        puuid: PUUID;
        championId: ChampionId;
        teamId: number;
        firstBloodParticipate: boolean;
        visionScore: number;
        magicDamageDealtToChampions: number;
        physicalDamageDealtToChampions: number;
        trueDamageDealtToChampions: number;
        totalDamageDealtToChampions: number;
        totalDamageTaken: number;
        damageDealtToObjectives: number;
        damageDealtToTurrets: number;
        kills: number;
        deaths: number;
        assists: number;
        wardsPlaced: number;
        neutralMinionsKilled: number;
        objectivesStolen: number;
        goldEarned: number;
    }[];
}

export type OngoingMatch = {
    id: MatchId;
    participants: {
        name: string;
        championId: ChampionId;
        summonerId: SummonerId;
        puuid: PUUID;
        team: Team;
    }[];
}

export type PlayerChampionMastery = {
    championId: ChampionId;
    mastery: number;
    lastPlayed?: number;
}

export type RankedStats = {
    wins: number;
    total: number;
}

export type RegionToRoutingType = {
    [key in Region]: RoutingValue;
}

export const RegionToRouting: RegionToRoutingType = {
    'NA1': 'AMERICAS',
    'BR1': 'AMERICAS',
    'EUN1': 'EUROPE',
    'EUW1': 'EUROPE',
    'JP1': 'ASIA',
    'KR': 'ASIA',
    'LA1': 'AMERICAS',
    'LA2': 'AMERICAS',
    'OC1': 'SEA',
    'TR1': 'EUROPE',
    'RU': 'EUROPE',
}

export default class Riot {
    public static async req(
        input: URL | RequestInfo,
        init?: RequestInit | undefined,
        failures = 0,
    ): Promise<Response> {
        if (!process.env.RIOT_API_KEY) {
            throw new Error('No Riot API key provided');
        }
        try {
            return await fetch(input, {
                ...init,
                headers: {
                    ...init?.headers,
                    'X-Riot-Token': process.env.RIOT_API_KEY,
                },
            })
        } catch (e) {
            if (failures >= 2) {
                throw e;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return this.req(input, init, failures + 1);
        }
    }

    public static async getCurrentPatch(): Promise<string> {
        const response = await this.req('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions = await response.json();
        return versions[0].split('.').slice(0, 2).join('.');
    }

    public static async summonerNameToPUUID(region: Region, summonerName: SummonerName): Promise<PUUID> {
        const [gameName, tagLine] = summonerName.split('#');
        const response = await this.req(`https://${RegionToRouting[region]}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`);
        const data = await response.json();
        if (data?.status?.status_code === 404) {
            throw new Error(data?.status?.message);   
        }
        return data.puuid as PUUID;
    }

    public static async summonerIdToPUUID(region: Region, summonerId: SummonerId): Promise<PUUID> {
        const response = await this.req(`https://${region}.api.riotgames.com/lol/summoner/v4/summoners/${summonerId}`);
        const data = await response.json();
        return data.puuid as PUUID;
    }

    public static async getPlayerSample(region: Region): Promise<PUUID[]> {
        const response = await this.req(`https://${region}.api.riotgames.com/lol/league/v4/masterleagues/by-queue/RANKED_SOLO_5x5`);
        const data = await response.json();
        const summonerIds: SummonerId[] = getRandomSample(data.entries, 10).map((item: any) => item.summonerId);
        return Promise.all(summonerIds.map((summonerId) => this.summonerIdToPUUID(region, summonerId)));
    }

    public static async getMatchHistory(region: Region, puuid: PUUID, count=20): Promise<MatchId[]> {
        const response = await this.req(`https://${RegionToRouting[region]}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&count=${count}`);
        const data = await response.json();
        return data as MatchId[];
    }

    public static async getMatch(region: Region, matchId: MatchId): Promise<Match> {
        const response = await this.req(`https://${RegionToRouting[region]}.api.riotgames.com/lol/match/v5/matches/${matchId}`);
        const data = await response.json();
        return {
            id: data.metadata.matchId,
            patch: data.info.gameVersion.split('.').slice(0, 2).join('.'),
            createdAt: data.info.gameCreation,
            duration: data.info.gameDuration,
            bans: data.info.teams[0].bans.concat(data.info.teams[1].bans).map((ban: any) => ban.championId),
            participants: data.info.participants.map((participant: any) => ({
                win: participant.win,
                puuid: participant.puuid,
                championId: participant.championId,
                teamId: participant.teamId,
                firstBloodParticipate: participant.firstBloodParticipate,
                visionScore: participant.visionScore,
                magicDamageDealtToChampions: participant.magicDamageDealtToChampions,
                physicalDamageDealtToChampions: participant.physicalDamageDealtToChampions,
                trueDamageDealtToChampions: participant.trueDamageDealtToChampions,
                totalDamageDealtToChampions: participant.totalDamageDealtToChampions,
                totalDamageTaken: participant.totalDamageTaken,
                damageDealtToObjectives: participant.damageDealtToObjectives,
                damageDealtToTurrets: participant.damageDealtToTurrets,
                kills: participant.kills,
                deaths: participant.deaths,
                assists: participant.assists,
                wardsPlaced: participant.wardsPlaced,
                neutralMinionsKilled: participant.neutralMinionsKilled,
                objectivesStolen: participant.objectivesStolen,
                goldEarned: participant.goldEarned,
            }))
        };
    }

    public static async getCurrentMatch(region: Region, puuid: PUUID): Promise<OngoingMatch> {
        const response = await this.req(`https://${region}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`);
        const data = await response.json();
        return {
            id: data.gameId,
            participants: data.participants.map((participant: any) => ({
                name: participant.riotId,
                championId: participant.championId,
                summonerId: participant.summonerId,
                puuid: participant.puuid,
                team: participant.teamId === 100 ? Team.BLUE : Team.RED,
            }))
        };
    }

    public static async getPlayerChampionMastery(region: Region, puuid: PUUID, championId: ChampionId): Promise<PlayerChampionMastery> {
        const response = await this.req(`https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/by-champion/${championId}`);
        const data = await response.json();
        if (data.championId) {
            return {
                championId: data.championId,
                mastery: data.championPoints,
                lastPlayed: data.lastPlayTime,
            };
        } else {
            return {
                championId: championId,
                mastery: 0,
            }
        }
    }

    public static async getRankedStats(region: Region, summonerId: SummonerId): Promise<RankedStats> {
        const response = await this.req(`https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`);
        const data = await response.json();
        const rankedData = data.find((entry: any) => entry.queueType === 'RANKED_SOLO_5x5');
        if (rankedData) {
            return {
                wins: rankedData.wins,
                total: rankedData.wins + rankedData.losses,
            };
        } else {
            return {
                wins: 0,
                total: 0,
            };
        }
    }
}