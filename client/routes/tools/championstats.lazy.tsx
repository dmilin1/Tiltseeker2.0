import { createLazyFileRoute } from "@tanstack/react-router"
import { useContext } from "react";
import Table from "../../components/Table";
import { useMediaQuery } from "react-responsive";
import { ChampDataContext } from "../../contexts/ChampData";
import { ChampionId } from "../../../server/riot/Riot";


export const Route = createLazyFileRoute('/tools/championstats')({
    component: ChampStats,
})

type TableRow = {
    key: string;
    id: string;
    name: string;
    influence: number;
    winRate: number;
    pickRate: number;
    banRate: number;
    avgKills: number;
    avgDeaths: number;
    avgAssists: number;
    avgGoldEarned: number;
    avgWardsPlaced: number;
    avgVisionScore: number;
    avgDmgToChamps: number;
    avgPhysicalDmgToChamps: number;
    avgMagicDmgToChamps: number;
    avgTrueDmgToChamps: number;
    avgDmgTaken: number;
    avgDmgToObj: number;
    avgDmgToTurrets: number;
    avgFirstBloodParticipate: number;
    avgNeutralMinionsKilled: number;
    avgObjectivesStolen: number;
    avgGameTime: string;
};

function ChampStats() {
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
    }, {
        text: 'Avg Kills',
        key: 'avgKills',
    }, {
        text: 'Avg Deaths',
        key: 'avgDeaths',
    }, {
        text: 'Avg Assists',
        key: 'avgAssists',
    }, {
        text: 'Avg Gold Earned',
        key: 'avgGoldEarned',
    }, {
        text: 'Avg Wards Placed',
        key: 'avgWardsPlaced',
    }, {
        text: 'Avg Vision Score',
        key: 'avgVisionScore',
    }, {
        text: 'Avg Dmg to Champs',
        key: 'avgDmgToChamps',
    }, {
        text: 'Avg Physical Dmg to Champs',
        key: 'avgPhysicalDmgToChamps',
    }, {
        text: 'Avg Magic Dmg to Champs',
        key: 'avgMagicDmgToChamps',
    }, {
        text: 'Avg True Dmg to Champs',
        key: 'avgTrueDmgToChamps',
    }, {
        text: 'Avg Dmg Taken',
        key: 'avgDmgTaken',
    }, {
        text: 'Avg Dmg to Obj',
        key: 'avgDmgToObj',
    }, {
        text: 'Avg Dmg to Turrets',
        key: 'avgDmgToTurrets',
    }, {
        text: 'First Blood Participation %',
        key: 'avgFirstBloodParticipate',
    }, {
        text: 'Avg Neutral Minions Killed',
        key: 'avgNeutralMinionsKilled',
    }, {
        text: 'Avg Objectives Stolen',
        key: 'avgObjectivesStolen',
    }, {
        text: 'Avg Game Time',
        key: 'avgGameTime',
    }] as { text: string, key: keyof TableRow }[];

    return (
        <div className="overflow-auto flex-col items-stretch self-stretch grow">
            <div className='flex-col items-stretch'>
                {championStats && championNames &&
                    <div className="">
                        <Table
                            defaultSort={{ key: 'influence', desc: true }}
                            columns={columns}
                            data={(Object.keys(championStats || {}) as ChampionId[]).map(champId => {
                                const champData = championStats[champId];
                                const gameTime = champData.timePlayed / champData.total;
                                return {
                                    key: champId,
                                    id: championNames[champId].id,
                                    name: championNames[champId].name,
                                    influence: Number(champData.influence.toFixed(0)),
                                    winRate: Number((champData.winRate * 100).toFixed(2)),
                                    pickRate: Number((champData.pickRate * 100).toFixed(2)),
                                    banRate: Number((champData.banRate * 100).toFixed(2)),
                                    avgKills: Number((champData.kills / champData.total)?.toFixed(2)),
                                    avgDeaths: Number((champData.deaths / champData.total)?.toFixed(2)),
                                    avgAssists: Number((champData.assists / champData.total)?.toFixed(2)),
                                    avgGoldEarned: Number((champData.goldEarned / champData.total)?.toFixed(0)),
                                    avgWardsPlaced: Number((champData.wardsPlaced / champData.total)?.toFixed(1)),
                                    avgVisionScore: Number((champData.visionScore / champData.total)?.toFixed(1)),
                                    avgDmgToChamps: Number((champData.totalDamageDealtToChampions / champData.total)?.toFixed(0)),
                                    avgPhysicalDmgToChamps: Number((champData.physicalDamageDealtToChampions / champData.total)?.toFixed(0)),
                                    avgMagicDmgToChamps: Number((champData.magicDamageDealtToChampions / champData.total)?.toFixed(0)),
                                    avgTrueDmgToChamps: Number((champData.trueDamageDealtToChampions / champData.total)?.toFixed(0)),
                                    avgDmgTaken: Number((champData.totalDamageTaken / champData.total)?.toFixed(0)),
                                    avgDmgToObj: Number((champData.damageDealtToObjectives / champData.total)?.toFixed(0)),
                                    avgDmgToTurrets: Number((champData.damageDealtToTurrets / champData.total)?.toFixed(0)),
                                    avgFirstBloodParticipate: Number((champData.firstBloodParticipate / champData.total * 100)?.toFixed(2)),
                                    avgNeutralMinionsKilled: Number((champData.neutralMinionsKilled / champData.total)?.toFixed(1)),
                                    avgObjectivesStolen: Number((champData.objectivesStolen / champData.total)?.toFixed(5)),
                                    avgGameTime: Math.floor(gameTime / 60) + ':' + (gameTime % 60).toFixed(0).padStart(2, '0'),
                                }
                            }) as TableRow[]}
                            renderRow={champ =>
                                <tr key={champ.key}>
                                    <td className="sticky left-0 pr-4 min-w-12 bg-tint">
                                        <img src={`https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${champ.id}.png`} alt={champ.name}/>
                                    </td>
                                    {!isMobile && <td>{champ.name}</td>}
                                    <td>{champ.influence}</td>
                                    <td>{champ.winRate}%</td>
                                    <td>{champ.pickRate}%</td>
                                    <td>{champ.banRate}%</td>
                                    <td>{champ.avgKills}</td>
                                    <td>{champ.avgDeaths}</td>
                                    <td>{champ.avgAssists}</td>
                                    <td>{champ.avgGoldEarned}</td>
                                    <td>{champ.avgWardsPlaced}</td>
                                    <td>{champ.avgVisionScore}</td>
                                    <td>{champ.avgDmgToChamps}</td>
                                    <td>{champ.avgPhysicalDmgToChamps}</td>
                                    <td>{champ.avgMagicDmgToChamps}</td>
                                    <td>{champ.avgTrueDmgToChamps}</td>
                                    <td>{champ.avgDmgTaken}</td>
                                    <td>{champ.avgDmgToObj}</td>
                                    <td>{champ.avgDmgToTurrets}</td>
                                    <td>{champ.avgFirstBloodParticipate}</td>
                                    <td>{champ.avgNeutralMinionsKilled}</td>
                                    <td>{champ.avgObjectivesStolen}</td>
                                    <td>{champ.avgGameTime}</td>
                                </tr>
                            }
                        />
                    </div>
                }
            </div>
        </div>
    )
}