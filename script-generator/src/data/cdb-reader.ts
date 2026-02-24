import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CardData {
  id: number;
  alias: number;
  setcode: number;
  type: number;
  level: number;
  attribute: number;
  race: number;
  attack: number;
  defense: number;
  lscale: number;
  rscale: number;
  link: number;
}

export interface CardText {
  id: number;
  name: string;
  desc: string;
  str1: string;
  str2: string;
  str3: string;
  str4: string;
  str5: string;
  str6: string;
  str7: string;
  str8: string;
  str9: string;
  str10: string;
  str11: string;
  str12: string;
  str13: string;
  str14: string;
  str15: string;
  str16: string;
}

export interface FullCard extends CardData, CardText {}

export type Language = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'de-DE' | 'es-ES' | 'fr-FR' | 'it-IT' | 'pt-PT';

const DB_PATHS: Record<Language, string> = {
  'zh-CN': '../../../ygopro-database/locales/zh-CN/cards.cdb',
  'en-US': '../../../ygopro-database/locales/en-US/cards.cdb',
  'ja-JP': '../../../ygopro-database/locales/ja-JP/cards.cdb',
  'ko-KR': '../../../ygopro-database/locales/ko-KR/cards.cdb',
  'de-DE': '../../../ygopro-database/locales/de-DE/cards.cdb',
  'es-ES': '../../../ygopro-database/locales/es-ES/cards.cdb',
  'fr-FR': '../../../ygopro-database/locales/fr-FR/cards.cdb',
  'it-IT': '../../../ygopro-database/locales/it-IT/cards.cdb',
  'pt-PT': '../../../ygopro-database/locales/pt-PT/cards.cdb',
};

export class CDBReader {
  private db: Database.Database | null = null;
  private lang: Language;

  constructor(lang: Language = 'zh-CN') {
    this.lang = lang;
  }

  private getDbPath(): string {
    return path.resolve(__dirname, DB_PATHS[this.lang]);
  }

  open(): void {
    const dbPath = this.getDbPath();
    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database not found: ${dbPath}`);
    }
    this.db = new Database(dbPath, { readonly: true, fileMustExist: true });
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  getCardData(id: number): CardData | null {
    if (!this.db) throw new Error('Database not opened');
    
    const stmt = this.db.prepare('SELECT * FROM datas WHERE id = ?');
    const row = stmt.get(id) as CardData | undefined;
    return row || null;
  }

  getCardText(id: number): CardText | null {
    if (!this.db) throw new Error('Database not opened');
    
    const stmt = this.db.prepare('SELECT * FROM texts WHERE id = ?');
    const row = stmt.get(id) as CardText | undefined;
    return row || null;
  }

  getFullCard(id: number): FullCard | null {
    const data = this.getCardData(id);
    const text = this.getCardText(id);
    
    if (!data || !text) return null;
    
    return { ...data, ...text };
  }

  searchCards(query: string, limit: number = 20): FullCard[] {
    if (!this.db) throw new Error('Database not opened');
    
    const stmt = this.db.prepare(`
      SELECT d.*, t.name, t.desc, t.str1, t.str2, t.str3, t.str4, t.str5, 
             t.str6, t.str7, t.str8, t.str9, t.str10, t.str11, t.str12, 
             t.str13, t.str14, t.str15, t.str16
      FROM datas d
      JOIN texts t ON d.id = t.id
      WHERE t.name LIKE ? OR t.desc LIKE ?
      LIMIT ?
    `);
    
    const searchTerm = `%${query}%`;
    const rows = stmt.all(searchTerm, searchTerm, limit) as FullCard[];
    return rows;
  }

  getCardsBySetcode(setcode: number): FullCard[] {
    if (!this.db) throw new Error('Database not opened');
    
    const stmt = this.db.prepare(`
      SELECT d.*, t.name, t.desc, t.str1, t.str2, t.str3, t.str4, t.str5, 
             t.str6, t.str7, t.str8, t.str9, t.str10, t.str11, t.str12, 
             t.str13, t.str14, t.str15, t.str16
      FROM datas d
      JOIN texts t ON d.id = t.id
      WHERE d.setcode = ? OR (d.setcode & 0xFFFF) = ?
    `);
    
    const rows = stmt.all(setcode, setcode) as FullCard[];
    return rows;
  }

  getCardCount(): number {
    if (!this.db) throw new Error('Database not opened');
    
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM datas');
    const row = stmt.get() as { count: number };
    return row.count;
  }
}

export function createReader(lang: Language = 'zh-CN'): CDBReader {
  return new CDBReader(lang);
}
