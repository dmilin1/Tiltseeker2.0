import sqlite3 from 'sqlite3';

import './Setup';
import setup from './Setup';
import { Database, open } from 'sqlite';
import { Match } from '../riot/Riot';
import { patchToNum } from '../utils/Calculations';
import Cache from '../utils/Cache';

type Matchups = {
    [championIdA: number]: {
        [championIdB: number]: {
            teammates: {
                wins: number;
                total: number;
            },
            opponents: {
                wins: number;
                total: number;
            }
        }
    }
}

export type ChampionStats = {
    [championId: number|string]: {
        championId: number;
        patch: string;
        total: number;
        wins: number;
        timePlayed: number;
        firstBloodParticipate: number;
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

        winRate: number;
        pickRate: number;
        banRate: number;
        influence: number;
    }
}

export default class DB {
    private static db: Database<sqlite3.Database, sqlite3.Statement>;

    public static async init(): Promise<DB> {
        if (!DB.db) {
            DB.db = await open({
                filename: './server/db/tiltseeker.db',
                driver: sqlite3.cached.Database,
            });
            await setup();
        }
        return this;
    }

    public static async addMatch(match: Match): Promise<boolean> {
        const promises = [];
        
        try {
            await DB.db.run(`
                INSERT INTO matches (matchId, patch)
                VALUES (?, ?)
            `, [match.id, match.patch]);
        } catch (e: any) {
            if (e.code === 'SQLITE_CONSTRAINT') {
                return false;
            }
            throw e;
        }

        for (const ban of match.bans) {
            promises.push(
                await DB.db.run(`
                    INSERT INTO champions (
                        championId, patch, total, wins, bans, timePlayed, firstBloodParticipate, visionScore,
                        magicDamageDealtToChampions, physicalDamageDealtToChampions, trueDamageDealtToChampions,
                        totalDamageDealtToChampions, totalDamageTaken, damageDealtToObjectives, damageDealtToTurrets,
                        kills, deaths, assists, wardsPlaced, neutralMinionsKilled, objectivesStolen, goldEarned
                    ) VALUES (
                        :championId, :patch, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                    )
                    ON CONFLICT (championId, patch) DO UPDATE SET
                        bans=bans+1
                    WHERE championId = :championId AND patch = :patch
                `, {
                    ':championId': ban,
                    ':patch': match.patch,
                })
            );
        }

        for (const participant of match.participants) {
            promises.push(
                await DB.db.run(`
                    INSERT INTO champions (
                        championId, patch, total, wins, bans, timePlayed, firstBloodParticipate, visionScore,
                        magicDamageDealtToChampions, physicalDamageDealtToChampions, trueDamageDealtToChampions,
                        totalDamageDealtToChampions, totalDamageTaken, damageDealtToObjectives, damageDealtToTurrets,
                        kills, deaths, assists, wardsPlaced, neutralMinionsKilled, objectivesStolen, goldEarned
                    ) VALUES (
                        :championId, :patch, :total, :wins, 0, :timePlayed, :firstBloodParticipate, :visionScore,
                        :magicDamageDealtToChampions, :physicalDamageDealtToChampions, :trueDamageDealtToChampions,
                        :totalDamageDealtToChampions, :totalDamageTaken, :damageDealtToObjectives, :damageDealtToTurrets,
                        :kills, :deaths, :assists, :wardsPlaced, :neutralMinionsKilled, :objectivesStolen, :goldEarned
                    )
                    ON CONFLICT (championId, patch) DO UPDATE SET
                        total=total+1, wins=wins+:wins, timePlayed=timePlayed+:timePlayed,
                        firstBloodParticipate=firstBloodParticipate+:firstBloodParticipate,
                        visionScore=visionScore+:visionScore,
                        magicDamageDealtToChampions=magicDamageDealtToChampions+:magicDamageDealtToChampions,
                        physicalDamageDealtToChampions=physicalDamageDealtToChampions+:physicalDamageDealtToChampions,
                        trueDamageDealtToChampions=trueDamageDealtToChampions+:trueDamageDealtToChampions,
                        totalDamageDealtToChampions=totalDamageDealtToChampions+:totalDamageDealtToChampions,
                        totalDamageTaken=totalDamageTaken+:totalDamageTaken,
                        damageDealtToObjectives=damageDealtToObjectives+:damageDealtToObjectives,
                        damageDealtToTurrets=damageDealtToTurrets+:damageDealtToTurrets,
                        kills=kills+:kills, deaths=deaths+:deaths, assists=assists+:assists,
                        wardsPlaced=wardsPlaced+:wardsPlaced,
                        neutralMinionsKilled=neutralMinionsKilled+:neutralMinionsKilled,
                        objectivesStolen=objectivesStolen+:objectivesStolen,
                        goldEarned=goldEarned+:goldEarned
                    WHERE championId = :championId AND patch = :patch
                `, {
                    ':championId': participant.championId,
                    ':patch': match.patch,
                    ':total': 1,
                    ':wins': participant.win ? 1 : 0,
                    ':timePlayed': match.duration,
                    ':firstBloodParticipate': participant.firstBloodParticipate ? 1 : 0,
                    ':visionScore': participant.visionScore,
                    ':magicDamageDealtToChampions': participant.magicDamageDealtToChampions,
                    ':physicalDamageDealtToChampions': participant.physicalDamageDealtToChampions,
                    ':trueDamageDealtToChampions': participant.trueDamageDealtToChampions,
                    ':totalDamageDealtToChampions': participant.totalDamageDealtToChampions,
                    ':totalDamageTaken': participant.totalDamageTaken,
                    ':damageDealtToObjectives': participant.damageDealtToObjectives,
                    ':damageDealtToTurrets': participant.damageDealtToTurrets,
                    ':kills': participant.kills,
                    ':deaths': participant.deaths,
                    ':assists': participant.assists,
                    ':wardsPlaced': participant.wardsPlaced,
                    ':neutralMinionsKilled': participant.neutralMinionsKilled,
                    ':objectivesStolen': participant.objectivesStolen,
                    ':goldEarned': participant.goldEarned,
                })
            );
        }

        for (const participantA of match.participants) {
            for (const participantB of match.participants) {
                if (participantA.championId > participantB.championId) {
                    continue;
                }
                const opponents = participantA.teamId !== participantB.teamId;
                promises.push(
                    await DB.db.run(`
                        INSERT INTO matchup (
                            championIdA, championIdB, opponents, patch, wins, total
                        ) VALUES (
                            :championIdA, :championIdB, :opponents, :patch, :wins, :total
                        )
                        ON CONFLICT (championIdA, championIdB, opponents, patch) DO UPDATE SET
                            wins=wins+:wins, total=total+1
                        WHERE championIdA = :championIdA AND championIdB = :championIdB AND opponents = :opponents AND patch = :patch
                    `, {
                        ':championIdA': participantA.championId,
                        ':championIdB': participantB.championId,
                        ':opponents': opponents,
                        ':patch': match.patch,
                        ':wins': participantA.win ? 1 : 0,
                        ':total': 1,
                    })
                );
            }
        }

        await Promise.all(promises);
        return true;
    }

