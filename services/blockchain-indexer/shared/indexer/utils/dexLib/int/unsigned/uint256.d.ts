import { BigIntAble, BigIntBase } from '../base';
export type Uint256String = string;
export default class Uint256 extends BigIntBase {
    static from(value: BigIntAble): Uint256;
    protected toBigNumber(value: bigint): this;
    static MAX: string;
    static MIN: string;
}
