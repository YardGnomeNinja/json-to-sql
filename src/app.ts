// npm start 'C:\\src\\json-to-sql\\test\\fixtures\\initialize.json'
import { JsonFileParser } from './json-file-parser';
import { SqlRunner } from './sql-runner';

//////////
// APP
//////////
let fixtureFilePath: string = "";
let sqlRunner: SqlRunner;

// Note the following allows async code to execute on init.
// (async () => {})();
(async () => {
    parseArgs(process.argv.slice(2));

    await main();
})();

function parseArgs(args: any) {
    fixtureFilePath = args[0];
}

async function main() {
    try {
        const fileContentJson = JsonFileParser.parse(fixtureFilePath);

        sqlRunner = new SqlRunner(fileContentJson.sqlServerConfig);

        await sqlRunner.connect();

        await sqlRunner.executeJson(fileContentJson);

        sqlRunner.close();
    } catch (error) {
        sqlRunner.close();

        console.log(error);

        // Exit with error
        process.exit(1);
    }
}
