jest.mock('../../src/app', () => ({

  createApp: jest.fn(),

}));

import { createApp } from '../../src/app';

describe('Server initialization', () => {

  it("when PORT is set in environment, it should start server on that port", () => {

    const mockListen = jest.fn((_port, callback) => {

      if (callback) callback();

    });

    const mockApp = {

      listen: mockListen,
      
    } as any;

    (createApp as jest.Mock).mockReturnValue(mockApp);

    process.env.PORT = '4000';

    require('../../src/index');

    expect(mockListen).toHaveBeenCalledWith('4000', expect.any(Function));

  });

});