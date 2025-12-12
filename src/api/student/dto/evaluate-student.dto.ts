import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Max, Min } from 'class-validator';

export class EvaluateDto {
  @ApiProperty({ example: 5, description: "O'quvchining bali (1-5)" })
  @Min(1, { message: "1 dan kichkina bo'lishi mumkin emas" })
  @Max(5, { message: "5 dan katta bo'lishi mumkin emas" })
  @IsOptional()
  grade: number;

  @ApiProperty({
    example: 'good',
    description: "O'quvchining baholangan qandaydir",
  })
  @IsString({ message: "string bo'lishi kerak" })
  @IsOptional()
  behavior: string;
}
