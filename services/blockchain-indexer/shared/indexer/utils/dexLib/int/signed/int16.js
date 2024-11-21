"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
const limit_1 = require("../base/limit");
class Int16 extends base_1.BigIntBase {
    static from(value) {
        return base_1.BigIntFactory.bind(this)(value, true, 16);
    }
    toBigNumber(value) {
        return Int16.from(value);
    }
}
Int16.MAX = limit_1.maxSigned[16];
Int16.MIN = limit_1.minSigned[16];
exports.default = Int16;
//# sourceMappingURL=int16.js.map