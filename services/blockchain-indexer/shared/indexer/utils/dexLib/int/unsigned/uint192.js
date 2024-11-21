"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
const limit_1 = require("../base/limit");
class Uint192 extends base_1.BigIntBase {
    static from(value) {
        return base_1.BigIntFactory.bind(this)(value, false, 192);
    }
    toBigNumber(value) {
        return Uint192.from(value);
    }
}
Uint192.MAX = limit_1.maxUnsigned[192];
Uint192.MIN = '0';
exports.default = Uint192;
//# sourceMappingURL=uint192.js.map