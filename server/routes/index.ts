import express from "express";
import { Request, Response } from 'express';
import asyncHandler from "express-async-handler";
import DB from "../db/DB";
import { Region, SummonerName } from "../riot/Riot";
import Tiltseek from "../riot/Tiltseek";

export default () => {
    const app = express();

    if (process.env.NODE_ENV === 'development') {
        // Disable CORS in development
        app.use('*', (_, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            next();
        });
    }

    app.get('/', async (_: Request, res: Response) => {
        res.send('woot');
    });

    app.get('/matchups', asyncHandler(async (_: Request, res: Response) => {
        res.send(await DB.getMatchups(await DB.getNewestPatch()));
    }));

    app.get('/championStats', asyncHandler(async (_: Request, res: Response) => {
        res.send(await DB.getChampionStats(await DB.getNewestPatch()));
    }));

    app.get('/currentPatch', asyncHandler(async (_: Request, res: Response) => {
        res.send({ patch: await DB.getNewestPatch() });
    }));

    app.get('/tiltseek/:region/:summonerName', asyncHandler(async (req: Request, res: Response) => {
        res.send(await Tiltseek.tiltseek(
            req.params.region.toUpperCase() as Region,
            req.params.summonerName as SummonerName
        ));
    }));

    app.listen(3000, () => {
        console.log('Application started on port 3000!');
    });
}