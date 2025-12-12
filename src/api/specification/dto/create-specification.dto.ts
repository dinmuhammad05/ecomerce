import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSpecificationDto {
  @ApiProperty({
    description: 'Specification category, masalan: Mobile yoki Website',
    example: 'Mobile',
  })
  @IsString()
  @IsNotEmpty({ message: 'Category bo\'sh bo\'lmasligi kerak' })
  @MaxLength(100, { message: 'Category maksimal 100 ta belgidan oshmasligi kerak' })
  category: string;

  @ApiProperty({
    description: 'Specification name, masalan: React Native',
    example: 'React Native',
  })
  @IsString()
  @IsNotEmpty({ message: 'Name bo\'sh bo\'lmasligi kerak' })
  @MaxLength(100, { message: 'Name maksimal 100 ta belgidan oshmasligi kerak' })
  name: string;
}
