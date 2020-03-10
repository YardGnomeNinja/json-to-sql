const sql = require('mssql/msnodesqlv8');

export class SqlRunner {
    sqlServerConfig: any;
    sqlConnectionPool: any;

    constructor(sqlServerConfig: any) {
        let sqlConnectionPoolConfig = this.translateConfig(sqlServerConfig);

        this.sqlConnectionPool = new sql.ConnectionPool(sqlConnectionPoolConfig);
    }

    buildWhereStatement(keys: any) {
        let result = '';

        for (let keyValuePair of keys) {
            if (result !== '') {
                result += ' AND ';
            }

            result += `[${keyValuePair.name}] = ${keyValuePair.value}`;
        }

        return result;
    }

    close() {
        this.sqlConnectionPool.close();
    }

    async connect() {
        await this.sqlConnectionPool.connect();
    }

    async executeJson(json: any) {
        for (let tableDefinition of json.tables) {
            let keyNames = tableDefinition.keys;
    
            for (let dataItem of tableDefinition.data) {
                // Keys
                let keys = this.getKeys(keyNames, dataItem);
                let whereStatement = this.buildWhereStatement(keys);
       
                // Columns
                let columns: Array<{'name': string, 'value': any}> = this.getColumns(dataItem)
    
                let populateQueryDataStringsResult = this.populateQueryDataStrings(keys, columns);

                let insertColumns = populateQueryDataStringsResult.insertColumns;
                let insertValues = populateQueryDataStringsResult.insertValues;
                let updateColumnsAndValues = populateQueryDataStringsResult.updateColumnsAndValues;

                // EXISTS
                let recordExists = await this.getRecordExists(tableDefinition, whereStatement);
                
                // INSERT
                await this.executeInsert(tableDefinition, insertColumns, insertValues, recordExists);
                
                // UPDATE
                await this.executeUpdate(tableDefinition, updateColumnsAndValues, whereStatement, recordExists);
    
                // DELETE
                await this.executeDelete(tableDefinition, whereStatement, insertColumns, updateColumnsAndValues);
    
                console.log('-----');
            }
        }
    }

    async executeDelete(tableDefinition: any, whereStatement: string, insertColumns: string, updateColumnsAndValues: string) {
        let deleteIfOnlyKeyIsSpecified: boolean = tableDefinition.deleteIfOnlyKeyIsSpecified === true ? true : false;
        let query = `DELETE FROM [${tableDefinition.name}] WHERE ${whereStatement}`;

        if (deleteIfOnlyKeyIsSpecified && insertColumns === '' && updateColumnsAndValues === '') {
            console.log(query);
            let queryResult = await this.executeQuery(query);
            console.log(queryResult);
        }
    }

    async executeInsert(tableDefinition: any, insertColumns: string, insertValues: string, recordExists: boolean) {
        let insertIfMissing: boolean = tableDefinition.insertIfMissing === true ? true : false;
        let query = `INSERT INTO [${tableDefinition.name}] (${insertColumns}) VALUES (${insertValues})`;

        if (insertIfMissing && !recordExists && insertColumns != '') {
            console.log(query);
            let queryResult = await this.executeQuery(query);
            console.log(queryResult);
        } 
    }

    async executeQuery(query: string) {
        try {
            const request = new sql.Request(this.sqlConnectionPool);
          
            return await request.query(query);
        } catch (err) {
            console.error(err);
        }
    }

    async executeUpdate(tableDefinition: any, updateColumnsAndValues: string, whereStatement: string, recordExists: boolean) {
        let query = `UPDATE [${tableDefinition.name}] SET ${updateColumnsAndValues} WHERE ${whereStatement}`;

        if (recordExists && updateColumnsAndValues != '') {
            console.log(query);
            let queryResult = await this.executeQuery(query);
            console.log(queryResult);
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

    private async getRecordExists(tableDefinition: any, whereStatement: string): Promise<boolean> {
        let query = `SELECT IIF (EXISTS (SELECT 1 FROM [${tableDefinition.name}] WHERE ${whereStatement}), 'true', 'false') as 'record_exists'`;

        let queryResult = await this.executeQuery(query);

        return Promise.resolve(queryResult.recordset[0].record_exists === 'true');
    }

    private populateQueryDataStrings(keys: Array<{ 'name': string, 'value': any }>, columns: Array<{ 'name': string, 'value': any }>): { insertColumns: string, insertValues: string, updateColumnsAndValues: string } {
        let insertColumns: string = '';
        let insertValues: string = '';
        let updateColumnsAndValues: string = '';

        for (let column of columns) {
            // If the current column name is found in the keys, ignore it
            if (keys.findIndex(x => x.name === column.name) === -1) {
                if (insertColumns !== '') {
                    insertColumns += ', ';
                }

                insertColumns += `[${column.name}]`;

                if (insertValues !== '') {
                    insertValues += ', ';
                }

                insertValues += column.value;

                if (updateColumnsAndValues !== '') {
                    updateColumnsAndValues += ', ';
                }

                updateColumnsAndValues += `[${column.name}] = ${column.value}`;
            }
        }

        return { insertColumns: insertColumns, insertValues: insertValues, updateColumnsAndValues: updateColumnsAndValues };
    }

    private translateConfig(config: any) {
        let sqlConnectionPoolConfig: any;

        if (config.trustedConnection === true) {
            sqlConnectionPoolConfig = {
                server: config.serverName,
                database: config.databaseName,
                options: {
                    trustedConnection: true
                }
            };
        } else {
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