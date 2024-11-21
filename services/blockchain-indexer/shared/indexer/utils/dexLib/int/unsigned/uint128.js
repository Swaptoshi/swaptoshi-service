"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
const limit_1 = require("../base/limit");
class Uint128 extends base_1.BigIntBase {
    static from(value) {
        return base_1.BigIntFactory.bind(this)(value, false, 128);
    }
    toBigNumber(value) {
        return Uint128.from(value);
    }
}
Uint128.MAX = limit_1.maxUnsigned[128];
Uint128.MIN = '0';
exports.default = Uint128;
//# sourceMappingURL=uint128.js.map