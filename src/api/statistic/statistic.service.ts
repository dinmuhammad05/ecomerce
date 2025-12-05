import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Roles } from 'src/common/enum/roles.enum';
import {
  AdminEntity,
  GroupEntity,
  StudentEntity,
  TeacherEntity,
} from 'src/core';
import { ISuccess } from 'src/infrastructure/pagination/successResponse';
import { successRes } from 'src/infrastructure/response/success.response';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';

@Injectable()
export class StatisticService {
  constructor(
    @InjectRepository(AdminEntity) private adminRepo: Repository<AdminEntity>,
    @InjectRepository(TeacherEntity)
    private teacherRepo: Repository<TeacherEntity>,
    @InjectRepository(StudentEntity)
    private studentRepo: Repository<StudentEntity>,
    @InjectRepository(GroupEntity) private groupRepo: Repository<GroupEntity>,
  ) {}

  async getStatisticAll() {
    const adminCount = await this.adminRepo.count({
      where: { role: Roles.ADMIN },
    });
    const teacherCount = await this.teacherRepo.count();
    const studentCount = await this.studentRepo.count();
    const groupCount = await this.groupRepo.count();
    return successRes({ adminCount, teacherCount, studentCount, groupCount });
  }

  async getTopTeachers(): Promise<ISuccess> {
    const teachers = await this.teacherRepo
      .createQueryBuilder('teacher')
      .leftJoin('teacher.groups', 'group')
      .select('teacher.name', 'teacherName')
      .addSelect('COUNT(group.id)', 'groupCount')
      .where('teacher.deletedAt IS NULL')
      .groupBy('teacher.name')
      .orderBy('"groupCount"', 'DESC')
      .limit(10)
      .getRawMany();

    // Chiroyli RGB ranglar (pastel / soft)
    const rgbColors = [
      'rgba(0, 51, 102, 1)', // dark blue
      'rgba(102, 0, 0, 1)', // dark red
      'rgba(102, 51, 0, 1)', // dark brown
      'rgba(0, 102, 0, 1)', // dark green
      'rgba(102, 0, 102, 1)', // dark purple
      'rgba(153, 51, 0, 1)', // dark orange
      'rgba(0, 76, 102, 1)', // teal/dark cyan
      'rgba(102, 0, 51, 1)', // maroon
      'rgba(102, 51, 102, 1)', // deep violet
      'rgba(0, 102, 153, 1)', // deep sky blue
      'rgba(51, 0, 102, 1)', // indigo
      'rgba(102, 102, 0, 1)', // olive/dark yellow
    ];

    const hashToIndex = (s: string) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) >>> 0;
      }
      return h % rgbColors.length;
    };

    const teachersWithColors = teachers.map((t: any) => {
      const shortId = randomUUID().slice(0, 6);

      const objectName =
        t.teacherName
          .toLowerCase()
          .replace(/\s+/g, '_') // pastki chiziq
          .replace(/[^a-z0-9\_]/g, '') +
        '_' +
        shortId;

      return {
        teacherName: t.teacherName,
        objectName,
        groupCount: Number(t.groupCount),
        colorClass: rgbColors[hashToIndex(t.teacherName)], // rgb rang
      };
    });

    return successRes(teachersWithColors);
  }

  /**
   * async getTopTeachers(): Promise<ISuccess> {
  const teachers = await this.teacherRepo
    .createQueryBuilder('teacher')
    .leftJoin('teacher.groups', 'group')
    .select('teacher.name', 'teacherName')
    .addSelect('COUNT(group.id)', 'groupCount')
    .where('teacher.deletedAt IS NULL')
    .groupBy('teacher.name')
    .orderBy('"groupCount"', 'DESC')
    .limit(10)
    .getRawMany();

  // Chiroyli HEX ranglar (pastel)
  const hexColors = [
    '#87CEEB', // skyblue
    '#FFB6C1', // lightpink
    '#FFDDAA', // lightorange
    '#90EE90', // lightgreen
    '#D8BFD8', // thistle
    '#FFA07A', // lightsalmon
    '#ADD8E6', // lightblue
    '#DDA0DD', // plum
    '#F0E68C', // khaki
    '#FFE4E1', // mistyrose
  ];

  const hashToIndex = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) >>> 0;
    }
    return h % hexColors.length;
  };

  const teachersWithColors = teachers.map((t: any) => {
    const shortId = randomUUID().slice(0, 6);

    const objectName =
      t.teacherName
        .toLowerCase()
        .replace(/\s+/g, '_')       // pastki chiziq
        .replace(/[^a-z0-9\_]/g, '') 
      + '_' +
      shortId;

    return {
      teacherName: t.teacherName,
      objectName,
      groupCount: Number(t.groupCount),
      colorClass: hexColors[hashToIndex(t.teacherName)], // HEX rang
    };
  });

  return successRes(teachersWithColors);
}

   * 
   */

  async getTopGroupsByStudents(): Promise<ISuccess> {
    const groups = await this.groupRepo
      .createQueryBuilder('group')
      .leftJoin('group.students', 'student')
      .select('group.name', 'groupName')
      .addSelect('COUNT(student.id)', 'studentCount')
      .where('group.deletedAt IS NULL')
      .groupBy('group.name')
      .orderBy('"studentCount"', 'DESC')
      .limit(10)
      .getRawMany();

    return successRes(groups);
  }

  async getMostOpenedGroups(): Promise<ISuccess> {
    const groups = await this.groupRepo
      .createQueryBuilder('group')
      .select('group.name', 'groupName')
      .addSelect('COUNT(group.id)', 'openCount')
      .where('group.deletedAt IS NULL')
      .groupBy('group.name')
      .orderBy('"openCount"', 'DESC')
      .limit(10)
      .getRawMany();

    return successRes(groups);
  }

  async getStudentCountByMonth(): Promise<ISuccess> {
    const rows: { month: string; studentcount: string }[] =
      await this.studentRepo
        .createQueryBuilder('student')
        .select("TO_CHAR(student.createdAt, 'YYYY-MM')", 'month')
        .addSelect('COUNT(student.id)', 'studentCount')
        .where('student.deletedAt IS NULL')
        .groupBy("TO_CHAR(student.createdAt, 'YYYY-MM')")
        .orderBy('month', 'ASC')
        .getRawMany();

    // Tailwind rang klasslari (xohishga ko'ra o'zgartir)
    const tailwindColors = [
      'bg-sky-500',
      'bg-rose-500',
      'bg-amber-500',
      'bg-lime-500',
      'bg-indigo-500',
      'bg-emerald-500',
      'bg-fuchsia-500',
      'bg-cyan-500',
      'bg-violet-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-green-500',
    ];

    // Sodda hash funktsiyasi — oy stringdan indeks hisoblaydi
    const hashToIndex = (s: string) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) >>> 0;
      }
      return h % tailwindColors.length;
    };

    const statsWithColors = rows.map((r) => {
      // TypeORM raw kalitlari pastki registrda kelishi mumkin: studentcount yoki studentCount
      const count = (r as any).studentCount ?? (r as any).studentcount ?? '0';
      const month = r.month;
      return {
        month,
        studentCount: Number(count),
        colorClass: tailwindColors[hashToIndex(month)],
        // agar frontendga hex kerak bo'lsa: addHex: '#34D399'
      };
    });

    return successRes(statsWithColors);
  }
}
