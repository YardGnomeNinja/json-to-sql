// npm start 'C:\\src\\json-to-sql\\test\\fixtures\\initialize.json'
import { JsonFileParser } from './json-file-parser';
import { SqlRunner } from './sql-runner';
import { Helpers } from './helpers';

//////////
// APP
//////////
let fixtureFilePath: string = "";
let sqlRunner: SqlRunner;

function parseArgs(args: any) {
    fixtureFilePath = args[0];
}

// Note the following allows async code to execute on init.
// Use for testing
// (async () => { console.log('ASYNC STARTUP ENABLED - Did you forget to comment this out, dingus?'); await main(process.argv); })();

export async function main(args: Array<string>) {
    try {
        const appStartDate: Date = new Date();

        parseArgs(args.slice(2));

        if (!fixtureFilePath) {
            throw new Error('No fixture file was provided');
        }

        const fileContentJson = JsonFileParser.parse(fixtureFilePath);

        sqlRunner = new SqlRunner(fileContentJson.sqlServerConfig);

        // Connect to DB
        const connectStartDate: Date = new Date();
        console.log(`Opening connection to '${fileContentJson.sqlServerConfig.serverName}' database '${fileContentJson.sqlServerConfig.databaseName}'...`);
        await sqlRunner.connect();
        console.log(`Opening connection complete: ${Helpers.getElapsedTimeSince(connectStartDate)}.`);

        // Execute fixture
        const executeStartDate: Date = new Date();
        console.log(`Executing JSON fixture '${fixtureFilePath}'...`)
        await sqlRunner.executeJson(fileContentJson);
        console.log(`Executing JSON fixture complete: ${Helpers.getElapsedTimeSince(executeStartDate)}.`);

        // Close DB connection
        const closeStartDate: Date = new Date();
        console.log(`Closing connection to '${fileContentJson.sqlServerConfig.serverName}' database '${fileContentJson.sqlServerConfig.databaseName}'...`);
        sqlRunner.close();
        console.log(`Connection to '${fileContentJson.sqlServerConfig.serverName}' database '${fileContentJson.sqlServerConfig.databaseName}' closed: ${Helpers.getElapsedTimeSince(closeStartDate)}`);

        console.log(`Fixture complete: ${Helpers.getElapsedTimeSince(appStartDate)}.`);
    } catch (error) {
        if (sqlRunner) {
            sqlRunner.close();
        }

        console.log(error);

        // Exit with error
        process.exit(1);
    }
}
