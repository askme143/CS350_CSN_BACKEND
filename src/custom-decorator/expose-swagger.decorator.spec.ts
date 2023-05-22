import { instanceToPlain } from 'class-transformer';
import { ExposeApi } from './expose-swagger.decorator';

const exposeName = 'test';
class Test {
  @ExposeApi(exposeName)
  testProp: string;
}

describe('ExposeApi', () => {
  it('should have metadata', () => {
    expect(
      Reflect.getMetadata('swagger/apiModelPropertiesArray', new Test()),
    ).toEqual([':testProp']);
  });
  it('should be converted to expected plain object', () => {
    const test = new Test();
    test.testProp = '1';
    expect(instanceToPlain(test)).toHaveProperty('test');
    expect(instanceToPlain(test)['test']).toEqual('1');
  });
});
