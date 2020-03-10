// npm start 'C:\\src\\json-to-sql\\test\\fixtures\\initialize.json'
import { JsonFileParser } from './json-file-parser';
import { SqlRunner } from './sql-runner';

//////////
// APP
//////////
let fixtureFilePath: string = "";
let sqlRunner: SqlRunner;

function parseArgs(args: any) {
    fixtureFilePath = args[0];
}

export async function main(args: Array<"string">) {
    try {
        parseArgs(args.slice(2));

        if (!fixtureFilePath) {
            throw new Error('No fixture file was provided');
        }

        const fileContentJson = JsonFileParser.parse(fixtureFilePath);

        sqlRunner = new SqlRunner(fileContentJson.sqlServerConfig);

        await sqlRunner.connect();

        await sqlRunner.executeJson(fileContentJson);

        sqlRunner.close();
    } catch (error) {
        if (sqlRunner) {
            sqlRunner.close();
        }

        console.log(error);

        // Exit with error
        process.exit(1);
    }
}
