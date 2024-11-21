"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
const limit_1 = require("../base/limit");
class Uint80 extends base_1.BigIntBase {
    static from(value) {
        return base_1.BigIntFactory.bind(this)(value, false, 80);
    }
    toBigNumber(value) {
        return Uint80.from(value);
    }
}
Uint80.MAX = limit_1.maxUnsigned[80];
Uint80.MIN = '0';
exports.default = Uint80;
//# sourceMappingURL=uint80.js.map