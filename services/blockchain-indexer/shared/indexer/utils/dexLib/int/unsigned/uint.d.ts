import { BigIntAble, BigIntBase } from '../base';
export type UintString = string;
export default class Uint extends BigIntBase {
    static from(value: BigIntAble): Uint;
    protected toBigNumber(value: bigint): this;
}
