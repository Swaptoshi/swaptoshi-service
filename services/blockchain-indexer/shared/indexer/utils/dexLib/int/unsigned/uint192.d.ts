import { BigIntAble, BigIntBase } from '../base';
export type Uint192String = string;
export default class Uint192 extends BigIntBase {
    static from(value: BigIntAble): Uint192;
    protected toBigNumber(value: bigint): this;
    static MAX: string;
    static MIN: string;
}
