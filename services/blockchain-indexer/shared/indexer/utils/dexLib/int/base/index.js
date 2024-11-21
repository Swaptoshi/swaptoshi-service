"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BigIntBase = exports.BigIntFactory = exports._constructorGuard = void 0;
const limit_1 = require("./limit");
const _warnedToUnboundBitwise = false;
exports._constructorGuard = {};
function BigIntFactory(value, signed, bitSize) {
    if (value instanceof this) {
        return value;
    }
    if (value._value !== undefined) {
        return new this(exports._constructorGuard, value._value, signed, bitSize);
    }
    return new this(exports._constructorGuard, BigInt(value), signed, bitSize);
}
exports.BigIntFactory = BigIntFactory;
class BigIntBase {
    constructor(constructorGuard, value, signed, bitSize) {
        this.name = '';
        this.max = '';
        this.min = '';
        if (constructorGuard !== exports._constructorGuard) {
            throw new Error(`cannot call constructor directly`);
        }
        this._value = value;
        this.setup(signed, bitSize);
        if (this.max !== '' && this._value > BigInt(this.max)) {
            throw new Error(`value ${this.toString()} exceeds ${this.name} maximum value of ${this.max}`);
        }
        if (this.min !== '' && this._value < BigInt(this.min)) {
            throw new Error(`value ${this.toString()} exceeds ${this.name} minimum value of ${this.min}`);
        }
        Object.freeze(this);
    }
    static from(value) {
        return BigIntFactory.bind(this)(value, false, 0);
    }
    abs() {
        if (this._value < BigInt(0)) {
            return this.toBigNumber(this._value * BigInt(-1));
        }
        return this;
    }
    add(other) {
        return this.toBigNumber(this.hof(this._value + BigInt(other.toString())));
    }
    sub(other) {
        return this.toBigNumber(this.hof(this._value - BigInt(other.toString())));
    }
    div(other) {
        const o = BigInt(other.toString());
        if (o === BigInt(0)) {
            throw new Error('div: division-by-zero');
        }
        return this.toBigNumber(this.hof(this._value / o));
    }
    mul(other) {
        return this.toBigNumber(this.hof(this._value * BigInt(other.toString())));
    }
    mod(other) {
        const value = BigInt(other.toString());
        if (value === BigInt(0)) {
            throw new Error('mod: division-by-zero');
        }
        return this.toBigNumber(this.hof(((this._value % value) + value) % value));
    }
    pow(other) {
        const value = BigInt(other.toString());
        if (value < BigInt(0)) {
            throw new Error('pow: negative-power');
        }
        return this.toBigNumber(this.hof(this._value ** value));
    }
    and(other) {
        const value = BigInt(other.toString());
        if (_warnedToUnboundBitwise && (this.isNegative() || value < BigInt(0))) {
            console.warn(`unbound-bitwise-result (and): negative value`);
        }
        return this.toBigNumber(this.hof(this._value & value));
    }
    not() {
        return this.toBigNumber(this.hof(~this._value));
    }
    or(other) {
        const value = BigInt(other.toString());
        if (_warnedToUnboundBitwise && (this.isNegative() || value < BigInt(0))) {
            console.warn(`unbound-bitwise-result (or): negative value`);
        }
        return this.toBigNumber(this.hof(this._value | value));
    }
    xor(other) {
        const value = BigInt(other.toString());
        if (_warnedToUnboundBitwise && (this.isNegative() || value < BigInt(0))) {
            console.warn(`unbound-bitwise-result (xor): negative value`);
        }
        return this.toBigNumber(this.hof(this._value ^ value));
    }
    shl(value) {
        return this.toBigNumber(this.hof(this._value << BigInt(value.toString())));
    }
    shr(value) {
        return this.toBigNumber(this.hof(this._value >> BigInt(value.toString())));
    }
    eq(other) {
        return this._value === BigInt(other.toString());
    }
    neq(other) {
        return this._value !== BigInt(other.toString());
    }
    lt(other) {
        return this._value < BigInt(other.toString());
    }
    lte(other) {
        return this._value <= BigInt(other.toString());
    }
    gt(other) {
        return this._value > BigInt(other.toString());
    }
    gte(other) {
        return this._value >= BigInt(other.toString());
    }
    isNegative() {
        return this._value < BigInt(0);
    }
    isZero() {
        return this._value === BigInt(0);
    }
    toNumber() {
        try {
            return Number(this._value);
        }
        catch (error) {
            throw new Error('toNumber: overflow');
        }
    }
    toBigInt() {
        return this._value;
    }
    toString() {
        return this._value.toString(10);
    }
    toHexString() {
        return this.isNegative() ? this._value.toString(16).replace('-', '-0x') : `0x${this._value.toString(16)}`;
    }
    toJSON() {
        return { type: 'BigNumber', hex: this.toHexString() };
    }
    toBigNumber(value) {
        return BigIntBase.from(value);
    }
    setup(signed, bitSize) {
        let className = signed ? 'Int' : 'Uint';
        className = bitSize > 0 ? `${className}${bitSize}` : className;
        if (bitSize > 0) {
            this.name = `${signed ? '' : 'u'}int${bitSize}`;
            this.max = (signed ? limit_1.maxSigned[bitSize] : limit_1.maxUnsigned[bitSize]);
            this.min = (signed ? limit_1.minSigned[bitSize] : '0');
        }
    }
    hof(value) {
        if (this.max === '' || this.min === '')
            return value;
        let result = value;
        if (value < BigInt(this.min) || value > BigInt(this.max)) {
            const range = BigInt(this.max) - BigInt(this.min) + BigInt(1);
            result = ((((value - BigInt(this.min)) % range) + range) % range) + BigInt(this.min);
        }
        return result;
    }
}
BigIntBase.MAX = 'Infinity';
BigIntBase.MIN = 'Infinity';
exports.BigIntBase = BigIntBase;
//# sourceMappingURL=index.js.map