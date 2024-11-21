"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
const limit_1 = require("../base/limit");
class Uint16 extends base_1.BigIntBase {
    static from(value) {
        return base_1.BigIntFactory.bind(this)(value, false, 16);
    }
    toBigNumber(value) {
        return Uint16.from(value);
    }
}
Uint16.MAX = limit_1.maxUnsigned[16];
Uint16.MIN = '0';
exports.default = Uint16;
//# sourceMappingURL=uint16.js.map