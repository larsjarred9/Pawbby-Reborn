import prisma from './prisma'

export interface PetLiveState {
  id: string
  name: string
  profileWeight: number // the weight set on the cat's profile (used for PawID matching)
  lastUsedAt: Date | null // most recent litter box visit
  latestWeight: number | null // kg, weight recorded on the most recent visit
  lastDuration: number | null // seconds, duration of the most recent visit
  visitsToday: number
}

/**
 * Per-cat raw datapoints for integrations (Home Assistant). Cats are global to the
 * install (not device-scoped), so this returns one entry per Pet.
 *
 * We deliberately expose only raw datapoints (latest weight, duration, last used,
 * visits today). Trends/averages are left to Home Assistant, which keeps long-term
 * statistics and can derive them from the weight sensor's history.
 */
export async function computePetStates(): Promise<PetLiveState[]> {
  const pets = await prisma.pet.findMany()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const result: PetLiveState[] = []
  for (const pet of pets) {
    const last = await prisma.litterEvent.findFirst({
      where: { petId: pet.id, type: 'toileted' },
      orderBy: { timestamp: 'desc' },
    })

    const visitsToday = await prisma.litterEvent.count({
      where: { petId: pet.id, type: 'toileted', timestamp: { gte: today } },
    })

    result.push({
      id: pet.id,
      name: pet.name,
      profileWeight: pet.weight,
      lastUsedAt: last?.timestamp ?? null,
      latestWeight: last?.weight ?? null,
      lastDuration: last?.duration ?? null,
      visitsToday,
    })
  }

  return result
}
