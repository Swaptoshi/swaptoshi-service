"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
const limit_1 = require("../base/limit");
class Int8 extends base_1.BigIntBase {
    static from(value) {
        return base_1.BigIntFactory.bind(this)(value, true, 8);
    }
    toBigNumber(value) {
        return Int8.from(value);
    }
}
Int8.MAX = limit_1.maxSigned[8];
Int8.MIN = limit_1.minSigned[8];
exports.default = Int8;
//# sourceMappingURL=int8.js.map