import * as crypto from 'node:crypto';

export const hash = (key) => parseInt(crypto.createHash('sha1').update(key).digest('hex'), 16);
