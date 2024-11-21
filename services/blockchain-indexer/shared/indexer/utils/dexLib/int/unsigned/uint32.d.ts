import { BigIntAble, BigIntBase } from '../base';
export type Uint32String = string;
export default class Uint32 extends BigIntBase {
    static from(value: BigIntAble): Uint32;
    protected toBigNumber(value: bigint): this;
    static MAX: string;
    static MIN: string;
}
