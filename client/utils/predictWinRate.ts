import { useContext } from "react";
import { Matchups } from "../../server/db/DB";
import { ChampDataContext } from "../contexts/ChampData";
import { ChampionId } from "../../server/riot/Riot";

export type WinRateProbability = {
    winRate: number;
    total: number;
}

export default (champs: (ChampionId|null)[], compensateForChampionWinrate: boolean = false): WinRateProbability & { excludedCount: number, comparisonsMade: number } => {
    const { championStats, matchups } = useContext(ChampDataContext);

    const probabilities: WinRateProbability[] = [];
    let comparisonsMade = 0;
    let excludedCount = 0;

    const getWinRateData = (champA: keyof Matchups, champB: keyof Matchups, sameTeam: boolean): WinRateProbability|undefined => {
        const [champAId, champBId] = [champA, champB].sort((a, b) => a > b ? 1 : -1);
        const invert = champA === champBId && !sameTeam;
        const matchupData = matchups[champAId]?.[champBId]?.[sameTeam ? 'teammates' : 'opponents'];
        if (!matchupData) return;
        const winRate = matchupData.wins / matchupData.total;
        return {
            winRate: invert ? 1 - winRate : winRate,
            total: matchupData.total,
        };
    }

    for (let i = 0; i < champs.length; i++) {
        for (let j = i; j < champs.length; j++) {
            const [champA, champB] = [champs[i] as ChampionId, champs[j] as ChampionId];
            const sameTeam = i < 5 === j < 5;
            const invertProbability = i >= 5;
            if (!champA || !champB) continue;
            if (champA === champB && !sameTeam) continue;
            if (compensateForChampionWinrate && champA === champB) continue;
            comparisonsMade++;
            const winRateData = getWinRateData(champA, champB, sameTeam);
            if (winRateData && compensateForChampionWinrate) {
                const champAWinRate = championStats[champA]?.winRate ?? 0.5;
                const champBWinRate = championStats[champB]?.winRate ?? 0.5;
                const champADelta = 0.5 - champAWinRate;
                const champBDelta = champBWinRate - 0.5;
                winRateData.winRate += champADelta + champBDelta;
            }
            if (winRateData && winRateData.total >= 1_000) {
                probabilities.push({
                    winRate: invertProbability ? 1 - winRateData.winRate : winRateData.winRate,
                    total: winRateData.total,
                });
            } else {
                excludedCount++;
            }
        }
    }

    return {
        winRate: probabilities.reduce((acc, cur) => acc + cur.winRate, 0) / probabilities.length,
        total: probabilities.reduce((acc, cur) => acc + cur.total, 0),
        excludedCount,
        comparisonsMade,
    }
}