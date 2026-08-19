import { createClient } from '@libsql/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'

const dbUrl = process.env.DATABASE_URL || "file:./dev.db"
const libsqlClient = createClient({ url: dbUrl })
const adapter = new PrismaLibSql(libsqlClient)

export const prisma = new PrismaClient({ 
  adapter,
  log: ['error'] 
});

export default prisma;