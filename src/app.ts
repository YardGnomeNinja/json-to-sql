//////////
// APP
//////////
const appArgs = process.argv.slice(2);
console.log('arguments:')
console.log(appArgs);

//////////
// JSON
//////////
const fs = require('fs');
// const fileContentRaw = fs.readFileSync('C:\\src\\json-to-sql\\src\\test-fixture.json');
// const fileContentRaw = fs.readFileSync('C:\\src\\ZoneNext\\test\\e2e\\browserstack\\fixtures\\chrome\\chrome-latest-elementary\\school.json');
const fileContentRaw = fs.readFileSync('C:\\src\\json-to-sql\\test\\fixtures\\initialize.json');
const fileContentJson = JSON.parse(fileContentRaw);

// //////////
// // SQL
// //////////
const sql = require("mssql/msnodesqlv8");

const sqlConnectionPool = new sql.ConnectionPool({
    server: "(localdb)\\MSSQLLocalDB",
    database: "json_to_sql_testing",
    options: {
      trustedConnection: true
    }
  });

async function executeQuery(query: string) {
    try {
        const request = new sql.Request(sqlConnectionPool);
      
        return await request.query(query);
    } catch (err) {
        console.error(err);
    }
};

//////////
// MEAT
//////////
let insertIfMissing: boolean = false;
let deleteIfOnlyKeyIsSpecified: boolean = false;

function setConfig(json: any) {
    insertIfMissing = json.insertIfMissing;
    deleteIfOnlyKeyIsSpecified = json.deleteIfOnlyKeyIsSpecified;
}

let commandList: Array<string> = new Array<string>();

async function doTheWork(json: any) {
    setConfig(json);

    for(let tableObject of json.tables) {
        let keyNames = tableObject.keys;

        for(let dataItem of tableObject.data) {
            // EXISTS: SELECT IIF (EXISTS (SELECT 1 FROM ${table} WHERE ${column} = ${value}), 1, 0)
            // SELECT: SELECT ${column} FROM ${table} WHERE ${column} = ${value}
            // INSERT: INSERT INTO ${table} (${column},${column}) VALUES (${value},${value})
            // UPDATE: UPDATE ${table} SET ${column} = ${value}, ${column} = ${value} WHERE ${column} = ${value}
            // DELETE: DELETE FROM ${table} WHERE ${column} = ${value}

            // Keys
            let keys: Array<{"name": string, "value": any}> = new Array<{"name": string, "value": any}>();

            for (let keyName of keyNames) {
                keys.push({ "name": keyName, "value": dataItem[keyName]});
            }

            let keyColumnsAndValues = "";

            for(let keyValuePair of keys) {
                if (keyColumnsAndValues !== "") {
                    keyColumnsAndValues += " AND ";
                }

                keyColumnsAndValues += `[${keyValuePair.name}] = ${keyValuePair.value}`;
            }

            // Columns
            let columns: Array<{"name": string, "value": any}> = new Array<{"name": string, "value": any}>();

            for(let columnName in dataItem) {
                columns.push({ "name": columnName, "value": dataItem[columnName]});
            }

            let insertColumns = "";
            let insertValues = "";
            let updateColumnsAndValues = "";

            for(let column of columns) {
                // If the current column name is found in the keys, ignore it
                if (keys.findIndex(x => x.name === column.name) === -1) {
                    if (insertColumns !== "") {
                        insertColumns += ", ";
                    }
    
                    insertColumns += `[${column.name}]`;
    
                    if (insertValues !== "") {
                        insertValues += ", ";
                    }
    
                    insertValues += column.value;
    
                    if (updateColumnsAndValues !== "") {
                        updateColumnsAndValues += ", ";
                    }
    
                    updateColumnsAndValues += `[${column.name}] = ${column.value}`;
                }
            }

            // Queries
            let existsQuery = `SELECT IIF (EXISTS (SELECT 1 FROM [${tableObject.name}] WHERE ${keyColumnsAndValues}), 'true', 'false') as 'record_exists'`;
            let insertQuery = `INSERT INTO [${tableObject.name}] (${insertColumns}) VALUES (${insertValues})`;
            let updateQuery = `UPDATE [${tableObject.name}] SET ${updateColumnsAndValues} WHERE ${keyColumnsAndValues}`
            let deleteQuery = `DELETE FROM [${tableObject.name}] WHERE ${keyColumnsAndValues}`

            // Check if record exists
            console.log(existsQuery);
            let existsQueryResult = await executeQuery(existsQuery);
            let recordExists = existsQueryResult.recordset[0].record_exists === 'true';
            
            // Carry out work
            // INSERT
            if (insertIfMissing && !recordExists && insertColumns != "") {
                console.log(insertQuery);
                let insertQueryResult = await executeQuery(insertQuery);
                console.log(insertQueryResult);
            } 
            
            // UPDATE
            if (recordExists && updateColumnsAndValues != "") {
                console.log(updateQuery);
                let updateQueryResult = await executeQuery(updateQuery);
                console.log(updateQueryResult);
            }

            // DELETE
            if (deleteIfOnlyKeyIsSpecified && insertColumns === "" && updateColumnsAndValues === "") {
                console.log(deleteQuery);
                let deleteQueryResult = await executeQuery(deleteQuery);
                console.log(deleteQueryResult);
            }

            console.log('-----');
        }
    }
}

// Note the following allows async code to execute on init.
// (async () => {})();
(async () => {
    await sqlConnectionPool.connect();

    await doTheWork(fileContentJson);

    sqlConnectionPool.close();
})();