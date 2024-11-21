"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
const limit_1 = require("../base/limit");
class Uint176 extends base_1.BigIntBase {
    static from(value) {
        return base_1.BigIntFactory.bind(this)(value, false, 176);
    }
    toBigNumber(value) {
        return Uint176.from(value);
    }
}
Uint176.MAX = limit_1.maxUnsigned[176];
Uint176.MIN = '0';
exports.default = Uint176;
//# sourceMappingURL=uint176.js.map