"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
const limit_1 = require("../base/limit");
class Uint32 extends base_1.BigIntBase {
    static from(value) {
        return base_1.BigIntFactory.bind(this)(value, false, 32);
    }
    toBigNumber(value) {
        return Uint32.from(value);
    }
}
Uint32.MAX = limit_1.maxUnsigned[32];
Uint32.MIN = '0';
exports.default = Uint32;
//# sourceMappingURL=uint32.js.map