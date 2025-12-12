import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { VideoService } from './video.service';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';

@Processor('video-transcode')
export class VideoProcessor extends WorkerHost {
  constructor(private readonly videoService: VideoService) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { videoId, filePath } = job.data;

    const outputDir = path.join(process.cwd(), 'uploads', 'hls', videoId);
    await fs.ensureDir(outputDir);

    const outputPath = path.join(outputDir, 'master.m3u8');

    // --- XAKERLARDAN HIMOYA BOSHLANDI ---

    // 1. 16 baytlik tasodifiy shifrlash kaliti yaratamiz
    const key = crypto.randomBytes(16);
    const keyPath = path.join(outputDir, 'secret.key');
    await fs.writeFile(keyPath, key);

    // 2. Initialization Vector (IV) - xavfsizlikni kuchaytirish uchun
    const iv = crypto.randomBytes(16).toString('hex');

    // 3. Key Info fayli. FFmpeg bu fayl orqali biladiki:
    // - Brauzer kalitni qaysi URL dan so'rasin? (Bizning himoyalangan API)
    // - Serverda kalit qayerda joylashgan?
    const fakeKeyUrl = `https://fake-auth/key/${videoId}`;
    const keyInfoPath = path.join(outputDir, 'key_info');

    // Format: <URL>\n<Serverdagi_Path>\n<IV (optional)>
    await fs.writeFile(keyInfoPath, `${fakeKeyUrl}\n${keyPath}\n${iv}`);

    // --- HIMOYA TUGADI (Endi FFmpeg ga beramiz) ---

    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .addOptions([
          '-profile:v baseline',
          '-level 3.0',
          '-start_number 0',
          '-hls_time 10',
          '-hls_list_size 0',
          // SHU YERDA SHIFRLASH YOQILADI
          `-hls_key_info_file ${keyInfoPath}`,
          '-hls_segment_filename',
          path.join(outputDir, 'chunk_%03d.ts'), // .m2ts o'rniga .ts standartroq
          '-f hls',
        ])
        .output(outputPath)
        .on('end', async () => {
          console.log(`SECURE Video ${videoId} processed!`);

          // Xavfsizlik uchun key_info faylini o'chirib tashlaymiz (endi kerak emas)
          await fs.unlink(keyInfoPath);

          await this.videoService.completeProcessing(
            videoId,
            `/videos/stream/${videoId}/master.m3u8`,
          );
          resolve(true);
        })
        .on('error', async (err) => {
          console.error(`Video ${videoId} FAILED:`, err);
          await this.videoService.failProcessing(videoId);
          reject(err);
        })
        .run();
    });
  }
}
