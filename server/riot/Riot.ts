import { getRandomSample } from "../dataCollector/DataCollector";

export type RoutingValue = 'AMERICAS' | 'ASIA' | 'EUROPE' | 'SEA';
export type Region = 'NA1' | 'BR1' | 'EUN1' | 'EUW1' | 'JP1' | 'KR' | 'LA1' | 'LA2' | 'OC1' | 'TR1' | 'RU';

/* Makes a generic into a distinct type */
type Distinct<T, DistinctName> = T & { __TYPE__: DistinctName };

export type PUUID = Distinct<string, 'PUUID'>;
export type SummonerId = Distinct<string, 'SummonerId'>;
export type MatchId = Distinct<string, 'MatchId'>;

export type Match = {
    id: MatchId;
    patch: string;
    duration: number;
    participants: {
        win: boolean;
        puuid: PUUID;
        championId: number;
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
            duration: data.info.gameDuration,
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
}