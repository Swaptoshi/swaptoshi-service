import { BigIntAble, BigIntBase } from '../base';
export type Uint160String = string;
export default class Uint160 extends BigIntBase {
    static from(value: BigIntAble): Uint160;
    protected toBigNumber(value: bigint): this;
    static MAX: string;
    static MIN: string;
}
