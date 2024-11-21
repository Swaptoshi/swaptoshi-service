"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
const limit_1 = require("../base/limit");
class Uint256 extends base_1.BigIntBase {
    static from(value) {
        return base_1.BigIntFactory.bind(this)(value, false, 256);
    }
    toBigNumber(value) {
        return Uint256.from(value);
    }
}
Uint256.MAX = limit_1.maxUnsigned[256];
Uint256.MIN = '0';
exports.default = Uint256;
//# sourceMappingURL=uint256.js.map