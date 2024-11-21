import { BigIntAble, BigIntBase } from '../base';
export type Int16String = string;
export default class Int16 extends BigIntBase {
    static from(value: BigIntAble): Int16;
    protected toBigNumber(value: bigint): this;
    static MAX: string;
    static MIN: string;
}
