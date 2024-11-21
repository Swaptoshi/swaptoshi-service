import { BigIntAble, BigIntBase } from '../base';
export type Int8String = string;
export default class Int8 extends BigIntBase {
    static from(value: BigIntAble): Int8;
    protected toBigNumber(value: bigint): this;
    static MAX: string;
    static MIN: string;
}
