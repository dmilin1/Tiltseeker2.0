import express from "express";
import { Request, Response } from 'express';
import asyncHandler from "express-async-handler";
import DB from "../db/DB.js";
import { Region, SummonerName, RegionToRouting } from "../riot/Riot.js";
import Tiltseek from "../riot/Tiltseek.js";

export default () => {
    const app = express();

    if (process.env.NODE_ENV === 'development') {
        // Disable CORS in development
        app.use('*', (_, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            next();
        });
    }

    app.get('/api/matchups', asyncHandler(async (_: Request, res: Response) => {
        res.send(await DB.getMatchups(await DB.getNewestPatch()));
    }));

    app.get('/api/championStats', asyncHandler(async (_: Request, res: Response) => {
        res.send(await DB.getChampionStats(await DB.getNewestPatch()));
    }));

    app.get('/api/currentPatch', asyncHandler(async (_: Request, res: Response) => {
        res.send({ patch: await DB.getNewestPatch() });
    }));

    app.get('/api/tiltseek/:region/:summonerName', asyncHandler(async (req: Request, res: Response) => {
        if (!(req.params.region.toUpperCase() in RegionToRouting)) {
            res.send({ error: 'Invalid region' });
            return;
        }
        try {
            res.send(await Tiltseek.tiltseek(
                req.params.region.toUpperCase() as Region,
                req.params.summonerName as SummonerName
            ));
        } catch (e: any) {
            res.status(404).send({ error: e.message });
        }
    }));

    app.use(express.static('./dist/client'));

    app.get('*', (_: Request, res: Response) => {
        res.sendFile('index.html', { root: './dist/client' });
    });

    app.listen(process.env.port, () => {
        console.log('Application started on port 3000!');
    });
}