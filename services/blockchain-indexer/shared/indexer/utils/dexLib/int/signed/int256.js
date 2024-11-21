"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
const limit_1 = require("../base/limit");
class Int256 extends base_1.BigIntBase {
    static from(value) {
        return base_1.BigIntFactory.bind(this)(value, true, 256);
    }
    toBigNumber(value) {
        return Int256.from(value);
    }
}
Int256.MAX = limit_1.maxSigned[256];
Int256.MIN = limit_1.minSigned[256];
exports.default = Int256;
//# sourceMappingURL=int256.js.map