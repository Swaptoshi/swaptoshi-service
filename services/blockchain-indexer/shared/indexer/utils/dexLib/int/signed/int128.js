"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
const limit_1 = require("../base/limit");
class Int128 extends base_1.BigIntBase {
    static from(value) {
        return base_1.BigIntFactory.bind(this)(value, true, 128);
    }
    toBigNumber(value) {
        return Int128.from(value);
    }
}
Int128.MAX = limit_1.maxSigned[128];
Int128.MIN = limit_1.minSigned[128];
exports.default = Int128;
//# sourceMappingURL=int128.js.map