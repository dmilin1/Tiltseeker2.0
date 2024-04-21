import { createLazyFileRoute } from "@tanstack/react-router"
import { useContext, useEffect, useRef, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { ChampDataContext } from "../../contexts/ChampData";
import { ChampionStats, Matchups } from "../../../server/db/DB";
import { BiQuestionMark } from "react-icons/bi";
import { FaCheck } from "react-icons/fa";
import { FaX, FaXmark } from "react-icons/fa6";


export const Route = createLazyFileRoute('/tools/compositionanalyzer')({
    component: CompositionAnalyzer,
})

type ChampInputProps = {
    index: number;
    onChampChange: (champId: null | keyof ChampionStats, index: number) => void;
}

type WinRateProbability = {
    winRate: number;
    total: number;
}

function ChampInput({ index, onChampChange }: ChampInputProps) {
    const { patch, championNames, championStats } = useContext(ChampDataContext);

    const isMobile = useMediaQuery({ maxWidth: 640 });

    const [champText, setChampText] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);

    const selectedChamp = Object.entries(championNames).find(([_, data]) => data.name.toLowerCase() === champText.toLowerCase())?.[1];

    const optionsList = Object.entries(championNames)
        .filter(([_, champ]) => champ.name.toLowerCase().includes(champText.toLowerCase()))
        .sort((a, b) => a[1].name.localeCompare(b[1].name));

    const setChamp = (text: string) => {
        setChampText(text);
        const champId = Object.entries(championNames).find(([_, data]) => data.name.toLowerCase() === text.toLowerCase())?.[0];
        onChampChange(champId ?? null, index);
    }

    useEffect(() => {
        const keylistenerCallback = (e: KeyboardEvent) => {
            if (isFocused && e.key === 'ArrowDown') {
                setHoveredIndex((prev) => Math.min(prev + 1, Object.entries(championNames).length - 1));
            } else if (isFocused && e.key === 'ArrowUp') {
                setHoveredIndex((prev) => Math.max(prev - 1, 0));
            } else if (isFocused && e.key === 'Enter') {
                const champ = optionsList[hoveredIndex][1];
                if (champ) {
                    setChamp(champ.name);
                    inputRef.current?.blur();
                }
            }
        }
        window.addEventListener('keydown', keylistenerCallback);
        return () => window.removeEventListener('keydown', keylistenerCallback);
    }, [champText, hoveredIndex, isFocused]);

    return (
        <div className={"flex p-2 bg-tint rounded-t-lg" + (isFocused ? '' : ' rounded-b-lg')}>
            <div className="rounded overflow-hidden w-6 mr-2">
                {selectedChamp ? (
                    <img src={`https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${selectedChamp.id}.png`} alt={selectedChamp.name} />
                ) : (
                    <div className="bg-bg w-6 h-6 justify-center items-center">
                        <BiQuestionMark className="text-text w-5 h-5" />
                    </div>
                )}
            </div>
            <input
                ref={inputRef}
                className="bg-tint outline-none text-text w-28 sm:w-48"
                type="text"
                placeholder={`Player ${index + 1}`}
                value={champText}
                onChange={(e) => setChamp(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                    setIsFocused(false);
                    setHoveredIndex(0);
                }}
            />
            {isFocused && championStats && (
                <div className="absolute">
                    <div className="relative bg-tint rounded-b-lg shadow-lg flex-col top-8 left-[-8px] max-h-64 overflow-auto w-[160px] sm:w-[240px]">
                        {optionsList.map(([champId, champ], i) => (
                            <div
                                key={champ.id}
                                className={"p-2 hover:bg-bg cursor-pointer text-white" + (!isMobile && hoveredIndex === i ? ' bg-bg' : '')}
                                onMouseDown={(e) => {
                                    onChampChange(champId, index);
                                    setChampText(champ.name);
                                }}
                            >
                                <img
                                    src={`https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${champ.id}.png`}
                                    alt={champ.name}
                                    className="w-6 h-6 rounded-lg mr-2"
                                />
                                <span>{champ.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function CompositionAnalyzer() {
    const { championNames, championStats, matchups } = useContext(ChampDataContext);

    const [champs, setChamps] = useState<(keyof ChampionStats|null)[]>(new Array(10).fill(null));
    const [compensateForChampionWinrate, setCompensateForChampionWinrate] = useState(false);

    const calculateProbability: () => WinRateProbability & { excludedCount: number, comparisonsMade: number } = () => {
        let probabilities: WinRateProbability[] = [];
        let comparisonsMade = 0;
        let excludedCount = 0;

        const getWinRateData = (champA: keyof Matchups, champB: keyof Matchups, sameTeam: boolean): WinRateProbability|undefined => {
            const [champAId, champBId] = [champA, champB].sort((a, b) => a > b ? 1 : -1);
            const invert = champA === champBId && !sameTeam;
            const matchupData = matchups[champAId]?.[champBId]?.[sameTeam ? 'teammates' : 'opponents'];
            if (!matchupData) return;
            let winRate = matchupData.wins / matchupData.total;
            return {
                winRate: invert ? 1 - winRate : winRate,
                total: matchupData.total,
            };
        }

        for (let i = 0; i < champs.length; i++) {
            for (let j = i; j < champs.length; j++) {
                const [champA, champB] = [champs[i] as keyof Matchups, champs[j] as keyof Matchups];
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

    const probability = calculateProbability();

    return (
        <div className="p-2 grow items-stretch pb-16">
            <div className='flex-col items-stretch grow h-fit'>
                <div className="flex-col text-text px-6 py-4 rounded-lg bg-tint grow lg:w-3/4 2xl:w-1/2 lg:self-center my-8">
                    <div></div>
                    <h1 className='text-2xl text-center'>Composition Analyzer</h1>
                    <p className='text-lg mt-4'>
                        This tool uses machine learning to predict the outcomes of a game based on the champions selected by each team. The predictions are based on the win rates of each champion and the interactions between them. The predictions are not perfect, but they can give you an idea of which team has the advantage based on the champions selected.
                    </p>
                    <p className='text-lg mt-4'>
                        The compensate for champion winrate setting is useful for accounting for the fact that some champions are stronger than others. When this setting is enabled, the tool will adjust the predictions based on the win rates of the champions selected. In mathematical terms, this setting normalizes matchup winrates to account for champion base winrates.
                    </p>
                </div>
                <div className="text-text grow justify-center">
                    <div
                        className="p-2 cursor-pointer items-center"
                        onClick={() => setCompensateForChampionWinrate((prev) => !prev)}
                    >
                        <div className="mr-4">
                            Compensate for champion winrate:
                        </div>
                        <div className="bg-tint rounded w-8 h-8 justify-center items-center">
                            {compensateForChampionWinrate ? (
                                <FaCheck className="text-xl" />
                            ) : (
                                <FaXmark className="text-xl text-bg"/>
                            )}
                        </div>
                    </div>
                </div>
                {championStats && championNames &&
                    <div className="justify-evenly grow lg:w-3/4 2xl:w-1/2 lg:self-center my-8">
                        {['Team 1', 'Team 2'].map((team) => (
                            <div key={team} className="flex-col">
                                <div className="text-text justify-center mb-4">
                                    <h2 className="text-xl">
                                        {team}{probability.total ? `: ${((team === "Team 1" ? probability.winRate : 1 - probability.winRate) * 100).toFixed(1)}%` : ''}
                                    </h2>
                                </div>
                                <div className="flex-col gap-4">
                                    {[...new Array(5)].map((_, i) => (
                                        <ChampInput
                                            key={i}
                                            index={i + (team === 'Team 2' ? 5 : 0)}
                                            onChampChange={(champId, index) => {
                                                const newChamps = [...champs];
                                                newChamps[index] = champId;
                                                setChamps(newChamps);
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                }
                <div className="justify-center grow lg:w-3/4 2xl:w-1/2 lg:self-center my-8">
                    <p className="text-text mt-4 mx-4">
                        Team 1 is expected to win {(probability.winRate * 100).toFixed(1)}% of the time. This prediction was made using {probability.total.toLocaleString()} data points. {probability.comparisonsMade.toLocaleString()} champion interactions were used.{probability.excludedCount ? ` However, there was no data, or not enough data for ${probability.excludedCount} of these interactions.` : ''}
                    </p>
                </div>
            </div>
        </div>
    )
}