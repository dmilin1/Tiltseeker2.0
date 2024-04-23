import { createContext, useEffect, useState } from 'react';
import { ChampionStats, Matchups } from "../../server/db/DB";
import BaseURL from '../utils/BaseURL';
import { ChampionId } from '../../server/riot/Riot';

export type ChampionNames = {
    [championId: ChampionId]: {
        name: string;
        id: string;
    }
}

type ChampDataProviderProps = {
    patch?: string;
    championStats: ChampionStats;
    championNames: ChampionNames;
    matchups: Matchups;
}

const initialChampData: ChampDataProviderProps = {
    championStats: {},
    championNames: {},
    matchups: {},
}

export const ChampDataContext = createContext(initialChampData);

export const ChampDataProvider = ({ children }: { children: React.ReactNode }) => {
    const [patch, setPatch] = useState(initialChampData.patch);
    const [championStats, setChampionStats] = useState(initialChampData.championStats);
    const [championNames, setChampionNames] = useState(initialChampData.championNames);
    const [matchups, setMatchups] = useState(initialChampData.matchups);

    const loadChampionStats = async () => {
        const res = await fetch(`${BaseURL}/championStats`);
        const data = await res.json();
        setChampionStats(data);
    }

    const loadChampionNames = async () => {
        const res = await fetch(`https://ddragon.leagueoflegends.com/api/versions.json`);
        const latestPatch = (await res.json())[0];
        const res2 = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestPatch}/data/en_US/champion.json`);
        const data = (await res2.json()).data;
        const championInfo = Object.values(data).reduce((acc: ChampionNames, champ: any) => {
            acc[champ.key] = { name: champ.name, id: champ.id};
            return acc;
        }, {});
        setPatch(latestPatch);
        setChampionNames(championInfo);
    }

    const loadMatchups = async () => {
        const res = await fetch(`${BaseURL}/matchups`);
        const data = await res.json();
        setMatchups(data);
    }

    useEffect(() => {
        loadChampionStats();
        loadMatchups();
        loadChampionNames();
    }, []);

    return (
        <ChampDataContext.Provider value={{
            patch,
            championStats,
            championNames,
            matchups,
        }}>
            {children}
        </ChampDataContext.Provider>
    );
};