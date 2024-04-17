import DB from "../db/DB";


export default class DataReporter {
    
    static async getMatchups() {
        const db = await DB.init();
    }
}