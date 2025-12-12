import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { TeacherEntity } from './entity/teacher.entity';
import { GroupEntity } from './entity/group.entity';
import { StudentEntity } from './entity/student.entity';
import { Specification } from './entity/specification';
import { LessonEntity } from './entity/lesson.entity';
import { DocumentEntity } from './entity/document.entity';


const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '53531',
  database: 'crmschool',
  entities: [
    TeacherEntity,
    GroupEntity,
    StudentEntity,
    Specification,
    LessonEntity,   // <-- SHU YERGA QO‘YISH SHART!
    DocumentEntity
  ],
  synchronize: false,
});


const SPECS = [
  { id: "478f9efe-014b-47d5-a31e-76b7af43a845", name: "React Native" },
  { id: "95467fe3-089d-4ad8-ae89-fa0ba449e463", name: "Flutter" },
  { id: "c3ec42ce-0567-4194-acd5-0ea1951b5c52", name: "React" },
  { id: "89fdef8a-c0d5-4241-8df0-3ea1f80e4698", name: "Vue" },
  { id: "a6c13ed3-bbd5-426f-b78c-6487f4b82975", name: "Angular" },
  { id: "35b4d538-7426-4fb8-a6bc-8297d0d48b26", name: "Node.js" },
  { id: "32be22df-8b6f-4d68-b960-c093095894a5", name: "Java" },
  { id: "f6acb6a1-8b28-40bc-9eda-d6eae822300f", name: "Python" },
  { id: "7226bde6-36ba-4872-9b4a-64628e80a712", name: "Go" },
  { id: "0ab44667-090d-49b9-a68f-e4dad31f4188", name: "C++" },
  { id: "a7103acc-be23-41a9-a4cb-2e80e5157011", name: "C#" },
  { id: "1722a858-3a97-46d1-bbba-83cc62846e08", name: "PHP" },
  { id: "f69f70cf-f244-4f26-8a3e-2363b7eff388", name: "Ruby" },
  { id: "f821a78e-817a-45f2-a3b9-188d3aa2d1bc", name: "Swift" },
  { id: "5aab357f-a923-48bb-93fb-57e843ac269a", name: "Kotlin" },
  { id: "2292ea07-98e4-417a-88be-ff1fa26c49fb", name: "Objective-C" },
  { id: "ab1fd78c-f7ca-4b9f-bd1b-765ed1189edd", name: "TypeScript" },
  { id: "70f722cd-ae5a-499e-a774-51e6a4b19ac0", name: "JavaScript" },
  { id: "0083c922-7bff-4827-92e1-303d1206baf4", name: "HTML" },
  { id: "b31b07e0-2325-433e-b5fa-261f1e3eeab8", name: "CSS" },
  { id: "80507f0a-e1e1-426b-b558-f658c8f9e9fb", name: "SQL" },
];

async function seed() {
  await AppDataSource.initialize();

  const teacherRepo = AppDataSource.getRepository(TeacherEntity);
  const groupRepo = AppDataSource.getRepository(GroupEntity);
  const studentRepo = AppDataSource.getRepository(StudentEntity);
  const specRepo = AppDataSource.getRepository(Specification);

  console.log("⏳ Seeding specifications...");
  const specEntities = await specRepo.save(SPECS);

  console.log("⏳ Creating teachers...");
  const teachers: TeacherEntity[] = [];

  for (let i = 0; i < 100; i++) {
    const t = teacherRepo.create({
      name: faker.person.fullName(),
      username: faker.internet.username().toLowerCase() + i,
      password: faker.internet.password(),
      avatarUrl: '',
      specifications: faker.helpers.arrayElements(specEntities, faker.number.int({ min: 1, max: 5 }))
    });
    teachers.push(t);
  }

  await teacherRepo.save(teachers);

  console.log("⏳ Creating groups...");
  const groups: GroupEntity[] = [];

  for (let i = 0; i < 100; i++) {
    const teacher = faker.helpers.arrayElement(teachers);

    const g = groupRepo.create({
      name: `Group-${i + 1}`,
      startTime: "09:00",
      endTime: "11:00",
      durationInMonths: faker.number.int({ min: 6, max: 12 }),
      teacherId: teacher.id
    });

    groups.push(g);
  }

  await groupRepo.save(groups);

  console.log("⏳ Creating students...");
  const students: StudentEntity[] = [];

  for (const group of groups) {
    const count = faker.number.int({ min: 10, max: 15 });

    for (let i = 0; i < count; i++) {
      const s = studentRepo.create({
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase() + faker.number.int(9999),
        password: faker.internet.password(),
        groupId: group.id,
        avatarUrl: '',
      });

      students.push(s);
    }
  }

  await studentRepo.save(students);

  console.log("✅ Seeding completed!");

  process.exit(0);
}

seed().catch((err) => console.error(err));
