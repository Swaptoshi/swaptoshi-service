"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
const limit_1 = require("../base/limit");
class Uint160 extends base_1.BigIntBase {
    static from(value) {
        return base_1.BigIntFactory.bind(this)(value, false, 160);
    }
    toBigNumber(value) {
        return Uint160.from(value);
    }
}
Uint160.MAX = limit_1.maxUnsigned[160];
Uint160.MIN = '0';
exports.default = Uint160;
//# sourceMappingURL=uint160.js.map