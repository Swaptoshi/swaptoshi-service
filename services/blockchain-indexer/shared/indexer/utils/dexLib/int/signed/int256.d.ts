import { BigIntAble, BigIntBase } from '../base';
export type Int256String = string;
export default class Int256 extends BigIntBase {
    static from(value: BigIntAble): Int256;
    protected toBigNumber(value: bigint): this;
    static MAX: string;
    static MIN: string;
}
