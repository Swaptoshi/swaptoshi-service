"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
const limit_1 = require("../base/limit");
class Uint8 extends base_1.BigIntBase {
    static from(value) {
        return base_1.BigIntFactory.bind(this)(value, false, 8);
    }
    toBigNumber(value) {
        return Uint8.from(value);
    }
}
Uint8.MAX = limit_1.maxUnsigned[8];
Uint8.MIN = '0';
exports.default = Uint8;
//# sourceMappingURL=uint8.js.map