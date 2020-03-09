const sql = require('mssql/msnodesqlv8');

export class SqlRunner {
    sqlServerConfig: any;
    sqlConnectionPool: any;

    constructor(sqlServerConfig: any) {
        let sqlConnectionPoolConfig = this.translateConfig(sqlServerConfig);

        this.sqlConnectionPool = new sql.ConnectionPool(sqlConnectionPoolConfig);
    }

    close() {
        this.sqlConnectionPool.close();
    }

    async connect() {
        await this.sqlConnectionPool.connect();
    }

    async executeJson(json: any) {
        for (let tableDefinition of json.tables) {
            let insertIfMissing: boolean = tableDefinition.insertIfMissing === true ? true : false;
            let deleteIfOnlyKeyIsSpecified: boolean = tableDefinition.deleteIfOnlyKeyIsSpecified === true ? true : false;
    
            let keyNames = tableDefinition.keys;
    
            for (let dataItem of tableDefinition.data) {
                // EXISTS: SELECT IIF (EXISTS (SELECT 1 FROM ${table} WHERE ${column} = ${value}), 1, 0)
                // SELECT: SELECT ${column} FROM ${table} WHERE ${column} = ${value}
                // INSERT: INSERT INTO ${table} (${column},${column}) VALUES (${value},${value})
                // UPDATE: UPDATE ${table} SET ${column} = ${value}, ${column} = ${value} WHERE ${column} = ${value}
                // DELETE: DELETE FROM ${table} WHERE ${column} = ${value}
    
                // Keys
                let keys: Array<{'name': string, 'value': any}> = new Array<{'name': string, 'value': any}>();
    
                for (let keyName of keyNames) {
                    keys.push({ 'name': keyName, 'value': dataItem[keyName]});
                }
    
                let keyColumnsAndValues = '';
    
                for (let keyValuePair of keys) {
                    if (keyColumnsAndValues !== '') {
                        keyColumnsAndValues += ' AND ';
                    }
    
                    keyColumnsAndValues += `[${keyValuePair.name}] = ${keyValuePair.value}`;
                }
    
                // Columns
                let columns: Array<{'name': string, 'value': any}> = new Array<{'name': string, 'value': any}>();
    
                for (let columnName in dataItem) {
                    columns.push({ 'name': columnName, 'value': dataItem[columnName]});
                }
    
                let insertColumns = '';
                let insertValues = '';
                let updateColumnsAndValues = '';
    
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
    
                // Queries
                let existsQuery = `SELECT IIF (EXISTS (SELECT 1 FROM [${tableDefinition.name}] WHERE ${keyColumnsAndValues}), 'true', 'false') as 'record_exists'`;
                let insertQuery = `INSERT INTO [${tableDefinition.name}] (${insertColumns}) VALUES (${insertValues})`;
                let updateQuery = `UPDATE [${tableDefinition.name}] SET ${updateColumnsAndValues} WHERE ${keyColumnsAndValues}`
                let deleteQuery = `DELETE FROM [${tableDefinition.name}] WHERE ${keyColumnsAndValues}`
    
                // Check if record exists
                console.log(existsQuery);
                let existsQueryResult = await this.executeQuery(existsQuery);
                let recordExists = existsQueryResult.recordset[0].record_exists === 'true';
                
                // Carry out work
                // INSERT
                if (insertIfMissing && !recordExists && insertColumns != '') {
                    console.log(insertQuery);
                    let insertQueryResult = await this.executeQuery(insertQuery);
                    console.log(insertQueryResult);
                } 
                
                // UPDATE
                if (recordExists && updateColumnsAndValues != '') {
                    console.log(updateQuery);
                    let updateQueryResult = await this.executeQuery(updateQuery);
                    console.log(updateQueryResult);
                }
    
                // DELETE
                if (deleteIfOnlyKeyIsSpecified && insertColumns === '' && updateColumnsAndValues === '') {
                    console.log(deleteQuery);
                    let deleteQueryResult = await this.executeQuery(deleteQuery);
                    console.log(deleteQueryResult);
                }
    
                console.log('-----');
            }
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