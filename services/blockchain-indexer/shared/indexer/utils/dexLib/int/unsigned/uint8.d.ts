import { BigIntAble, BigIntBase } from '../base';
export type Uint8String = string;
export default class Uint8 extends BigIntBase {
    static from(value: BigIntAble): Uint8;
    protected toBigNumber(value: bigint): this;
    static MAX: string;
    static MIN: string;
}
