import { createLazyFileRoute } from "@tanstack/react-router"
import { useContext, useEffect, useState } from "react";
import BaseURL from "../../utils/BaseURL";
import { ChampionStats } from "../../../server/db/DB";
import Table from "../../components/Table";
import { useMediaQuery } from "react-responsive";
import { ChampDataContext, ChampionNames } from "../../contexts/ChampData";
import { ChampionId } from "../../../server/riot/Riot";


export const Route = createLazyFileRoute('/tools/bestbans')({
    component: BestBans,
})

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
    const { patch, championNames, championStats } = useContext(ChampDataContext);

    const isMobile = useMediaQuery({ maxWidth: 550 });

    const columns = [{
        text: '',
        key: 'name',
    },
    ...(isMobile ? [] : [{
        text: 'Champion',
        key: 'name',
    }]), {
        text: 'Influence',
        key: 'influence',
    }, {
        text: isMobile ? 'Win %' : 'Winrate',
        key: 'winRate',
    }, {
        text: isMobile ? 'Pick %' : 'Pick Rate',
        key: 'pickRate',
    }, {
        text: isMobile ? 'Ban %' : 'Banrate',
        key: 'banRate',
    }] as { text: string, key: keyof TableRow }[];

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
                {championStats && championNames && patch &&
                    <>
                        <div className="text-text grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 grow lg:w-3/4 2xl:w-1/2 lg:self-center mb-2">
                            {(Object.keys(championStats || {}) as ChampionId[]).sort((a, b) => championStats[b].influence - championStats[a].influence).slice(0, isMobile ? 6 : 12).map((champId, i) => (
                                <div key={champId} className="flex flex-col justify-center items-center mb-6">
                                    <img className="mb-2 max-w-44" src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championNames[champId].id}_0.jpg`}></img>
                                    <h2>#{i+1}: {championNames[champId].name}</h2>
                                    <p>Influence: {Number((championStats[champId].influence)?.toFixed(0))}</p>
                                    <p>Winrate: {Number((championStats[champId].winRate * 100)?.toFixed(2))}%</p>
                                    <p>Pickrate: {Number((championStats[champId].pickRate * 100)?.toFixed(2))}%</p>
                                    <p>Banrate: {Number((championStats[champId].banRate * 100)?.toFixed(2))}%</p>
                                </div>
                            ))}
                        </div>
                        <div className="lg:w-3/4 2xl:w-1/2 lg:self-center">
                            <Table
                                defaultSort={{ key: 'influence', desc: true }}
                                columns={columns}
                                data={(Object.keys(championStats || {}) as ChampionId[]).map(champId => ({
                                    key: champId,
                                    id: championNames[champId]?.id,
                                    name: championNames[champId]?.name,
                                    influence: Number((championStats[champId].influence)?.toFixed(0)),
                                    winRate: Number((championStats[champId].winRate * 100)?.toFixed(2)),
                                    pickRate: Number((championStats[champId].pickRate * 100)?.toFixed(2)),
                                    banRate: Number((championStats[champId].banRate * 100)?.toFixed(2)),
                                })) as TableRow[]}
                                renderRow={champ =>
                                    <tr key={champ.key}>
                                        <td className="sticky left-0">
                                            <img src={`https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${champ.id}.png`} alt={champ.name} className='w-8 h-8 mr-2'/>
                                        </td>
                                        {!isMobile && <td>{champ.name}</td>}
                                        <td>{champ.influence}</td>
                                        <td>{champ.winRate}%</td>
                                        <td>{champ.pickRate}%</td>
                                        <td>{champ.banRate}%</td>
                                    </tr>
                                }
                            />
                        </div>
                    </>
                }
            </div>
        </div>
    )
}