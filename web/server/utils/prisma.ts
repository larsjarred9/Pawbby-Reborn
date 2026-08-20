import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db'
const adapter = new PrismaLibSql({ url: dbUrl })

export const prisma = new PrismaClient({ 
  adapter,
  log: ['error'] 
});

export default prisma;