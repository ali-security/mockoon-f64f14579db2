import { test } from '@oclif/test';
import axios from 'axios';
import { expect } from 'chai';

// keep the file content as-is: axios would otherwise deserialize the JSON files
// served by the mock and the assertions below compare raw strings
const rawResponse = { transformResponse: [(data: string) => data] };

describe('File serving', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/envs/file.json'])
    .do(async () => {
      // static path: escaping the environment directory is still authorized as
      // the path cannot be influenced by the request
      const staticPath = await axios.get(
        'http://localhost:3000/file',
        rawResponse
      );

      expect(staticPath.data).to.contain('filecontent');

      // templated path staying in the environment directory is authorized
      const sameFolderPath = await axios.get(
        'http://localhost:3000/param1/mock1.json',
        rawResponse
      );

      expect(sameFolderPath.data).to.contain('"name": "mock1"');

      // templated path escaping the environment directory is rejected
      const traversalPath = await axios.get(
        'http://localhost:3000/param2/file1',
        rawResponse
      );

      expect(traversalPath.data).to.contain(
        'Error while serving the content: Access to relative path outside of the environment base directory'
      );
      expect(traversalPath.data).to.not.contain('filecontent');
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start mock on port 3000, serve files with a relative path and prevent path traversal through templating helpers',
      (context) => {
        expect(context.stdout).to.contain('Server started');
      }
    );
});
