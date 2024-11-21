"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
const limit_1 = require("../base/limit");
class Uint64 extends base_1.BigIntBase {
    static from(value) {
        return base_1.BigIntFactory.bind(this)(value, false, 64);
    }
    toBigNumber(value) {
        return Uint64.from(value);
    }
}
Uint64.MAX = limit_1.maxUnsigned[64];
Uint64.MIN = '0';
exports.default = Uint64;
//# sourceMappingURL=uint64.js.map