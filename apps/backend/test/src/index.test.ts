import { createApp } from '../../src/app';

jest.mock('dotenv/config', () => ({}));
jest.mock('../../src/app');
jest.mock('../../src/services/reminder-scheduler.service', () => ({
  ReminderSchedulerService: { start: jest.fn(), stop: jest.fn() },
}));
jest.mock('../../src/services/recommendation-notification.service', () => ({
  RecommendationNotificationService: { start: jest.fn(), stop: jest.fn() },
}));
jest.mock('../../src/services/engagement-optimizer.service', () => ({
  EngagementOptimizerService: { start: jest.fn(), stop: jest.fn() },
}));

const mockedCreateApp = createApp as jest.Mock;

describe('Server (index.ts)', () => {
  let listenMock: jest.Mock;

  beforeEach(() => {
    listenMock = jest.fn((_port: any, callback?: () => void) => {
      if (callback) callback();
      return {} as any;
    });
    mockedCreateApp.mockReturnValue({ listen: listenMock });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('port configuration', () => {
    it('should start the server on the PORT specified in the environment', () => {
      const savedPort = process.env.PORT;
      process.env.PORT = '4000';
      process.env.NODE_ENV = 'test';

      jest.isolateModules(() => {
        require('../../src/index');
      });

      expect(mockedCreateApp).toHaveBeenCalled();
      expect(listenMock).toHaveBeenCalledWith('4000', expect.any(Function));

      if (savedPort !== undefined) {
        process.env.PORT = savedPort;
      } else {
        delete process.env.PORT;
      }
    });

    it('should default to port 3000 when PORT env var is not set', () => {
      const savedPort = process.env.PORT;
      delete process.env.PORT;
      process.env.NODE_ENV = 'test';

      jest.isolateModules(() => {
        require('../../src/index');
      });

      expect(listenMock).toHaveBeenCalledWith(3000, expect.any(Function));

      if (savedPort !== undefined) process.env.PORT = savedPort;
    });
  });

  describe('scheduler startup', () => {
    it('should start both schedulers when NODE_ENV is not "test"', () => {
      const { ReminderSchedulerService } = jest.requireMock(
        '../../src/services/reminder-scheduler.service',
      );
      const { RecommendationNotificationService } = jest.requireMock(
        '../../src/services/recommendation-notification.service',
      );
      const { EngagementOptimizerService } = jest.requireMock(
        '../../src/services/engagement-optimizer.service',
      );

      jest.isolateModules(() => {
        process.env.NODE_ENV = 'production';
        process.env.PORT = '3000';
        require('../../src/index');
      });

      expect(ReminderSchedulerService.start).toHaveBeenCalledWith(
        expect.objectContaining({ cronExpression: '* * * * *' }),
      );
      expect(RecommendationNotificationService.start).toHaveBeenCalledWith(
        expect.objectContaining({ cronExpression: '0 * * * *' }),
      );
      expect(EngagementOptimizerService.start).toHaveBeenCalledWith(
        expect.objectContaining({ cronExpression: '0 3 * * *' }),
      );
    });

    it('should NOT start schedulers when NODE_ENV is "test"', () => {
      const { ReminderSchedulerService } = jest.requireMock(
        '../../src/services/reminder-scheduler.service',
      );
      const { RecommendationNotificationService } = jest.requireMock(
        '../../src/services/recommendation-notification.service',
      );
      const { EngagementOptimizerService } = jest.requireMock(
        '../../src/services/engagement-optimizer.service',
      );

      jest.isolateModules(() => {
        process.env.NODE_ENV = 'test';
        process.env.PORT = '3000';
        require('../../src/index');
      });

      expect(ReminderSchedulerService.start).not.toHaveBeenCalled();
      expect(RecommendationNotificationService.start).not.toHaveBeenCalled();
      expect(EngagementOptimizerService.start).not.toHaveBeenCalled();
    });
  });

  describe('signal handlers', () => {
    it('should log and exit with code 0 on SIGTERM', () => {
      const processOnSpy = jest.spyOn(process, 'on');
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      jest.isolateModules(() => {
        process.env.NODE_ENV = 'test';
        require('../../src/index');
      });

      const sigtermCall = processOnSpy.mock.calls.find((c) => c[0] === 'SIGTERM');
      expect(sigtermCall).toBeDefined();
      (sigtermCall![1] as () => void)();

      expect(consoleSpy).toHaveBeenCalledWith('SIGTERM received, shutting down gracefully');
      expect(exitSpy).toHaveBeenCalledWith(0);

      processOnSpy.mockRestore();
      exitSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('should log and exit with code 0 on SIGINT', () => {
      const processOnSpy = jest.spyOn(process, 'on');
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      jest.isolateModules(() => {
        process.env.NODE_ENV = 'test';
        require('../../src/index');
      });

      const sigintCall = processOnSpy.mock.calls.find((c) => c[0] === 'SIGINT');
      expect(sigintCall).toBeDefined();
      (sigintCall![1] as () => void)();

      expect(consoleSpy).toHaveBeenCalledWith('SIGINT received, shutting down gracefully');
      expect(exitSpy).toHaveBeenCalledWith(0);

      processOnSpy.mockRestore();
      exitSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
});
