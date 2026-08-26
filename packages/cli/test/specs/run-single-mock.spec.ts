import { test } from '@oclif/test';
import axios from 'axios';
import { expect } from 'chai';

// Skipped on Windows: every spec tears its server down with process.emit(
// 'SIGINT'), and the handlers of all the earlier specs stay registered (mocha
// reports 11 SIGINT listeners by the time it reaches this, the last suite). On
// win32 the resulting late teardown lands after this test settled and mocha
// aborts the run with ERR_MOCHA_MULTIPLE_DONE. The Linux and macOS legs cover
// it; the same start command is covered on Windows by the suites above.
const describeSingleMock =
  process.platform === 'win32' ? describe.skip : describe;

describeSingleMock('Run single mock', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/envs/mock1.json'])
    .do(async () => {
      const result = await axios.get('http://localhost:3000/api/test');

      expect(result.data).to.contain('mock-content-1');
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it('should start mock on port 3000 and call GET /api/test', (context) => {
      expect(context.stdout).to.contain('Server started');
      expect(context.stdout).to.contain('"environmentName":"mock1"');
    });
});

// Skipped: this test downloads samples/generate-mock-data.json from the live
// mockoon/mock-samples main branch. That sample has since been re-saved with a
// newer environment schema, so the 4.1.0 CLI rejects it ("data are too recent").
// The local-file variant above covers the same start command.
describe.skip('Run single mock from URL', () => {
  test
    .stdout()
    .command([
      'start',
      '--data',
      'https://raw.githubusercontent.com/mockoon/mock-samples/main/samples/generate-mock-data.json',
      '--port',
      '3000'
    ])
    .do(async () => {
      const result = await axios.get('http://localhost:3000/posts');
      expect(result.status).to.equal(200);
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start mock on port 3000 and call GET /posts endpoint',
      (context) => {
        expect(context.stdout).to.contain('Server started');
        expect(context.stdout).to.contain(
          '"environmentName":"Tutorial - Generate mock data"'
        );
      }
    );
});
