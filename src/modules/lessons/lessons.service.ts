import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as mammoth from 'mammoth';

@Injectable()
export class LessonsService {
  async parseDocxToHtml(filePath: string): Promise<string> {
    const buffer = fs.readFileSync(filePath);

    const { value: html } = await mammoth.convertToHtml(
      { buffer },
      {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Normal'] => p:fresh",
          'b => strong',
          'i => em',
        ],
      },
    );

    return `<div class="docx-content">${html}</div>`;
  }
}
