"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
const limit_1 = require("../base/limit");
class Int56 extends base_1.BigIntBase {
    static from(value) {
        return base_1.BigIntFactory.bind(this)(value, true, 56);
    }
    toBigNumber(value) {
        return Int56.from(value);
    }
}
Int56.MAX = limit_1.maxSigned[56];
Int56.MIN = limit_1.minSigned[56];
exports.default = Int56;
//# sourceMappingURL=int56.js.map