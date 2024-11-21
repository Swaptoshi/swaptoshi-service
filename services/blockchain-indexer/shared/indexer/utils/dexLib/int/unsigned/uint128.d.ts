import { BigIntAble, BigIntBase } from '../base';
export type Uint128String = string;
export default class Uint128 extends BigIntBase {
    static from(value: BigIntAble): Uint128;
    protected toBigNumber(value: bigint): this;
    static MAX: string;
    static MIN: string;
}
