/**
 * TabRecordingRepository Interface
 * タブ録画の永続化を抽象化するリポジトリインターフェース
 */

import { TabRecording } from '@domain/entities/TabRecording';

export interface TabRecordingRepository {
  save(recording: TabRecording): Promise<void>;
  getById(id: string): Promise<TabRecording | undefined>;
  getByAutomationResultId(automationResultId: string): Promise<TabRecording | undefined>;
  getLatestByVariablesId(variablesId: string): Promise<TabRecording | undefined>;
  deleteOldRecordings(olderThanDays: number): Promise<number>;
  delete(id: string): Promise<boolean>;
}
