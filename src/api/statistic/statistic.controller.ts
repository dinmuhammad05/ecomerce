import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { AuthGuard } from 'src/common/guard/AuthGuard';
import { RolesGuard } from 'src/common/guard/RolesGuard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { accessRoles } from 'src/common/decorator/roles.decorator';
import { Roles } from 'src/common/enum/roles.enum';

@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('statistic')
export class StatisticController {
  constructor(private readonly statisticService: StatisticService) {}

  @Get()
  @accessRoles(Roles.ADMIN, Roles.SUPER_ADMIN)
  getStatisticAll() {
    return this.statisticService.getStatisticAll();
  }

  @Get('/top-teachers')
  @accessRoles(Roles.ADMIN, Roles.SUPER_ADMIN)
  getTopTeachers() {
    return this.statisticService.getTopTeachers();
  }

  @Get('/top-groups')
  @accessRoles(Roles.ADMIN, Roles.SUPER_ADMIN)
  getTopGroupsByStudents() {
    return this.statisticService.getTopGroupsByStudents();
  }

  @Get('/most-opened-groups')
  @accessRoles(Roles.ADMIN, Roles.SUPER_ADMIN)
  getMostOpenedGroups() {
    return this.statisticService.getMostOpenedGroups();
  }

  @Get('/student-count-by-month')
  @accessRoles(Roles.ADMIN, Roles.SUPER_ADMIN)
  getStudentCountByMonth() {
    return this.statisticService.getStudentCountByMonth();
  }
}
