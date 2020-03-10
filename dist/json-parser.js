"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
class JsonParser {
    constructor(fixtureFilePath) {
        this.fixtureFilePath = '';
        if (fixtureFilePath !== '' && fs.existsSync(fixtureFilePath)) {
            this.fixtureFilePath = fixtureFilePath;
        }
        else {
            throw new Error('File path could not be found');
        }
    }
}
exports.JsonParser = JsonParser;
//# sourceMappingURL=json-parser.js.map