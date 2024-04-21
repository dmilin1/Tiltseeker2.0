import { createLazyFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react";
import BaseURL from "../../utils/BaseURL";
import { ChampionStats } from "../../../server/db/DB";
import Table from "../../components/Table";
import { useMediaQuery } from "react-responsive";


export const Route = createLazyFileRoute('/tools/compositionanalyzer')({
    component: BestBans,
})

type ChampionNames = {
    [championId: string]: {
        name: string;
        id: string;
    }
}

type TableRow = {
    key: string;
    id: string;
    name: string;
    influence: number;
    winRate: number;
    pickRate: number;
    banRate: number;
};

function BestBans() {
    const [currentPatch, setCurrentPatch] = useState<string>();
    const [championStats, setChampionStats] = useState<ChampionStats>();
    const [championNames, setChampionNames] = useState<ChampionNames>();

    const isMobile = useMediaQuery({ maxWidth: 550 });


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
        setCurrentPatch(latestPatch);
        setChampionNames(championInfo);
    }

    useEffect(() => {
        loadChampionStats();
        loadChampionNames();
    }, []);

    return (
        <div className="p-2 grow items-stretch">
            <div className='flex-col items-stretch grow h-fit'>
                <div className="flex-col text-text px-6 py-4 rounded-lg bg-tint grow lg:w-3/4 2xl:w-1/2 lg:self-center my-8">
                    <div></div>
                    <h1 className='text-2xl text-center mb-4'>Best Bans</h1>
                    <p className='text-lg'>
                        Players often ban emotionally based on frusturation, perceived power, and popular opinion. But these ban choices are rarely ideal for winning. This list contains the ideal bans assuming nothing is known about what champions will be chosen. It's important to note that there are a few scenarios where these are not the best bans. For example, banning out a teammate's champion and causing tilt or banning a high influence champion if you know your team will counter pick them.
                    </p>
                    <br/>
                    <p className='text-lg'>
                        Ideal ban strategy is to ban champions with a high winrate who also have a high playrate. In this list, "Influence" represents the average losses per 10,000 games that you can expect due to that champion being on the other team. By banning that champion, you are in effect negating those losses.
                    </p>
                </div>
                {championStats && championNames &&
                    <div className="text-text grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 grow lg:w-3/4 2xl:w-1/2 lg:self-center mb-2">
                        
                    </div>
                }
            </div>
        </div>
    )
}