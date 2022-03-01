export { default as AttributeMap } from './AttributeMap';
export { default as Delta } from './Delta';
export { default as Op, OpIterator } from './Op';

import rfdc from 'rfdc';
import isEqual from 'fast-deep-equal';
import diff from 'fast-diff';

const cloneDeep = rfdc();
export { cloneDeep, isEqual, diff };
