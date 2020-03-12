"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// npm start 'C:\\src\\json-to-sql\\test\\fixtures\\initialize.json'
const json_file_parser_1 = require("./json-file-parser");
const sql_runner_1 = require("./sql-runner");
const helpers_1 = require("./helpers");
//////////
// APP
//////////
let fixtureFilePath = "";
let sqlRunner;
function parseArgs(args) {
    fixtureFilePath = args[0];
}
// Note the following allows async code to execute on init.
// Use for testing
// (async () => { console.log('ASYNC STARTUP ENABLED - Did you forget to comment this out, dingus?'); await main(process.argv); })();
function main(args) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const appStartDate = new Date();
            parseArgs(args.slice(2));
            if (!fixtureFilePath) {
                throw new Error('No fixture file was provided');
            }
            const fileContentJson = json_file_parser_1.JsonFileParser.parse(fixtureFilePath);
            sqlRunner = new sql_runner_1.SqlRunner(fileContentJson.sqlServerConfig);
            // Connect to DB
            const connectStartDate = new Date();
            console.log(`Opening connection to '${fileContentJson.sqlServerConfig.serverName}' database '${fileContentJson.sqlServerConfig.databaseName}'...`);
            yield sqlRunner.connect();
            console.log(`Opening connection complete: ${helpers_1.Helpers.getElapsedTimeSince(connectStartDate)}.`);
            // Execute fixture
            const executeStartDate = new Date();
            console.log(`Executing JSON fixture '${fixtureFilePath}'...`);
            yield sqlRunner.executeJson(fileContentJson);
            console.log(`Executing JSON fixture complete: ${helpers_1.Helpers.getElapsedTimeSince(executeStartDate)}.`);
            // Close DB connection
            const closeStartDate = new Date();
            console.log(`Closing connection to '${fileContentJson.sqlServerConfig.serverName}' database '${fileContentJson.sqlServerConfig.databaseName}'...`);
            sqlRunner.close();
            console.log(`Connection to '${fileContentJson.sqlServerConfig.serverName}' database '${fileContentJson.sqlServerConfig.databaseName}' closed: ${helpers_1.Helpers.getElapsedTimeSince(closeStartDate)}`);
            console.log(`Fixture complete: ${helpers_1.Helpers.getElapsedTimeSince(appStartDate)}.`);
        }
        catch (error) {
            if (sqlRunner) {
                sqlRunner.close();
            }
            console.log(error);
            // Exit with error
            process.exit(1);
        }
    });
}
exports.main = main;
//# sourceMappingURL=app.js.map