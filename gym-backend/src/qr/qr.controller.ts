// qr.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { QrService } from './qr.service';

@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  // ✅ POST /qr/generate
  @Post('generate')
  async generateQr(@Body('data') data: string) {
    if (!data) {
      return { error: 'Data parameter is required' };
    }
    const qr = await this.qrService.generateQrCode(data);
    return { qr };
  }

  // ✅ POST /qr/ascii
  @Post('ascii')
  async generateQrAscii(@Body('data') data: string) {
    if (!data) {
      return { error: 'Data parameter is required' };
    }
    const qr = await this.qrService.generateQrAscii(data);
    return { qr };
  }
}
