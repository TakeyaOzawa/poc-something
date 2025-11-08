/**
 * Test: MockLogger
 * 
 * カバレッジ目標: 90%以上
 * テスト対象: テストヘルパーのMockLoggerファクトリー関数
 */

import { createMockLogger, createSpyLogger } from '../MockLogger';
import { Logger } from '@domain/types/logger.types';

describe('MockLogger', () => {
  describe('createMockLogger', () => {
    let mockLogger: jest.Mocked<Logger>;

    beforeEach(() => {
      mockLogger = createMockLogger();
    });

    it('Loggerインターフェースのすべてのメソッドがモック関数として作成されること', () => {
      expect(jest.isMockFunction(mockLogger.debug)).toBe(true);
      expect(jest.isMockFunction(mockLogger.info)).toBe(true);
      expect(jest.isMockFunction(mockLogger.warn)).toBe(true);
      expect(jest.isMockFunction(mockLogger.error)).toBe(true);
      expect(jest.isMockFunction(mockLogger.createChild)).toBe(true);
      expect(jest.isMockFunction(mockLogger.setLevel)).toBe(true);
      expect(jest.isMockFunction(mockLogger.getLevel)).toBe(true);
    });

    it('debug()メソッドが正常に呼び出し可能であること', () => {
      mockLogger.debug('Debug message');
      
      expect(mockLogger.debug).toHaveBeenCalledWith('Debug message');
      expect(mockLogger.debug).toHaveBeenCalledTimes(1);
    });

    it('info()メソッドが正常に呼び出し可能であること', () => {
      mockLogger.info('Info message');
      
      expect(mockLogger.info).toHaveBeenCalledWith('Info message');
      expect(mockLogger.info).toHaveBeenCalledTimes(1);
    });

    it('warn()メソッドが正常に呼び出し可能であること', () => {
      mockLogger.warn('Warning message');
      
      expect(mockLogger.warn).toHaveBeenCalledWith('Warning message');
      expect(mockLogger.warn).toHaveBeenCalledTimes(1);
    });

    it('error()メソッドが正常に呼び出し可能であること', () => {
      mockLogger.error('Error message');
      
      expect(mockLogger.error).toHaveBeenCalledWith('Error message');
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });

    it('createChild()メソッドが自身を返すこと', () => {
      const child = mockLogger.createChild('child-context');
      
      expect(child).toBe(mockLogger);
      expect(mockLogger.createChild).toHaveBeenCalledWith('child-context');
    });

    it('setLevel()メソッドが正常に呼び出し可能であること', () => {
      mockLogger.setLevel(2);
      
      expect(mockLogger.setLevel).toHaveBeenCalledWith(2);
      expect(mockLogger.setLevel).toHaveBeenCalledTimes(1);
    });

    it('getLevel()メソッドがデフォルトで1（INFO level）を返すこと', () => {
      const level = mockLogger.getLevel();
      
      expect(level).toBe(1);
      expect(mockLogger.getLevel).toHaveBeenCalledTimes(1);
    });

    it('複数のメソッドを連続して呼び出せること', () => {
      mockLogger.debug('Debug');
      mockLogger.info('Info');
      mockLogger.warn('Warning');
      mockLogger.error('Error');
      
      expect(mockLogger.debug).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });

    it('同じメソッドを複数回呼び出した場合、呼び出し回数が正しく記録されること', () => {
      mockLogger.info('First call');
      mockLogger.info('Second call');
      mockLogger.info('Third call');
      
      expect(mockLogger.info).toHaveBeenCalledTimes(3);
      expect(mockLogger.info).toHaveBeenNthCalledWith(1, 'First call');
      expect(mockLogger.info).toHaveBeenNthCalledWith(2, 'Second call');
      expect(mockLogger.info).toHaveBeenNthCalledWith(3, 'Third call');
    });

    it('メソッドの引数が正確に記録されること', () => {
      const errorObject = new Error('Test error');
      const contextData = { userId: 123, action: 'login' };
      
      mockLogger.error('Error occurred', errorObject, contextData);
      
      expect(mockLogger.error).toHaveBeenCalledWith('Error occurred', errorObject, contextData);
    });
  });

  describe('createSpyLogger', () => {
    it('createMockLoggerと同じ機能を提供すること', () => {
      const spyLogger = createSpyLogger();
      
      expect(jest.isMockFunction(spyLogger.debug)).toBe(true);
      expect(jest.isMockFunction(spyLogger.info)).toBe(true);
      expect(jest.isMockFunction(spyLogger.warn)).toBe(true);
      expect(jest.isMockFunction(spyLogger.error)).toBe(true);
      expect(jest.isMockFunction(spyLogger.createChild)).toBe(true);
      expect(jest.isMockFunction(spyLogger.setLevel)).toBe(true);
      expect(jest.isMockFunction(spyLogger.getLevel)).toBe(true);
    });

    it('createMockLoggerのエイリアスとして動作すること', () => {
      const mockLogger = createMockLogger();
      const spyLogger = createSpyLogger();
      
      // 両方とも同じ構造を持つことを確認
      expect(Object.keys(mockLogger)).toEqual(Object.keys(spyLogger));
      
      // 両方ともgetLevel()でデフォルト値1を返すことを確認
      expect(mockLogger.getLevel()).toBe(1);
      expect(spyLogger.getLevel()).toBe(1);
    });

    it('スパイ機能が正常に動作すること', () => {
      const spyLogger = createSpyLogger();
      
      spyLogger.debug('Debug message');
      spyLogger.info('Info message');
      
      expect(spyLogger.debug).toHaveBeenNthCalledWith(1, 'Debug message');
      expect(spyLogger.info).toHaveBeenCalledTimes(1);
    });
  });

  describe('実用的なテストシナリオ', () => {
    it('テストでのモック検証パターンが正常に動作すること', () => {
      const mockLogger = createMockLogger();
      
      // 実際のサービスクラスのような使用方法をシミュレート
      function processUser(logger: Logger, userId: string) {
        logger.info(`Processing user: ${userId}`);
        logger.debug(`User details loaded for ${userId}`);
        logger.info(`User processing completed: ${userId}`);
      }
      
      processUser(mockLogger, 'user123');
      
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
      expect(mockLogger.debug).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenNthCalledWith(1, 'Processing user: user123');
      expect(mockLogger.debug).toHaveBeenCalledWith('User details loaded for user123');
      expect(mockLogger.info).toHaveBeenNthCalledWith(2, 'User processing completed: user123');
    });

    it('createChild()の戻り値も正常にモック機能を提供すること', () => {
      const mockLogger = createMockLogger();
      const childLogger = mockLogger.createChild('child-context');
      
      childLogger.info('Child logger message');
      
      expect(mockLogger.info).toHaveBeenCalledWith('Child logger message');
      expect(mockLogger.createChild).toHaveBeenCalledWith('child-context');
    });
  });
});
