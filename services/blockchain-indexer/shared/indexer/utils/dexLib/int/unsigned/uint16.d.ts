import { BigIntAble, BigIntBase } from '../base';
export type Uint16String = string;
export default class Uint16 extends BigIntBase {
    static from(value: BigIntAble): Uint16;
    protected toBigNumber(value: bigint): this;
    static MAX: string;
    static MIN: string;
}
