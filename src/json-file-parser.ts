import * as fs from 'fs';

export class JsonFileParser {
    static parse(fixtureFilePath: string): any {
        if (fixtureFilePath !== '' && fs.existsSync(fixtureFilePath)) {
            const fileContentRaw = fs.readFileSync(fixtureFilePath);

            return JSON.parse(fileContentRaw.toString());
        } else {
            throw new Error(`Fixture file path: '${fixtureFilePath}' could not be found`);

        }
    }
}