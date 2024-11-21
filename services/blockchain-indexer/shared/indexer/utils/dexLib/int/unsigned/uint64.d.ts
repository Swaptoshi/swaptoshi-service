import { BigIntAble, BigIntBase } from '../base';
export type Uint64String = string;
export default class Uint64 extends BigIntBase {
    static from(value: BigIntAble): Uint64;
    protected toBigNumber(value: bigint): this;
    static MAX: string;
    static MIN: string;
}
