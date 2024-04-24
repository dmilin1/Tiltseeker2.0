import { createFileRoute, redirect } from "@tanstack/react-router"
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { TiltseekData } from "../../server/riot/Tiltseek";
import BaseURL from "../utils/BaseURL";
import { z } from 'zod'
import { Team } from "../../server/riot/Riot";
import { Fragment } from "react/jsx-runtime";
import { useContext } from "react";
import { ChampDataContext } from "../contexts/ChampData";
import predictWinRate from "../utils/predictWinRate";

export const Route = createFileRoute('/tiltseek')({
    validateSearch: (search) => (
        z.object({
            name: z.string(),
            region: z.string(),
        }).parse(search)
    ),
    loaderDeps: ({ search: { name, region } }) => ({ name, region }),
    loader: async ({ deps: { name, region} }): Promise<TiltseekData> => {
        const data = await fetch(`${BaseURL}/tiltseek/${region}/${name}`);
        const result = await data.json();
        if (result.error) {
            throw redirect({
                to: '/',
                search: {
                    error: result.error,
                }
            });
        }
        return result;
    },
    pendingComponent: Loading,
    component: Tiltseek,
});

function Loading() {
    const quotes = [
        `"Stats are good, winning is better" - Faker... probably`,
        `"We'll use Tiltseeker for week 2 at Worlds" - Every NA Team`,
        `"Please be our friend" - Amumu`,
        `"Camp someone who flames as much as Brand" - Bjergsen... probably`,
        `"Camp someone toxic. Like my sister, Cassiopeia" - Katarina`,
        `"Would you like a tent?" - Losing Midlaner`,
        `"Our midlaner has less vision than I do" - Lee Sin`,
        `"With Tiltseeker, you can transform into something better" - Kayn`,
        `"Camp someone who has no mana" - Tyler1... maybe`,
        `"Keep camping. See what happens." - Someone you should keep camping`,
        `"Tiltseeker seems fair and balanced." - CertainlyT`,
    ]

    return <div className="flex-col mx-6 grow items-center justify-stretch mt-[30vh] text-text">
        <p className="text-center text-white text-lg mb-8">{quotes[Math.floor(Math.random() * quotes.length)]}</p>
        <AiOutlineLoading3Quarters className="text-4xl animate-spin text-white" />
    </div>
}


function Tiltseek() {
    const { patch, championNames } = useContext(ChampDataContext);

    const teams = Route.useLoaderData();

    const champions = (new Array(10)).fill(null).map((_, i) =>
        /* doing this kinda weird to fix problems with game modes with unusual numbers of players */
        teams[Math.floor(i/5)]?.players[i%5]?.championId ?? null
    );
    const probability = predictWinRate(champions);

    return (
        <div className="px-6 grow items-center justify-center pb-16 text-text max-w-full">
            <div className="grow sm:grow-0 flex-col items-stretch justify-evenly max-w-full gap-4 mt-8 2xl:flex-row 2xl:items-stretch 2xl:mb-32">
                {teams.map((team, i) => (
                    <div key={team.team} className="flex-col items-stretch text-sm bg-tint p-4 rounded-xl">
                        <div className="mb-4 justify-center">
                            <div
                                className={"text-2xl " + (team.team === Team.BLUE ? 'text-blueTeam' : 'text-redTeam')}
                            >
                                {team.team} Team {probability.total ? ` - ${((i === 0 ? probability.winRate : 1 - probability.winRate) * 100).toFixed(1)}% WR` : ''}
                            </div>
                        </div>
                        <div className="mb-5 grow h-4 rounded-xl overflow-hidden">
                            <div
                                className="bg-blue-500 justify-center items-center"
                                style={{ width: 100 * team.damage.magic / team.damage.total + '%'}}
                            >
                                {(100 * team.damage.magic / team.damage.total).toFixed(0)}%
                            </div>
                            <div
                                className="bg-red-500 justify-center items-center"
                                style={{ width: 100 * team.damage.physical / team.damage.total + '%'}}
                            >
                                {(100 * team.damage.physical / team.damage.total).toFixed(0)}%
                            </div>
                            <div
                                className="bg-white text-black justify-center items-center"
                                style={{ width: 100 * team.damage.true / team.damage.total + '%'}}
                            >
                                {(100 * team.damage.true / team.damage.total).toFixed(0)}%
                            </div>
                        </div>
                        <div className="overflow-auto sm:max-w-full">
                            <div
                                className="[&>*:nth-child(even)]:bg-subtleTint grid-cols-[50px_100px_repeat(6,_minmax(50px,_1fr))] grid place-items-stretch text-center gap-x-2 min-w-[650px]"
                            >
                                <div className="sticky bg-tint left-0"></div>
                                <div className="items-center justify-center">Summoner</div>
                                <div className="items-center justify-center">Losing<br/>Streak</div>
                                <div className="items-center justify-center">Ranked<br/>Win Rate</div>
                                <div className="items-center justify-center">Mastery<br/>Points</div>
                                <div className="items-center justify-center">Last Played</div>
                                <div className="items-center justify-center">Aggression</div>
                                <div className="items-center justify-center">Warding</div>
                                {team.players.map(player => (
                                    <Fragment key={player.name}>
                                        <div className="sticky bg-tint left-0 flex-col items-center justify-center min-h-14 2xl:min-h-16">
                                            <img className="w-10 min-w-10 aspect-square" src={`https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${championNames[player.championId].id}.png`} alt={championNames[player.championId].name}/>
                                        </div>
                                        <div className="px-2 items-center justify-center text-center">
                                            <div className="text-xs break-all line-clamp-2">{player.name}</div>
                                        </div>
                                        <div className="items-center justify-center">{player.losingStreak}</div>
                                        <div className="px-2 items-center justify-center">
                                            <div>
                                                {
                                                    player.rankedStats.total
                                                    ? <>
                                                        {(100 * player.rankedStats.wins / player.rankedStats.total).toFixed(1) + '%'}
                                                        <br />
                                                        {player.rankedStats.wins + 'W/' + (player.rankedStats.total - player.rankedStats.wins) + 'L'}
                                                    </> : 'Not Ranked'
                                                }
                                            </div>
                                        </div>
                                        <div className="items-center justify-center">{player.championMastery.mastery.toLocaleString()}</div>
                                        <div className="items-center justify-center">{
                                            player.championMastery.lastPlayed
                                            ? <>
                                                {((Date.now() - player.championMastery.lastPlayed) / (1000 * 60 * 60 * 24)).toFixed(0) + ' days'}
                                                <br/>
                                                {'ago'}
                                            </> : 'Never'
                                        }</div>
                                        <div className="items-center justify-center">{(player.performance.aggression * 100).toFixed(0)}%</div>
                                        <div className="items-center justify-center">{(player.performance.vision * 100).toFixed(0)}%</div>
                                    </Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}