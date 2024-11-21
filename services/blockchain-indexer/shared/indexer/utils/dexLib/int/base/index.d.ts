export type BigIntAble = BigIntBase | string | number | bigint;
export type BigNumberish = BigIntBase | bigint | string | number;
export declare const _constructorGuard: {};
export declare function BigIntFactory<T extends BigIntBase>(this: typeof BigIntBase, value: BigIntAble, signed: boolean, bitSize: number): T;
export declare class BigIntBase {
    constructor(constructorGuard: unknown, value: bigint, signed: boolean, bitSize: number);
    static from(value: BigIntAble): BigIntBase;
    abs(): this;
    add(other: BigNumberish): this;
    sub(other: BigNumberish): this;
    div(other: BigNumberish): this;
    mul(other: BigNumberish): this;
    mod(other: BigNumberish): this;
    pow(other: BigNumberish): this;
    and(other: BigNumberish): this;
    not(): this;
    or(other: BigNumberish): this;
    xor(other: BigNumberish): this;
    shl(value: BigNumberish): this;
    shr(value: BigNumberish): this;
    eq(other: BigNumberish): boolean;
    neq(other: BigNumberish): boolean;
    lt(other: BigNumberish): boolean;
    lte(other: BigNumberish): boolean;
    gt(other: BigNumberish): boolean;
    gte(other: BigNumberish): boolean;
    isNegative(): boolean;
    isZero(): boolean;
    toNumber(): number;
    toBigInt(): bigint;
    toString(): string;
    toHexString(): string;
    toJSON(): Record<'type' | 'hex', string>;
    protected toBigNumber(value: bigint): this;
    private setup;
    private hof;
    static MAX: string;
    static MIN: string;
    private name;
    private max;
    private min;
    readonly _value: bigint;
}
