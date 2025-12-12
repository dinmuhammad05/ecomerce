import { Module } from '@nestjs/common';
import { SpecificationService } from './specification.service';
import { SpecificationController } from './specification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Specification } from 'src/core/entity/specification';

@Module({
  imports: [TypeOrmModule.forFeature([Specification])],
  controllers: [SpecificationController],
  providers: [SpecificationService],
})
export class SpecificationModule {}
