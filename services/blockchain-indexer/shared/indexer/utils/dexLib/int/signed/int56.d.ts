import { BigIntAble, BigIntBase } from '../base';
export type Int56String = string;
export default class Int56 extends BigIntBase {
    static from(value: BigIntAble): Int56;
    protected toBigNumber(value: bigint): this;
    static MAX: string;
    static MIN: string;
}
