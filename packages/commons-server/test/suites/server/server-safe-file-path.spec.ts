import { Environment } from '@mockoon/commons';
import { expect } from 'chai';
import { Request } from 'express';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { MockoonServer } from '../../../src';

const environmentDirectory = resolve('./test/data/environments');

const relativeError =
  'Access to relative path outside of the environment base directory';
const absoluteError =
  'Access to absolute path outside of the original static base directory';

describe('Safe file path resolution', () => {
  let server: MockoonServer;

  const getSafeFilePath = (filePath: string, request?: Request): string =>
    (server as any).getSafeFilePath(filePath, request);

  before(async () => {
    const environmentJson = await fs.readFile(
      `${environmentDirectory}/test-env.json`,
      'utf-8'
    );
    const environment = JSON.parse(environmentJson) as Environment;

    server = new MockoonServer(environment, { environmentDirectory });
  });

  it('should allow a static path escaping the env directory', () => {
    expect(getSafeFilePath('../test.data')).to.equal(
      resolve(environmentDirectory, '../test.data')
    );
  });

  it('should allow a static absolute path', () => {
    const filePath = resolve(environmentDirectory, '../test.data');

    expect(getSafeFilePath(filePath)).to.equal(filePath);
  });

  it('should allow a templated path in the env directory', () => {
    const request = {
      params: { filename: 'test-env.json' }
    } as unknown as Request;

    expect(getSafeFilePath("./{{urlParam 'filename'}}", request)).to.equal(
      resolve(environmentDirectory, 'test-env.json')
    );
  });

  it('should reject a templated path escaping the env directory', () => {
    const request = {
      params: { filename: '../../../../../../etc/passwd' }
    } as unknown as Request;
    const call = () => getSafeFilePath("./{{urlParam 'filename'}}", request);

    expect(call).to.throw(relativeError);
  });

  it('should reject a templated path escaping through a prefix', () => {
    const request = {
      params: { filename: 'environments-secret/secret.json' }
    } as unknown as Request;
    const call = () => getSafeFilePath("../{{urlParam 'filename'}}", request);

    expect(call).to.throw(relativeError);
  });

  it('should reject a templated path escaping a static folder', () => {
    const request = {
      params: { filename: '../../../../../../etc/passwd' }
    } as unknown as Request;
    const filePath = "../body-files/{{urlParam 'filename'}}";
    const call = () => getSafeFilePath(filePath, request);

    expect(call).to.throw(relativeError);
  });

  it('should allow a templated absolute path inside its base', () => {
    const filePath = `${environmentDirectory}/{{urlParam 'filename'}}`;
    const request = {
      params: { filename: 'test-env.json' }
    } as unknown as Request;

    expect(getSafeFilePath(filePath, request)).to.equal(
      resolve(environmentDirectory, 'test-env.json')
    );
  });

  it('should reject a templated absolute path escaping its base', () => {
    const filePath = `${environmentDirectory}/{{urlParam 'filename'}}`;
    const request = {
      params: { filename: '../../../../../../etc/passwd' }
    } as unknown as Request;
    const call = () => getSafeFilePath(filePath, request);

    expect(call).to.throw(absoluteError);
  });

  it('should reject a templated path built from a query param', () => {
    const request = {
      query: { filename: '../../../../../../etc/passwd' }
    } as unknown as Request;
    const filePath = "./{{queryParam 'filename'}}";
    const call = () => getSafeFilePath(filePath, request);

    expect(call).to.throw(relativeError);
  });
});
