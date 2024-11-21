import { BigIntAble, BigIntBase } from '../base';
export type Int24String = string;
export default class Int24 extends BigIntBase {
    static from(value: BigIntAble): Int24;
    protected toBigNumber(value: bigint): this;
    static MAX: string;
    static MIN: string;
}
