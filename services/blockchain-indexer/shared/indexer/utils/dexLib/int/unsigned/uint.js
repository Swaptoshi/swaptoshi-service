"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
class Uint extends base_1.BigIntBase {
    static from(value) {
        return base_1.BigIntFactory.bind(this)(value, false, 0);
    }
    toBigNumber(value) {
        return Uint.from(value);
    }
}
exports.default = Uint;
//# sourceMappingURL=uint.js.map