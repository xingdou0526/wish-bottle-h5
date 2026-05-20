import { PrismaClient, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'demo1234';

const DEMO_USERS = [
  { email: 'demo@wishbottle.app', nickname: '小晴', birthday: '05-19', signature: '把愿望折成纸星星~', avatar: '🌸' },
  { email: 'lin@wishbottle.app',  nickname: '林夕',  birthday: '08-02', signature: '愿你被这世界温柔以待', avatar: '🌙' },
  { email: 'wen@wishbottle.app',  nickname: '阿文',  birthday: '11-11', signature: '一起摇瓶子吗',           avatar: '☁️' },
  { email: 'cici@wishbottle.app', nickname: 'CiCi',  birthday: '02-14', signature: '今天也要元气满满',       avatar: '🍀' },
];

const SAMPLE_WISHES: Array<{ text: string; color: number; sticker: string | null; sealOpt: string }> = [
  { text: '希望明年这个时候，我们还能一起看樱花',    color: 1, sticker: '✿', sealOpt: '1y' },
  { text: '想要学会一种乐器，弹给在乎的人听',         color: 4, sticker: '★', sealOpt: 'now' },
  { text: '今年要去一次海边，看一次日出',             color: 2, sticker: '☾', sealOpt: '6m' },
  { text: '希望家人都健健康康',                       color: 0, sticker: '♡', sealOpt: 'now' },
  { text: '把那本翻了一半的书读完',                   color: 3, sticker: null, sealOpt: '3m' },
];

function sealUntilFor(opt: string): Date | null {
  const d = new Date();
  switch (opt) {
    case '1m': d.setDate(d.getDate() + 30); return d;
    case '3m': d.setDate(d.getDate() + 90); return d;
    case '6m': d.setDate(d.getDate() + 180); return d;
    case '1y': d.setDate(d.getDate() + 365); return d;
    default: return null;
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const users: User[] = [];
  for (const u of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
    users.push(user);
  }

  // 默认让所有 demo 用户互为好友
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const [a, b] = [users[i].id, users[j].id].sort();
      await prisma.friendship.upsert({
        where: { userAId_userBId: { userAId: a, userBId: b } },
        create: { userAId: a, userBId: b },
        update: {},
      });
    }
  }

  // 给每个用户播种几条 wish
  for (const u of users) {
    const count = await prisma.wish.count({ where: { ownerId: u.id } });
    if (count > 0) continue;
    for (const w of SAMPLE_WISHES) {
      await prisma.wish.create({
        data: {
          ownerId: u.id,
          text: w.text,
          color: w.color,
          sticker: w.sticker,
          sealOpt: w.sealOpt,
          sealUntil: sealUntilFor(w.sealOpt),
        },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded ${users.length} users, password = ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
