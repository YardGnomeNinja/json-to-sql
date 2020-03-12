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

// Note the following allows async code to execute on init.
// Use for testing
// (async () => { console.log('ASYNC STARTUP ENABLED - Did you forget to comment this out, dingus?'); await main(process.argv); })();

export async function main(args: Array<string>) {
    try {
        parseArgs(args.slice(2));

        if (!fixtureFilePath) {
            throw new Error('No fixture file was provided');
        }

        const fileContentJson = JsonFileParser.parse(fixtureFilePath);

        sqlRunner = new SqlRunner(fileContentJson.sqlServerConfig);

        console.log(`Opening connection to '${fileContentJson.sqlServerConfig.serverName}' database '${fileContentJson.sqlServerConfig.databaseName}'...`);
        await sqlRunner.connect();

        console.log(`Executing JSON fixture '${fixtureFilePath}'...`)
        await sqlRunner.executeJson(fileContentJson);

        console.log(`Closing connection to '${fileContentJson.sqlServerConfig.serverName}' database '${fileContentJson.sqlServerConfig.databaseName}'...`);
        sqlRunner.close();
        console.log(`Connection to '${fileContentJson.sqlServerConfig.serverName}' database '${fileContentJson.sqlServerConfig.databaseName}' closed.`);
    } catch (error) {
        if (sqlRunner) {
            sqlRunner.close();
        }

        console.log(error);

        // Exit with error
        process.exit(1);
    }
}
