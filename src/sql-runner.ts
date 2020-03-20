import { Helpers } from './helpers';

let sql: any;

export class SqlRunner {
    sqlServerConfig: any;
    sqlConnectionPool: any;
    sqlConnectionPoolConfig: any;
    disableMutationStatements: boolean = false;
    
    constructor(sqlServerConfig: any) {
        this.sqlConnectionPoolConfig = this.translateConfig(sqlServerConfig);
    }

    buildWhereStatement(keys: any) {
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

    async connect() {
        this.sqlConnectionPool = await sql.connect(this.sqlConnectionPoolConfig);
    }

    async executeJson(json: any) {
        try {
            if (this.disableMutationStatements) {
                console.log(`!!!Mutations disabled!!!`)
            }

            for (let queryDefinition of json.queryDefinitions) {
                // NOTE: Changing the queryDefinition.type to something other than valid options can be used to disable execution for that definition
                if (queryDefinition.type === 'table') {
                    await this.executeTableQueryDefinition(queryDefinition);
                }

                if (queryDefinition.type === 'storedProcedure') {
                    await this.executeStoredProcedureQueryDefinition(queryDefinition);
                }
            }
        } catch (error) {
            throw error;
        }
    }

    async executeDelete(tableDefinition: any, whereStatement: string, insertColumns: string, updateColumnsAndValues: string) {
        let deleteIfOnlyKeyIsSpecified: boolean = tableDefinition.deleteIfOnlyKeyIsSpecified === true ? true : false;
        let query = `DELETE FROM ${tableDefinition.name} WHERE ${whereStatement}`;

        if (deleteIfOnlyKeyIsSpecified && insertColumns === '' && updateColumnsAndValues === '') {
            console.log(query);

            // Should the SQL be executed?
            if (!this.disableMutationStatements) {
                let queryResult = await this.executeQuery(query);
                console.log(queryResult);
            } else {
                console.log('!!Not Executed!!');
            }
        }
    }

    async executeInsert(tableDefinition: any, insertColumns: string, insertValues: string, recordExists: boolean) {
        let insertIfMissing: boolean = tableDefinition.insertIfMissing === true ? true : false;
        let query = `INSERT INTO ${tableDefinition.name} (${insertColumns}) VALUES (${insertValues})`;

        if (insertIfMissing && !recordExists && insertColumns != '') {
            console.log(query);

            // Should the SQL be executed?
            if (!this.disableMutationStatements) {
                let queryResult = await this.executeQuery(query);
                console.log(queryResult);
            } else {
                console.log('!!Not Executed!!');
            }
        } 
    }

    async executeQuery(query: string) {
        try {
            return await this.sqlConnectionPool.request().query(query);
        } catch (err) {
            console.error(err);
        }
    }

    async executeSelect(tableDefinition: any, selectColumns: string, whereStatement: string) {
        let query = `SELECT ${selectColumns} FROM ${tableDefinition.name} WHERE ${whereStatement}`;

        console.log(query);
        let queryResult = await this.executeQuery(query);
        console.log(queryResult);
    }

    async executeStoredProcedure(queryDefinition: any, values: string) {
        let query = `EXEC ${queryDefinition.name} ${values}`;

        console.log(query);

        // Should the SQL be executed?
        if (!this.disableMutationStatements) {
            let queryResult = await this.executeQuery(query);
            console.log(queryResult);
        } else {
            console.log('!!Not Executed!!');
        }
}

    async executeStoredProcedureQueryDefinition(queryDefinition: any) {
        console.log('-----');
        console.log(`${queryDefinition.type} '${queryDefinition.name}'`);
        console.log('-----');
        
        let spExists = await this.getDatabaseObjectExists(queryDefinition);
        
        if (spExists === true) {
            for (let dataItem of queryDefinition.data) {
                // Columns
                let columns: Array<{'name': string, 'value': any}> = this.getColumns(dataItem)

                let populateQueryDataStringsResult = this.populateQueryDataStrings(columns);

                let spFieldsAndValues = populateQueryDataStringsResult.spFieldsAndValues;

                // EXECUTE
                await this.executeStoredProcedure(queryDefinition, spFieldsAndValues);

                console.log('-----');
            }
        } else {
            throw new Error(`${queryDefinition.type} '${queryDefinition.name}' was not found`);
        }
    }

    async executeTableQueryDefinition(queryDefinition: any) {
        console.log('-----');
        console.log(`${queryDefinition.type} '${queryDefinition.name}'`);
        console.log('-----');
        
        let tableExists = await this.getDatabaseObjectExists(queryDefinition);
        
        if (tableExists === true) {
            let keyNames = queryDefinition.keys;

            for (let dataItem of queryDefinition.data) {
                // Keys
                let keys = this.getKeys(keyNames, dataItem);
                let whereStatement = this.buildWhereStatement(keys);
    
                // Columns
                let columns: Array<{'name': string, 'value': any}> = this.getColumns(dataItem)
    
                let populateQueryDataStringsResult = this.populateQueryDataStrings(columns, keys);
    
                let insertColumns = populateQueryDataStringsResult.insertColumns;
                let insertValues = populateQueryDataStringsResult.insertValues;
                let updateColumnsAndValues = populateQueryDataStringsResult.updateColumnsAndValues;
    
                // EXISTS
                let recordExists = await this.getRecordExists(queryDefinition, whereStatement);

                // SELECT - DEBUGGING USE
                // await this.executeSelect(queryDefinition, insertColumns, whereStatement);

                // // INSERT
                await this.executeInsert(queryDefinition, insertColumns, insertValues, recordExists);
                
                // UPDATE
                await this.executeUpdate(queryDefinition, updateColumnsAndValues, whereStatement, recordExists);
    
                // // DELETE
                await this.executeDelete(queryDefinition, whereStatement, insertColumns, updateColumnsAndValues);
    
                // SELECT - DEBUGGING USE
                // await this.executeSelect(queryDefinition, insertColumns, whereStatement);

                console.log('-----');
            }
        } else {
            throw new Error(`${queryDefinition.type} '${queryDefinition.name}' was not found`);
        }
    }

    async executeUpdate(tableDefinition: any, updateColumnsAndValues: string, whereStatement: string, recordExists: boolean) {
        let query = `UPDATE ${tableDefinition.name} SET ${updateColumnsAndValues} WHERE ${whereStatement}`;

        if (recordExists && updateColumnsAndValues != '') {
            console.log(query);

            // Should the SQL be executed?
            if (!this.disableMutationStatements) {
                let queryResult = await this.executeQuery(query);
                console.log(queryResult);
            } else {
                console.log('!!Not Executed!!');
            }
        }
    }
    
    private getColumns(dataItem: any) {
        let results = new Array<{ 'name': string, 'value': any }>();

        for (let columnName in dataItem) {
            results.push({ 'name': columnName, 'value': dataItem[columnName]});
        }

        return results;
    }

    private getKeys(keyNames: any, dataItem: any) {
        let results = new Array<{ 'name': string, 'value': any }>();

        for (let keyName of keyNames) {
            results.push({ 'name': keyName, 'value': dataItem[keyName]});
        }

        return results;
    }

    private async getDatabaseObjectExists(queryDefinition: any): Promise<boolean> {
        let query = '';
        
        // NOTE: This considers views as tables for the moment
        if (queryDefinition.type === 'table') {
            query = `SELECT IIF (EXISTS (SELECT 1 FROM sys.Objects WHERE object_id = object_id(N'${queryDefinition.name}') AND type IN (N'U',N'V')), 'true', 'false') as 'object_exists'`;
        }     

        if (queryDefinition.type === 'storedProcedure') {
            query = `SELECT IIF (EXISTS (SELECT 1 FROM sys.Objects WHERE object_id = object_id(N'${queryDefinition.name}') AND type IN (N'P',N'PC')), 'true', 'false') as 'object_exists'`;
        }     

        console.log(query);
        let queryResult = await this.executeQuery(query);
        console.log(queryResult);

        return Promise.resolve(queryResult.recordset[0].object_exists === 'true');
    }

    private async getRecordExists(tableDefinition: any, whereStatement: string): Promise<boolean> {
        let query = `SELECT IIF (EXISTS (SELECT 1 FROM ${tableDefinition.name} WHERE ${whereStatement}), 'true', 'false') as 'record_exists'`;

        console.log(query);
        let queryResult = await this.executeQuery(query);
        console.log(queryResult);

        return Promise.resolve(queryResult.recordset[0].record_exists === 'true');
    }

    private populateQueryDataStrings(columns: Array<{ 'name': string, 'value': any }>, keys?: Array<{ 'name': string, 'value': any }>): { insertColumns: string, insertValues: string, updateColumnsAndValues: string, spFieldsAndValues: string } {
        let insertColumns: string = '';
        let insertValues: string = '';
        let updateColumnsAndValues: string = '';
        let spFieldsAndValues: string = '';

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
            } else {
                if (spFieldsAndValues !== '') {
                    spFieldsAndValues += ', ';
                }

                spFieldsAndValues += `\@${column.name}=${column.value}`;           
            }
        }

        return { insertColumns: insertColumns, insertValues: insertValues, updateColumnsAndValues: updateColumnsAndValues, spFieldsAndValues: spFieldsAndValues };
    }

    private translateConfig(config: any) {
        let sqlConnectionPoolConfig: any;

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
        } else {
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