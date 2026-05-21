// PNG Export/Import Service
// Handles embedding Character Card V2 JSON into PNG tEXt chunks

import { CharacterCardV2 } from '@/types/character-card';

export class PNGExportService {
  /**
   * Embed character card JSON into a PNG file
   */
  async embedCardInPNG(imageFile: File | Blob, cardData: CharacterCardV2): Promise<Blob> {
    const imageBuffer = await imageFile.arrayBuffer();
    const uint8Array = new Uint8Array(imageBuffer);

    // Verify PNG signature
    if (!this.isPNG(uint8Array)) {
      throw new Error('Invalid PNG file');
    }

    // Encode character data to base64
    const jsonString = JSON.stringify(cardData);
    const base64Data = btoa(unescape(encodeURIComponent(jsonString)));

    // Create tEXt chunk with 'chara' keyword
    const textChunk = this.createTextChunk('chara', base64Data);

    // Insert chunk before IEND
    const result = this.insertChunkBeforeIEND(uint8Array, textChunk);

    return new Blob([result], { type: 'image/png' });
  }

  /**
   * Extract character card from PNG file
   */
  async extractCardFromPNG(imageFile: File | Blob): Promise<CharacterCardV2 | null> {
    const imageBuffer = await imageFile.arrayBuffer();
    const uint8Array = new Uint8Array(imageBuffer);

    if (!this.isPNG(uint8Array)) {
      throw new Error('Invalid PNG file');
    }

    // Find tEXt chunk with 'chara' keyword
    const base64Data = this.extractTextChunk(uint8Array, 'chara');

    if (!base64Data) {
      return null;
    }

    try {
      const jsonString = decodeURIComponent(escape(atob(base64Data)));
      const cardData = JSON.parse(jsonString) as CharacterCardV2;

      // Validate it's a V2 card
      if (cardData.spec === 'chara_card_v2') {
        return cardData;
      }

      return null;
    } catch (error) {
      console.error('Failed to parse character data:', error);
      return null;
    }
  }

  private isPNG(data: Uint8Array): boolean {
    const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
    return pngSignature.every((byte, index) => data[index] === byte);
  }

  private createTextChunk(keyword: string, text: string): Uint8Array {
    const keywordBytes = new TextEncoder().encode(keyword);
    const textBytes = new TextEncoder().encode(text);

    const chunkLength = keywordBytes.length + 1 + textBytes.length;
    const chunk = new Uint8Array(12 + chunkLength);
    const view = new DataView(chunk.buffer);

    // Length (4 bytes)
    view.setUint32(0, chunkLength, false);

    // Chunk type 'tEXt' (4 bytes)
    chunk[4] = 116; // t
    chunk[5] = 69;  // E
    chunk[6] = 88;  // X
    chunk[7] = 116; // t

    // Data
    let offset = 8;
    chunk.set(keywordBytes, offset);
    offset += keywordBytes.length;
    chunk[offset++] = 0; // null separator
    chunk.set(textBytes, offset);

    // CRC (4 bytes)
    const crc = this.calculateCRC(chunk.slice(4, 8 + chunkLength));
    view.setUint32(8 + chunkLength, crc, false);

    return chunk;
  }

  private insertChunkBeforeIEND(png: Uint8Array, chunk: Uint8Array): ArrayBuffer {
    // Find IEND chunk (last 12 bytes of valid PNG)
    const iendPosition = png.length - 12;

    const result = new Uint8Array(png.length + chunk.length);
    result.set(png.slice(0, iendPosition), 0);
    result.set(chunk, iendPosition);
    result.set(png.slice(iendPosition), iendPosition + chunk.length);

    return result.buffer;
  }

  private extractTextChunk(png: Uint8Array, keyword: string): string | null {
    let offset = 8; // Skip PNG signature

    while (offset < png.length) {
      const view = new DataView(png.buffer, offset);
      const length = view.getUint32(0, false);
      const type = String.fromCharCode(...png.slice(offset + 4, offset + 8));

      if (type === 'IEND') {
        break;
      }

      if (type === 'tEXt') {
        const dataStart = offset + 8;
        const dataEnd = dataStart + length;
        const data = png.slice(dataStart, dataEnd);

        // Find null separator
        let nullIndex = 0;
        while (nullIndex < data.length && data[nullIndex] !== 0) {
          nullIndex++;
        }

        const chunkKeyword = new TextDecoder().decode(data.slice(0, nullIndex));

        if (chunkKeyword === keyword) {
          const text = new TextDecoder().decode(data.slice(nullIndex + 1));
          return text;
        }
      }

      offset += 12 + length; // length + type + data + crc
    }

    return null;
  }

  private calculateCRC(data: Uint8Array): number {
    let crc = 0xffffffff;

    for (let i = 0; i < data.length; i++) {
      crc = this.crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    }

    return crc ^ 0xffffffff;
  }

  private crcTable = (() => {
    const table: number[] = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c;
    }
    return table;
  })();
}

export const pngExportService = new PNGExportService();
