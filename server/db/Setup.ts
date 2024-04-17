import sqlite3 from 'sqlite3';
import { open } from 'sqlite';


export default async function setup() {
    const db = await open({
        filename: './server/db/tiltseeker.db',
        driver: sqlite3.cached.Database,
    });

    await db.run(`
        CREATE TABLE IF NOT EXISTS matches (
            matchId STRING NOT NULL,
            patch STRING NOT NULL
        );
    `);
    await db.run(`
        CREATE UNIQUE INDEX IF NOT EXISTS matchIdIndex ON matches (matchId);
    `);

    await db.run(`
        CREATE TABLE IF NOT EXISTS champions (
            championId INTEGER NOT NULL,
            patch STRING NOT NULL,
            total INTEGER NOT NULL,
            wins INTEGER NOT NULL,
            timePlayed INTEGER NOT NULL,
            firstBloodParticipate INTEGER NOT NULL,
            visionScore INTEGER NOT NULL,
            magicDamageDealtToChampions INTEGER NOT NULL,
            physicalDamageDealtToChampions INTEGER NOT NULL,
            trueDamageDealtToChampions INTEGER NOT NULL,
            totalDamageDealtToChampions INTEGER NOT NULL,
            totalDamageTaken INTEGER NOT NULL,
            damageDealtToObjectives INTEGER NOT NULL,
            damageDealtToTurrets INTEGER NOT NULL,
            kills INTEGER NOT NULL,
            deaths INTEGER NOT NULL,
            assists INTEGER NOT NULL,
            wardsPlaced INTEGER NOT NULL,
            neutralMinionsKilled INTEGER NOT NULL,
            objectivesStolen INTEGER NOT NULL,
            goldEarned INTEGER NOT NULL
        );
    `);
    await db.run(`
        CREATE UNIQUE INDEX IF NOT EXISTS championIdPatchIndex ON champions (championId, patch);
    `);

    await db.run(`
        CREATE TABLE IF NOT EXISTS matchup (
            championIdA INTEGER NOT NULL,
            championIdB INTEGER NOT NULL,
            opponents BOOLEAN NOT NULL,
            patch STRING NOT NULL,
            wins INTEGER NOT NULL,
            total INTEGER NOT NULL
        );
    `);
    await db.run(`
        CREATE UNIQUE INDEX IF NOT EXISTS champPairLookupIndex ON matchup (championIdA, championIdB, opponents, patch);
    `);
}