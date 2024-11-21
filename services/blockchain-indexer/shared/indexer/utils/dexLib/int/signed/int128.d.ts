import { BigIntAble, BigIntBase } from '../base';
export type Int128String = string;
export default class Int128 extends BigIntBase {
    static from(value: BigIntAble): Int128;
    protected toBigNumber(value: bigint): this;
    static MAX: string;
    static MIN: string;
}
