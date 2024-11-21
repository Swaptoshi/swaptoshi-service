"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
const limit_1 = require("../base/limit");
class Uint96 extends base_1.BigIntBase {
    static from(value) {
        return base_1.BigIntFactory.bind(this)(value, false, 96);
    }
    toBigNumber(value) {
        return Uint96.from(value);
    }
}
Uint96.MAX = limit_1.maxUnsigned[96];
Uint96.MIN = '0';
exports.default = Uint96;
//# sourceMappingURL=uint96.js.map