import { createLazyFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react";
import BaseURL from "../../utils/BaseURL";
import ChampionStats from "../../../server/db/DB";


export const Route = createLazyFileRoute('/tools/bestbans')({
    component: BestBans,
})

function BestBans() {
    const [championStats, setChampionStats] = useState<ChampionStats>();

    const loadChampionStats = async () => {
        const res = await fetch(`${BaseURL}/championStats`);
        const data = await res.json();
        setChampionStats(data);
    }

    useEffect(() => {
        loadChampionStats();
    }, []);

    return (
        <div className="p-2 flex-1">
        <div className='flex-col items-center mt-[15%]'>
            <div className='mt-8 bg-tint border-tint border-8 rounded-lg'>
            <div className='rounded overflow-hidden '>
                <select className='bg-bg text-buttonText text-lg items-center text-center outline-none'>
                {['NA', 'EUW', 'EUNE', 'KR', 'BR', 'LAN', 'LAS', 'OCE', 'TR', 'RU', 'JP'].map(region => (
                    <option key={region} value={region}>
                    {region}
                    </option>
                ))}
                </select>
            </div>
            <input
                className='bg-tint text-buttonText text-lg py-2 items-center text-center outline-none'
                placeholder='Summoner Name'
            />
            </div>
        </div>
        </div>
    )
}