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
let sql;
class SqlRunner {
    constructor(sqlServerConfig) {
        this.disableMutationStatements = false;
        this.sqlConnectionPoolConfig = this.translateConfig(sqlServerConfig);
    }
    buildWhereStatement(keys) {
        let result = '';
        for (let keyValuePair of keys) {
            if (result !== '') {
                result += ' AND ';
            }
            if (keyValuePair.value !== undefined) {
                result += `${keyValuePair.name}=${keyValuePair.value}`;
            }
        }
        return result;
    }
    close() {
        sql.close();
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.sqlConnectionPool = yield sql.connect(this.sqlConnectionPoolConfig);
        });
    }
    executeJson(json) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.disableMutationStatements) {
                    console.log(`!!!Mutations disabled!!!`);
                }
                for (let queryDefinition of json.queryDefinitions) {
                    // NOTE: Changing the queryDefinition.type to something other than valid options can be used to disable execution for that definition
                    if (queryDefinition.type === 'table') {
                        yield this.executeTableQueryDefinition(queryDefinition);
                    }
                    if (queryDefinition.type === 'storedProcedure') {
                        yield this.executeStoredProcedureQueryDefinition(queryDefinition);
                    }
                }
            }
            catch (error) {
                throw error;
            }
        });
    }
    executeDelete(tableDefinition, whereStatement, insertColumns, updateColumnsAndValues) {
        return __awaiter(this, void 0, void 0, function* () {
            let deleteIfOnlyKeyIsSpecified = tableDefinition.deleteIfOnlyKeyIsSpecified === true ? true : false;
            let query = `DELETE FROM ${tableDefinition.name} WHERE ${whereStatement}`;
            if (deleteIfOnlyKeyIsSpecified && insertColumns === '' && updateColumnsAndValues === '') {
                console.log(query);
                // Should the SQL be executed?
                if (!this.disableMutationStatements) {
                    let queryResult = yield this.executeQuery(query);
                    console.log(queryResult);
                }
                else {
                    console.log('!!Not Executed!!');
                }
            }
        });
    }
    executeInsert(tableDefinition, insertColumns, insertValues, recordExists) {
        return __awaiter(this, void 0, void 0, function* () {
            let insertIfMissing = tableDefinition.insertIfMissing === true ? true : false;
            let query = `INSERT INTO ${tableDefinition.name} (${insertColumns}) VALUES (${insertValues})`;
            if (insertIfMissing && !recordExists && insertColumns != '') {
                console.log(query);
                // Should the SQL be executed?
                if (!this.disableMutationStatements) {
                    let queryResult = yield this.executeQuery(query);
                    console.log(queryResult);
                }
                else {
                    console.log('!!Not Executed!!');
                }
            }
        });
    }
    executeQuery(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.sqlConnectionPool.request().query(query);
            }
            catch (err) {
                console.error(err);
            }
        });
    }
    executeSelect(tableDefinition, selectColumns, whereStatement) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = `SELECT ${selectColumns} FROM ${tableDefinition.name} WHERE ${whereStatement}`;
            console.log(query);
            let queryResult = yield this.executeQuery(query);
            console.log(queryResult);
        });
    }
    executeStoredProcedure(queryDefinition, values) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = `EXEC ${queryDefinition.name} ${values}`;
            console.log(query);
            // Should the SQL be executed?
            if (!this.disableMutationStatements) {
                let queryResult = yield this.executeQuery(query);
                console.log(queryResult);
            }
            else {
                console.log('!!Not Executed!!');
            }
        });
    }
    executeStoredProcedureQueryDefinition(queryDefinition) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('-----');
            console.log(`${queryDefinition.type} '${queryDefinition.name}'`);
            console.log('-----');
            let spExists = yield this.getDatabaseObjectExists(queryDefinition);
            if (spExists === true) {
                for (let dataItem of queryDefinition.data) {
                    // Columns
                    let columns = this.getColumns(dataItem);
                    let populateQueryDataStringsResult = this.populateQueryDataStrings(columns);
                    let spFieldsAndValues = populateQueryDataStringsResult.spFieldsAndValues;
                    // EXECUTE
                    yield this.executeStoredProcedure(queryDefinition, spFieldsAndValues);
                    console.log('-----');
                }
            }
            else {
                throw new Error(`${queryDefinition.type} '${queryDefinition.name}' was not found`);
            }
        });
    }
    executeTableQueryDefinition(queryDefinition) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('-----');
            console.log(`${queryDefinition.type} '${queryDefinition.name}'`);
            console.log('-----');
            let tableExists = yield this.getDatabaseObjectExists(queryDefinition);
            if (tableExists === true) {
                let keyNames = queryDefinition.keys;
                for (let dataItem of queryDefinition.data) {
                    // Keys
                    let keys = this.getKeys(keyNames, dataItem);
                    let whereStatement = this.buildWhereStatement(keys);
                    // Columns
                    let columns = this.getColumns(dataItem);
                    let populateQueryDataStringsResult = this.populateQueryDataStrings(columns, keys);
                    let insertColumns = populateQueryDataStringsResult.insertColumns;
                    let insertValues = populateQueryDataStringsResult.insertValues;
                    let updateColumnsAndValues = populateQueryDataStringsResult.updateColumnsAndValues;
                    // EXISTS
                    let recordExists = yield this.getRecordExists(queryDefinition, whereStatement);
                    // SELECT - DEBUGGING USE
                    // await this.executeSelect(queryDefinition, insertColumns, whereStatement);
                    // // INSERT
                    yield this.executeInsert(queryDefinition, insertColumns, insertValues, recordExists);
                    // UPDATE
                    yield this.executeUpdate(queryDefinition, updateColumnsAndValues, whereStatement, recordExists);
                    // // DELETE
                    yield this.executeDelete(queryDefinition, whereStatement, insertColumns, updateColumnsAndValues);
                    // SELECT - DEBUGGING USE
                    // await this.executeSelect(queryDefinition, insertColumns, whereStatement);
                    console.log('-----');
                }
            }
            else {
                throw new Error(`${queryDefinition.type} '${queryDefinition.name}' was not found`);
            }
        });
    }
    executeUpdate(tableDefinition, updateColumnsAndValues, whereStatement, recordExists) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = `UPDATE ${tableDefinition.name} SET ${updateColumnsAndValues} WHERE ${whereStatement}`;
            if (recordExists && updateColumnsAndValues != '') {
                console.log(query);
                // Should the SQL be executed?
                if (!this.disableMutationStatements) {
                    let queryResult = yield this.executeQuery(query);
                    console.log(queryResult);
                }
                else {
                    console.log('!!Not Executed!!');
                }
            }
        });
    }
    getColumns(dataItem) {
        let results = new Array();
        for (let columnName in dataItem) {
            results.push({ 'name': columnName, 'value': dataItem[columnName] });
        }
        return results;
    }
    getKeys(keyNames, dataItem) {
        let results = new Array();
        for (let keyName of keyNames) {
            results.push({ 'name': keyName, 'value': dataItem[keyName] });
        }
        return results;
    }
    getDatabaseObjectExists(queryDefinition) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = '';
            // NOTE: This considers views as tables for the moment
            if (queryDefinition.type === 'table') {
                query = `SELECT IIF (EXISTS (SELECT 1 FROM sys.Objects WHERE object_id = object_id(N'${queryDefinition.name}') AND type IN (N'U',N'V')), 'true', 'false') as 'object_exists'`;
            }
            if (queryDefinition.type === 'storedProcedure') {
                query = `SELECT IIF (EXISTS (SELECT 1 FROM sys.Objects WHERE object_id = object_id(N'${queryDefinition.name}') AND type IN (N'P',N'PC')), 'true', 'false') as 'object_exists'`;
            }
            console.log(query);
            let queryResult = yield this.executeQuery(query);
            console.log(queryResult);
            return Promise.resolve(queryResult.recordset[0].object_exists === 'true');
        });
    }
    getRecordExists(tableDefinition, whereStatement) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = `SELECT IIF (EXISTS (SELECT 1 FROM ${tableDefinition.name} WHERE ${whereStatement}), 'true', 'false') as 'record_exists'`;
            console.log(query);
            let queryResult = yield this.executeQuery(query);
            console.log(queryResult);
            return Promise.resolve(queryResult.recordset[0].record_exists === 'true');
        });
    }
    populateQueryDataStrings(columns, keys) {
        let insertColumns = '';
        let insertValues = '';
        let updateColumnsAndValues = '';
        let spFieldsAndValues = '';
        for (let column of columns) {
            // If the current column name is found in the keys, ignore it
            if (keys !== undefined && keys.findIndex(x => x.name === column.name) === -1) {
                if (insertColumns !== '') {
                    insertColumns += ', ';
                }
                insertColumns += `${column.name}`;
                if (insertValues !== '') {
                    insertValues += ', ';
                }
                insertValues += column.value;
                if (updateColumnsAndValues !== '') {
                    updateColumnsAndValues += ', ';
                }
                updateColumnsAndValues += `${column.name}=${column.value}`;
            }
            else {
                if (spFieldsAndValues !== '') {
                    spFieldsAndValues += ', ';
                }
                spFieldsAndValues += `\@${column.name}=${column.value}`;
            }
        }
        return { insertColumns: insertColumns, insertValues: insertValues, updateColumnsAndValues: updateColumnsAndValues, spFieldsAndValues: spFieldsAndValues };
    }
    translateConfig(config) {
        let sqlConnectionPoolConfig;
        this.disableMutationStatements = config.disableMutationStatements;
        if (config.trustedConnection === true) {
            sql = require('mssql/msnodesqlv8'); // NOTE: Fields with triggers cause this to hang. Use when Trusted Connection is required to attach to database.
            sqlConnectionPoolConfig = {
                server: config.serverName,
                database: config.databaseName,
                connectionTimeout: config.connectionTimeout !== undefined ? config.connectionTimeout : 15000,
                options: {
                    trustedConnection: true,
                    enableArithAbort: config.enableArithAbort !== undefined ? config.enableArithAbort : true
                }
            };
        }
        else {
            sql = require('mssql/msnodesqlv8'); // Use when Trusted Connection is not required to attach to database
            sqlConnectionPoolConfig = {
                server: config.serverName,
                database: config.databaseName,
                user: config.username,
                password: config.password,
                connectionTimeout: config.connectionTimeout !== undefined ? config.connectionTimeout : 15000,
                options: {
                    enableArithAbort: config.enableArithAbort !== undefined ? config.enableArithAbort : true
                }
            };
        }
        return sqlConnectionPoolConfig;
    }
}
exports.SqlRunner = SqlRunner;
//# sourceMappingURL=sql-runner.js.map