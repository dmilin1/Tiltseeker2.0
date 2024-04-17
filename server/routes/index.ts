import express from "express";
import { Request, Response } from 'express';
import asyncHandler from "express-async-handler";
import DB from "../db/DB";

export default () => {
    const app = express();

    app.get('/', async (_: Request, res: Response) => {
        res.send('woot');
    });

    app.get('/matchups', asyncHandler(async (_: Request, res: Response) => {
        res.send(await DB.getMatchups(await DB.getNewestPatch()));
    }));

    app.listen(3000, () => {
        console.log('Application started on port 3000!');
    });
}