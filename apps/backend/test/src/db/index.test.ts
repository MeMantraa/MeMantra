import { db } from '../../../src/db/index'
import { Kysely } from 'kysely';

describe('db', () => {

  it('should export a Kysely instance', () => {

    expect(db).toBeInstanceOf(Kysely);

  });
  
});

