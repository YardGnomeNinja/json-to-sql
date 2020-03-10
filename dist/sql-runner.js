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
const sql = require('mssql/msnodesqlv8');
class SqlRunner {
    constructor(sqlServerConfig) {
        let sqlConnectionPoolConfig = this.translateConfig(sqlServerConfig);
        this.sqlConnectionPool = new sql.ConnectionPool(sqlConnectionPoolConfig);
    }
    buildWhereStatement(keys) {
        let result = '';
        for (let keyValuePair of keys) {
            if (result !== '') {
                result += ' AND ';
            }
            result += `${keyValuePair.name}=${keyValuePair.value}`;
        }
        return result;
    }
    close() {
        this.sqlConnectionPool.close();
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sqlConnectionPool.connect();
        });
    }
    executeJson(json) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
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
                let queryResult = yield this.executeQuery(query);
                console.log(queryResult);
            }
        });
    }
    executeInsert(tableDefinition, insertColumns, insertValues, recordExists) {
        return __awaiter(this, void 0, void 0, function* () {
            let insertIfMissing = tableDefinition.insertIfMissing === true ? true : false;
            let query = `INSERT INTO ${tableDefinition.name} (${insertColumns}) VALUES (${insertValues})`;
            if (insertIfMissing && !recordExists && insertColumns != '') {
                console.log(query);
                let queryResult = yield this.executeQuery(query);
                console.log(queryResult);
            }
        });
    }
    executeQuery(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const request = new sql.Request(this.sqlConnectionPool);
                return yield request.query(query);
            }
            catch (err) {
                console.error(err);
            }
        });
    }
    executeStoredProcedure(queryDefinition, values) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = `EXEC ${queryDefinition.name} ${values}`;
            console.log(query);
            let queryResult = yield this.executeQuery(query);
            console.log(queryResult);
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
                    // INSERT
                    yield this.executeInsert(queryDefinition, insertColumns, insertValues, recordExists);
                    // UPDATE
                    yield this.executeUpdate(queryDefinition, updateColumnsAndValues, whereStatement, recordExists);
                    // DELETE
                    yield this.executeDelete(queryDefinition, whereStatement, insertColumns, updateColumnsAndValues);
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
                let queryResult = yield this.executeQuery(query);
                console.log(queryResult);
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
            if (queryDefinition.type === 'table') {
                query = `SELECT IIF (EXISTS (SELECT 1 FROM sys.Objects WHERE object_id = object_id(N'${queryDefinition.name}') AND type = N'U'), 'true', 'false') as 'object_exists'`;
            }
            if (queryDefinition.type === 'storedProcedure') {
                query = `SELECT IIF (EXISTS (SELECT 1 FROM sys.Objects WHERE object_id = object_id(N'${queryDefinition.name}') AND type IN (N'P',N'PC')), 'true', 'false') as 'object_exists'`;
            }
            console.log(query);
            let queryResult = yield this.executeQuery(query);
            return Promise.resolve(queryResult.recordset[0].object_exists === 'true');
        });
    }
    getRecordExists(tableDefinition, whereStatement) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = `SELECT IIF (EXISTS (SELECT 1 FROM ${tableDefinition.name} WHERE ${whereStatement}), 'true', 'false') as 'record_exists'`;
            let queryResult = yield this.executeQuery(query);
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
        if (config.trustedConnection === true) {
            sqlConnectionPoolConfig = {
                server: config.serverName,
                database: config.databaseName,
                options: {
                    trustedConnection: true
                }
            };
        }
        else {
            sqlConnectionPoolConfig = {
                server: config.serverName,
                database: config.databaseName,
                user: config.username,
                password: config.password
            };
        }
        return sqlConnectionPoolConfig;
    }
}
exports.SqlRunner = SqlRunner;
//# sourceMappingURL=sql-runner.js.map