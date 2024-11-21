"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
const limit_1 = require("../base/limit");
class Uint24 extends base_1.BigIntBase {
    static from(value) {
        return base_1.BigIntFactory.bind(this)(value, false, 24);
    }
    toBigNumber(value) {
        return Uint24.from(value);
    }
}
Uint24.MAX = limit_1.maxUnsigned[24];
Uint24.MIN = '0';
exports.default = Uint24;
//# sourceMappingURL=uint24.js.map