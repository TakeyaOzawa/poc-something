/**
 * Variable Entity Tests
 */

import { Variable, VariableData } from '../Variable';

describe('Variable', () => {
  describe('create', () => {
    test('正常な変数が作成されること', () => {
      const variable = Variable.create('username', 'testuser', 'ユーザー名');
      
      expect(variable.getKey()).toBe('username');
      expect(variable.getValue()).toBe('testuser');
      expect(variable.getDescription()).toBe('ユーザー名');
    });

    test('説明なしで変数が作成されること', () => {
      const variable = Variable.create('password', 'testpass');
      
      expect(variable.getKey()).toBe('password');
      expect(variable.getValue()).toBe('testpass');
      expect(variable.getDescription()).toBeUndefined();
    });

    test('キーの前後の空白が除去されること', () => {
      const variable = Variable.create('  username  ', 'testuser');
      expect(variable.getKey()).toBe('username');
    });

    test('説明の前後の空白が除去されること', () => {
      const variable = Variable.create('username', 'testuser', '  ユーザー名  ');
      expect(variable.getDescription()).toBe('ユーザー名');
    });

    test('空のキーが設定された場合、エラーが発生すること', () => {
      expect(() => {
        Variable.create('', 'testuser');
      }).toThrow('変数キーは必須です');
    });

    test('空白のみのキーが設定された場合、エラーが発生すること', () => {
      expect(() => {
        Variable.create('   ', 'testuser');
      }).toThrow('変数キーは必須です');
    });
  });

  describe('fromData', () => {
    test('データから変数が作成されること', () => {
      const data: VariableData = {
        key: 'email',
        value: 'test@example.com',
        description: 'メールアドレス'
      };
      
      const variable = Variable.fromData(data);
      
      expect(variable.getKey()).toBe('email');
      expect(variable.getValue()).toBe('test@example.com');
      expect(variable.getDescription()).toBe('メールアドレス');
    });

    test('説明なしのデータから変数が作成されること', () => {
      const data: VariableData = {
        key: 'token',
        value: 'abc123'
      };
      
      const variable = Variable.fromData(data);
      
      expect(variable.getKey()).toBe('token');
      expect(variable.getValue()).toBe('abc123');
      expect(variable.getDescription()).toBeUndefined();
    });
  });

  describe('updateValue', () => {
    test('値が正常に更新されること', () => {
      const variable = Variable.create('username', 'olduser');
      variable.updateValue('newuser');
      
      expect(variable.getValue()).toBe('newuser');
    });

    test('空の値に更新できること', () => {
      const variable = Variable.create('username', 'testuser');
      variable.updateValue('');
      
      expect(variable.getValue()).toBe('');
    });
  });

  describe('updateDescription', () => {
    test('説明が正常に更新されること', () => {
      const variable = Variable.create('username', 'testuser', '古い説明');
      variable.updateDescription('新しい説明');
      
      expect(variable.getDescription()).toBe('新しい説明');
    });

    test('説明をundefinedに更新できること', () => {
      const variable = Variable.create('username', 'testuser', '説明');
      variable.updateDescription(undefined);
      
      expect(variable.getDescription()).toBeUndefined();
    });

    test('説明の前後の空白が除去されること', () => {
      const variable = Variable.create('username', 'testuser');
      variable.updateDescription('  新しい説明  ');
      
      expect(variable.getDescription()).toBe('新しい説明');
    });

    test('空白のみの説明はundefinedになること', () => {
      const variable = Variable.create('username', 'testuser');
      variable.updateDescription('   ');
      
      expect(variable.getDescription()).toBeUndefined();
    });
  });

  describe('toData', () => {
    test('データ形式で取得できること', () => {
      const variable = Variable.create('username', 'testuser', 'ユーザー名');
      const data = variable.toData();
      
      expect(data.key).toBe('username');
      expect(data.value).toBe('testuser');
      expect(data.description).toBe('ユーザー名');
    });

    test('説明なしの場合のデータ形式', () => {
      const variable = Variable.create('password', 'testpass');
      const data = variable.toData();
      
      expect(data.key).toBe('password');
      expect(data.value).toBe('testpass');
      expect(data.description).toBeUndefined();
    });
  });

  describe('equals', () => {
    test('同じキーの変数は等しいと判定されること', () => {
      const variable1 = Variable.create('username', 'user1', '説明1');
      const variable2 = Variable.create('username', 'user2', '説明2');
      
      expect(variable1.equals(variable2)).toBe(true);
    });

    test('異なるキーの変数は等しくないと判定されること', () => {
      const variable1 = Variable.create('username', 'testuser');
      const variable2 = Variable.create('password', 'testuser');
      
      expect(variable1.equals(variable2)).toBe(false);
    });
  });
});
