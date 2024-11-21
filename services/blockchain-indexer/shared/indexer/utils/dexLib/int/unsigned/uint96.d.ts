import { BigIntAble, BigIntBase } from '../base';
export type Uint96String = string;
export default class Uint96 extends BigIntBase {
    static from(value: BigIntAble): Uint96;
    protected toBigNumber(value: bigint): this;
    static MAX: string;
    static MIN: string;
}
