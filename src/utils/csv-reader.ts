import * as fs from 'fs';
import * as path from 'path';

/**
 * Opciones para el lector de CSV
 */
export interface CsvReaderOptions {
  /** Delimitador de campos (por defecto: ,) */
  delimiter?: string;
  /** Si la primera fila contiene headers (por defecto: true) */
  hasHeaders?: boolean;
  /** Codificación del archivo (por defecto: utf-8) */
  encoding?: BufferEncoding;
  /** Convertir valores numéricos automáticamente (por defecto: true) */
  parseNumbers?: boolean;
  /** Convertir valores booleanos automáticamente (por defecto: true) */
  parseBooleans?: boolean;
}

/**
 * Lector de archivos CSV para data-driven testing
 * Permite cargar datos de prueba desde archivos CSV
 */
export class CsvReader {
  private options: Required<CsvReaderOptions>;

  constructor(options: CsvReaderOptions = {}) {
    this.options = {
      delimiter: options.delimiter ?? ',',
      hasHeaders: options.hasHeaders ?? true,
      encoding: options.encoding ?? 'utf-8',
      parseNumbers: options.parseNumbers ?? true,
      parseBooleans: options.parseBooleans ?? true,
    };
  }

  /**
   * Parsea un valor individual del CSV
   */
  private parseValue(value: string): string | number | boolean | null {
    const trimmed = value.trim();

    // Manejar valores vacíos
    if (trimmed === '' || trimmed.toLowerCase() === 'null') {
      return null;
    }

    // Remover comillas si existen
    const unquoted = trimmed.replace(/^["']|["']$/g, '');

    // Parsear booleanos
    if (this.options.parseBooleans) {
      if (unquoted.toLowerCase() === 'true') return true;
      if (unquoted.toLowerCase() === 'false') return false;
    }

    // Parsear números
    if (this.options.parseNumbers && !isNaN(Number(unquoted)) && unquoted !== '') {
      return Number(unquoted);
    }

    return unquoted;
  }

  /**
   * Parsea una línea de CSV respetando comillas
   */
  private parseLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else if (char === this.options.delimiter && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    return values;
  }

  /**
   * Lee un archivo CSV y retorna un array de objetos
   * @param filePath - Ruta al archivo CSV (absoluta o relativa a la raíz del proyecto)
   * @returns Array de objetos con los datos del CSV
   */
  read<T = Record<string, unknown>>(filePath: string): T[] {
    const absolutePath = path.isAbsolute(filePath) 
      ? filePath 
      : path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`CSV file not found: ${absolutePath}`);
    }

    const content = fs.readFileSync(absolutePath, this.options.encoding);
    const lines = content
      .split(/\r?\n/)
      .filter(line => line.trim() !== '');

    if (lines.length === 0) {
      return [];
    }

    if (this.options.hasHeaders) {
      const headers = this.parseLine(lines[0]);
      
      return lines.slice(1).map(line => {
        const values = this.parseLine(line);
        const obj: Record<string, unknown> = {};
        
        headers.forEach((header, index) => {
          obj[header.trim()] = this.parseValue(values[index] || '');
        });
        
        return obj as T;
      });
    } else {
      return lines.map(line => {
        const values = this.parseLine(line);
        return values.map(v => this.parseValue(v)) as unknown as T;
      });
    }
  }

  /**
   * Lee un archivo CSV y retorna los datos formateados para Playwright test.each
   * @param filePath - Ruta al archivo CSV
   * @returns Array de arrays para usar con test.each
   */
  readForTestEach<T = Record<string, unknown>>(filePath: string): [string, T][] {
    const data = this.read<T>(filePath);
    return data.map((row, index) => {
      // Intenta usar un campo identificador o usa el índice
      const rowData = row as Record<string, unknown>;
      const identifier = rowData.testName || rowData.name || rowData.id || `Row ${index + 1}`;
      return [String(identifier), row];
    });
  }
}

/**
 * Función helper para leer CSV de forma rápida
 * @param filePath - Ruta al archivo CSV
 * @param options - Opciones del lector
 * @returns Array de objetos con los datos del CSV
 */
export function readCsv<T = Record<string, unknown>>(
  filePath: string, 
  options?: CsvReaderOptions
): T[] {
  const reader = new CsvReader(options);
  return reader.read<T>(filePath);
}

/**
 * Lee CSV y lo formatea para usar con Playwright test.each
 * @param filePath - Ruta al archivo CSV
 * @param options - Opciones del lector
 * @returns Array de tuplas [nombre, datos] para test.each
 */
export function readCsvForTestEach<T = Record<string, unknown>>(
  filePath: string,
  options?: CsvReaderOptions
): [string, T][] {
  const reader = new CsvReader(options);
  return reader.readForTestEach<T>(filePath);
}

/**
 * Lee CSV y construye body requests para API testing
 * @param filePath - Ruta al archivo CSV
 * @param bodyBuilder - Función que transforma cada fila en el body deseado
 * @returns Array de objetos body para requests
 */
export function buildRequestBodiesFromCsv<TInput, TOutput>(
  filePath: string,
  bodyBuilder: (row: TInput) => TOutput,
  options?: CsvReaderOptions
): TOutput[] {
  const data = readCsv<TInput>(filePath, options);
  return data.map(bodyBuilder);
}
