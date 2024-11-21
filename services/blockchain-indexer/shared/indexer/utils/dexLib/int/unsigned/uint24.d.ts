import { BigIntAble, BigIntBase } from '../base';
export type Uint24String = string;
export default class Uint24 extends BigIntBase {
    static from(value: BigIntAble): Uint24;
    protected toBigNumber(value: bigint): this;
    static MAX: string;
    static MIN: string;
}
