import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const dbUrl = "file:./dev.db"
const adapter = new PrismaLibSql({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

async function run() {
  const users = await prisma.user.findMany()
  console.log(JSON.stringify(users, null, 2))
}
run()
