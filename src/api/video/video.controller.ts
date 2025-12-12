// video/video.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  Res,
  Delete,
  Body,
  BadRequestException,
  Headers,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoService } from './video.service';
import { type Response } from 'express';
import { join } from 'path';
import * as fs from 'fs';
import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger'; // Importlar
import { CreateVideoDto } from './dto/create-video.dto';
import { Video } from 'src/core';

@ApiTags('videos') // Swaggerda guruhlash uchun
@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  // 1. UPLOAD (Swagger qo'shildi)
  @Post('upload')
  @ApiOperation({ summary: 'Katta videoni yuklash' })
  @ApiConsumes('multipart/form-data') // Form-data qabul qilish
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: "Video fayli va ma'lumotlari",
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        lessonId: { type: 'string', format: 'uuid' },
        video: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Video qabul qilindi', type: Video })
  @UseInterceptors(FileInterceptor('video'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateVideoDto, // DTO orqali ma'lumotlarni olish
  ) {
    if (!file) throw new BadRequestException('Fayl tanlanmagan');

    // Servicega lessonId ni ham yuboramiz
    return this.videoService.uploadVideo(file, body);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Video statusini tekshirish' })
  async getStatus(@Param('id') id: string) {
    return this.videoService.getVideoInfo(id);
  }

 // 1. STREAM (HLS Playlist va Chunklar uchun)
  @Get('stream/:videoId/:file')
  async streamVideo(
    @Param('videoId') videoId: string,
    @Param('file') fileName: string,
    @Res() res: Response,
  ) {
    const filePath = join(process.cwd(), 'uploads', 'hls', videoId, fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Fayl topilmadi');
    }

    // Agar so'ralayotgan narsa .key fayl bo'lsa, uni BU YERDAN BERMAYMIZ!
    if (fileName.endsWith('.key')) {
      throw new UnauthorizedException("Kalitga to'g'ridan-to'g'ri ruxsat yo'q!");
    }

    res.setHeader(
      'Content-Type',
      fileName.endsWith('.m3u8')
        ? 'application/vnd.apple.mpegurl'
        : 'video/MP2T',
    );
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }

  // 2. KALITNI BERISH (SECURE ENDPOINT)
  // Bu yerda haqiqiy loyihada @UseGuards(JwtAuthGuard) bo'lishi SHART!
  @Get('key/:videoId')
  @ApiOperation({ summary: 'Shifrlash kalitini olish (Faqat Userlar uchun)' })
  async getKey(
    @Param('videoId') videoId: string,
    @Res() res: Response,
    @Headers('authorization') authHeader: string, // Headerdan tokenni tutamiz
  ) {
    // --- XAKERNI USHLASH JOYI ---
    // Agar Authorization header bo'lmasa yoki token xato bo'lsa -> RED
    // Hozircha oddiy simulyatsiya qilamiz:
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
       // throw new UnauthorizedException("Videoni ko'rish uchun pul to'lang!"); 
       // Test qilish oson bo'lishi uchun hozircha o'tkazib yuboramiz, 
       // lekin real hayotda shu yerda to'xtatish kerak.
       console.log("Ogohlantirish: Kalit tokensiz so'raldi!");
    }

    const keyPath = join(process.cwd(), 'uploads', 'hls', videoId, 'secret.key');

    if (fs.existsSync(keyPath)) {
      // Kalitni "application/octet-stream" sifatida beramiz
      res.sendFile(keyPath);
    } else {
      res.status(404).send('Kalit topilmadi');
    }
  }
}