    public static async getNewestPatch(): Promise<string> {
        await DB.init();
        return Cache.get('newest-patch', 1000 * 60 * 15, async () => {
            const patches = await DB.db.all('SELECT DISTINCT(patch) AS patch FROM champions');
            patches.sort((a, b) => patchToNum(String(b.patch)) - patchToNum(String(a.patch)) > 0 ? 1 : -1);
            return patches[0].patch;
        });
    }

    public static async getMatchups(patch: string): Promise<Matchups> {
        await DB.init();
        return Cache.get(`matchups-${patch}`, 1000 * 60 * 15, async () => {
            const rows = await DB.db.all(`
                SELECT * FROM matchup
                WHERE patch = ?
            `, [patch]);
            const result: Matchups = {};
            for (const matchup of rows) {
                if (!result[matchup.championIdA]) {
                    result[matchup.championIdA] = {};
                }
                result[matchup.championIdA][matchup.championIdB] = {
                    teammates: {
                        wins: matchup.opponents ? 0 : matchup.wins,
                        total: matchup.total,
                    },
                    opponents: {
                        wins: matchup.opponents ? matchup.wins : 0,
                        total: matchup.total,
                    }
                };
            }
            return result;
        });
    }

    public static async getChampionStats(patch: string): Promise<ChampionStats> {
        await DB.init();
        return Cache.get(`champion-stats-${patch}`, 1000 * 60 * 15, async () => {
            const matchCount = (await DB.db.get(`
                SELECT COUNT(*) AS count FROM matches
                WHERE patch = ?
            `, [patch])).count;
            const rows = await DB.db.all(`
                SELECT * FROM champions
                WHERE patch = ?
            `, [patch]);
            const result: ChampionStats = {}
            for (const row of rows) {
                const winRate = row.wins / row.total;
                const pickRate = row.total / matchCount;
                const banRate = row.bans / matchCount;
                result[row.championId] = {
                    ...row,
                    winRate,
                    pickRate,
                    banRate,
                    influence: 10000 * (winRate - 0.5) * pickRate / (1 - banRate),
                };
            }
            return result;
        });
    }
}