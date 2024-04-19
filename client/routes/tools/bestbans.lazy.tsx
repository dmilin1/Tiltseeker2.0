import { createLazyFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react";
import BaseURL from "../../utils/BaseURL";
import { ChampionStats } from "../../../server/db/DB";


export const Route = createLazyFileRoute('/tools/bestbans')({
    component: BestBans,
})

type ChampionNames = {
    [championId: string]: {
        name: string;
        id: string;
    }
}

function BestBans() {
    const [currentPatch, setCurrentPatch] = useState<string>();
    const [championStats, setChampionStats] = useState<ChampionStats>();
    const [championNames, setChampionNames] = useState<ChampionNames>();

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
        console.log(data)
        const championInfo = Object.values(data).reduce((acc: ChampionNames, champ: any) => {
            acc[champ.key] = { name: champ.name, id: champ.id};
            return acc;
        }, {});
        setCurrentPatch(latestPatch);
        setChampionNames(championInfo);
    }

    useEffect(() => {
        loadChampionStats();
        loadChampionNames();
    }, []);

    return (
        <div className="p-2 flex-1">
            <div className='flex-col items-center'>
                <h1 className='text-2xl'>Best Bans</h1>
                <p className='text-sm'>Based on winrate, pickrate, and banrate</p>
                {championStats && championNames && Object.keys(championStats).map(champId => 
                    <div key={champId} className='flex items-center justify-between p-2 border-b'>
                        <div className='flex items-center'>
                            <img src={`https://ddragon.leagueoflegends.com/cdn/${currentPatch}/img/champion/${championNames[champId]?.id}.png`} alt={championNames[champId]?.name} className='w-8 h-8 mr-2'/>
                            <span>{championNames[champId]?.name}</span>
                        </div>
                        <div className='flex items-center'>
                            <span>Winrate: {(championStats[champId].winRate * 100)?.toFixed(2)}%</span>
                            <span className='ml-2'>Pickrate: {(championStats[champId].pickRate * 100)?.toFixed(2)}%</span>
                            <span className='ml-2'>Banrate: {(championStats[champId].banRate * 100)?.toFixed(2)}%</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}