// qr.service.ts
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrService {
  async generateQrCode(data: string): Promise<string> {
    try {
      return await QRCode.toDataURL(data);
    } catch (err) {
      throw new Error('Failed to generate QR code');
    }
  }

  async generateQrAscii(data: string): Promise<string> {
    try {
      return await QRCode.toString(data, { type: 'terminal' });
    } catch (err) {
      throw new Error('Failed to generate QR code (ASCII)');
    }
  }
}
