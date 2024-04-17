import sqlite3 from 'sqlite3';

import './Setup';
import setup from './Setup';
import { Database, open } from 'sqlite';
import { Match } from '../riot/Riot';

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

        for (const participant of match.participants) {
            promises.push(
                await DB.db.run(`
                    INSERT INTO champions (
                        championId, patch, total, wins, timePlayed, firstBloodParticipate, visionScore,
                        magicDamageDealtToChampions, physicalDamageDealtToChampions, trueDamageDealtToChampions,
                        totalDamageDealtToChampions, totalDamageTaken, damageDealtToObjectives, damageDealtToTurrets,
                        kills, deaths, assists, wardsPlaced, neutralMinionsKilled, objectivesStolen, goldEarned
                    ) VALUES (
                        :championId, :patch, :total, :wins, :timePlayed, :firstBloodParticipate, :visionScore,
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

        for (const a of match.participants) {
            for (const b of match.participants) {
                if (a === b) {
                    continue;
                }
                const [participantA, participantB] = a.championId < b.championId ? [a, b] : [b, a];
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
}