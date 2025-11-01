/**
 * AutomationVariables Entity Tests
 */

import { AutomationVariables, AutomationVariablesData } from '../AutomationVariables';
import { Variable } from '../Variable';

describe('AutomationVariables', () => {
  let sampleData: AutomationVariablesData;

  beforeEach(() => {
    sampleData = {
      id: 'av-1',
      websiteId: 'website-1',
      name: 'Test Variables',
      variables: [
        { key: 'username', value: 'testuser', description: 'ユーザー名' },
        { key: 'password', value: 'testpass' }
      ],
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    };
  });

  describe('create', () => {
    test('新しい自動化変数が作成されること', () => {
      const variables = AutomationVariables.create('website-1', 'Test Variables');
      
      expect(variables.getWebsiteId()).toBe('website-1');
      expect(variables.getName()).toBe('Test Variables');
      expect(variables.getVariables()).toHaveLength(0);
      expect(variables.getId()).toMatch(/^av_\d+_[a-z0-9]+$/);
      expect(variables.getCreatedAt()).toBeDefined();
      expect(variables.getUpdatedAt()).toBeDefined();
    });
  });

  describe('fromData', () => {
    test('データから自動化変数が作成されること', () => {
      const variables = AutomationVariables.fromData(sampleData);
      
      expect(variables.getId()).toBe('av-1');
      expect(variables.getWebsiteId()).toBe('website-1');
      expect(variables.getName()).toBe('Test Variables');
      expect(variables.getVariables()).toHaveLength(2);
      expect(variables.getCreatedAt()).toBe('2023-01-01T00:00:00.000Z');
      expect(variables.getUpdatedAt()).toBe('2023-01-01T00:00:00.000Z');
    });
  });

  describe('updateName', () => {
    let variables: AutomationVariables;

    beforeEach(() => {
      variables = AutomationVariables.fromData(sampleData);
    });

    test('名前が正常に更新されること', () => {
      const originalUpdatedAt = variables.getUpdatedAt();
      
      // 少し待ってから更新（タイムスタンプの違いを確認するため）
      setTimeout(() => {
        variables.updateName('Updated Name');
        
        expect(variables.getName()).toBe('Updated Name');
        expect(variables.getUpdatedAt()).not.toBe(originalUpdatedAt);
      }, 1);
    });

    test('空の名前が設定された場合、エラーが発生すること', () => {
      expect(() => {
        variables.updateName('');
      }).toThrow('名前は必須です');
      
      expect(() => {
        variables.updateName('   ');
      }).toThrow('名前は必須です');
    });
  });

  describe('addVariable', () => {
    let variables: AutomationVariables;

    beforeEach(() => {
      variables = AutomationVariables.create('website-1', 'Test Variables');
    });

    test('変数が正常に追加されること', () => {
      const variable = Variable.create('email', 'test@example.com', 'メールアドレス');
      variables.addVariable(variable);
      
      expect(variables.getVariables()).toHaveLength(1);
      expect(variables.hasVariable('email')).toBe(true);
      expect(variables.getVariableValue('email')).toBe('test@example.com');
    });

    test('重複するキーの変数を追加した場合、エラーが発生すること', () => {
      const variable1 = Variable.create('email', 'test1@example.com');
      const variable2 = Variable.create('email', 'test2@example.com');
      
      variables.addVariable(variable1);
      
      expect(() => {
        variables.addVariable(variable2);
      }).toThrow("変数キー 'email' は既に存在します");
    });
  });

  describe('updateVariable', () => {
    let variables: AutomationVariables;

    beforeEach(() => {
      variables = AutomationVariables.fromData(sampleData);
    });

    test('存在する変数が正常に更新されること', () => {
      const result = variables.updateVariable('username', 'newuser', '新しいユーザー名');
      
      expect(result).toBe(true);
      expect(variables.getVariableValue('username')).toBe('newuser');
      
      const variable = variables.getVariables().find(v => v.getKey() === 'username');
      expect(variable?.getDescription()).toBe('新しいユーザー名');
    });

    test('存在しない変数を更新した場合、falseが返されること', () => {
      const result = variables.updateVariable('nonexistent', 'value');
      expect(result).toBe(false);
    });
  });

  describe('deleteVariable', () => {
    let variables: AutomationVariables;

    beforeEach(() => {
      variables = AutomationVariables.fromData(sampleData);
    });

    test('存在する変数が正常に削除されること', () => {
      expect(variables.getVariables()).toHaveLength(2);
      
      const result = variables.deleteVariable('username');
      
      expect(result).toBe(true);
      expect(variables.getVariables()).toHaveLength(1);
      expect(variables.hasVariable('username')).toBe(false);
    });

    test('存在しない変数を削除した場合、falseが返されること', () => {
      const result = variables.deleteVariable('nonexistent');
      expect(result).toBe(false);
      expect(variables.getVariables()).toHaveLength(2);
    });
  });

  describe('getVariableValue', () => {
    let variables: AutomationVariables;

    beforeEach(() => {
      variables = AutomationVariables.fromData(sampleData);
    });

    test('存在する変数の値が取得できること', () => {
      expect(variables.getVariableValue('username')).toBe('testuser');
      expect(variables.getVariableValue('password')).toBe('testpass');
    });

    test('存在しない変数の場合、undefinedが返されること', () => {
      expect(variables.getVariableValue('nonexistent')).toBeUndefined();
    });
  });

  describe('hasVariable', () => {
    let variables: AutomationVariables;

    beforeEach(() => {
      variables = AutomationVariables.fromData(sampleData);
    });

    test('存在する変数の場合、trueが返されること', () => {
      expect(variables.hasVariable('username')).toBe(true);
      expect(variables.hasVariable('password')).toBe(true);
    });

    test('存在しない変数の場合、falseが返されること', () => {
      expect(variables.hasVariable('nonexistent')).toBe(false);
    });
  });

  describe('toData', () => {
    test('データ形式で取得できること', () => {
      const variables = AutomationVariables.fromData(sampleData);
      const data = variables.toData();
      
      expect(data.id).toBe('av-1');
      expect(data.websiteId).toBe('website-1');
      expect(data.name).toBe('Test Variables');
      expect(data.variables).toHaveLength(2);
      expect(data.createdAt).toBe('2023-01-01T00:00:00.000Z');
      expect(data.updatedAt).toBe('2023-01-01T00:00:00.000Z');
    });
  });
});
