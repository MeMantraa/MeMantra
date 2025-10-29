import { createApp } from '../../src/app';

jest.mock('../../src/app');
const mockedCreateApp = createApp as jest.Mock;

describe('Server', () => {
  let listenMock: jest.Mock;

  beforeEach(() => {
    listenMock = jest.fn((_port: number, callback?: () => void) => {
      if (callback) callback();
      return {} as any;
    });

    mockedCreateApp.mockReturnValue({
      listen: listenMock,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should start the server on the specified PORT', () => {
    jest.isolateModules(() => {
      process.env.PORT = '4000';
      require('../../src/index');
    });

    expect(mockedCreateApp).toHaveBeenCalled();
    expect(listenMock).toHaveBeenCalledWith(
      '4000',
      expect.any(Function)
    );
  });

  it('should use default PORT if not set', () => {
    jest.isolateModules(() => {
      delete process.env.PORT;
      require('../../src/index');
    });

    expect(listenMock).toHaveBeenCalledWith(
      '3000',
      expect.any(Function)
    );
  });

});

