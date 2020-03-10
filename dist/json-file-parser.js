"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
class JsonFileParser {
    static parse(fixtureFilePath) {
        if (fixtureFilePath !== '' && fs.existsSync(fixtureFilePath)) {
            const fileContentRaw = fs.readFileSync(fixtureFilePath);
            return JSON.parse(fileContentRaw.toString());
        }
        else {
            throw new Error(`Fixture file path: '${fixtureFilePath}' could not be found`);
        }
    }
}
exports.JsonFileParser = JsonFileParser;
//# sourceMappingURL=json-file-parser.js.map