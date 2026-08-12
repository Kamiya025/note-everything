import Dexie, { type Table } from 'dexie';
import type { Note } from '../types';

export class NoteEverythingDB extends Dexie {
  notes!: Table<Note, string>;

  constructor() {
    super('NoteEverythingDB');
    this.version(1).stores({
      notes: 'id, createdAt' // string id, index on createdAt
    });
  }
}

export const db = new NoteEverythingDB();
