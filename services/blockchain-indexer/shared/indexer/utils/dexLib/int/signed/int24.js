"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
const limit_1 = require("../base/limit");
class Int24 extends base_1.BigIntBase {
    static from(value) {
        return base_1.BigIntFactory.bind(this)(value, true, 24);
    }
    toBigNumber(value) {
        return Int24.from(value);
    }
}
Int24.MAX = limit_1.maxSigned[24];
Int24.MIN = limit_1.minSigned[24];
exports.default = Int24;
//# sourceMappingURL=int24.js.map