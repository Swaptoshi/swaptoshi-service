import { BigIntAble, BigIntBase } from '../base';
export type Uint176String = string;
export default class Uint176 extends BigIntBase {
    static from(value: BigIntAble): Uint176;
    protected toBigNumber(value: bigint): this;
    static MAX: string;
    static MIN: string;
}
