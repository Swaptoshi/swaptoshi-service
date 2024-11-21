import { BigIntAble, BigIntBase } from '../base';
export type Uint80String = string;
export default class Uint80 extends BigIntBase {
    static from(value: BigIntAble): Uint80;
    protected toBigNumber(value: bigint): this;
    static MAX: string;
    static MIN: string;
}
