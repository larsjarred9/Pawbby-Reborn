export const formatLogTime = (rawTimestamp: string, timeZone?: string) => {
  const tz = timeZone || 'UTC'
  try {
    return new Date(rawTimestamp).toLocaleString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false, 
      timeZone: tz 
    })
  } catch (err) {
    return new Date(rawTimestamp).toLocaleString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    })
  }
}

export const formatLocalDate = (rawTimestamp: string, timeZone?: string) => {
  const tz = timeZone || 'UTC'
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', { 
      timeZone: tz, 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    })
    return formatter.format(new Date(rawTimestamp))
  } catch (err) {
    return new Date(rawTimestamp).toISOString().split('T')[0]
  }
}

export const getLocalYMD = (d: Date, tz?: string) => {
  if (tz) {
    try {
      return new Intl.DateTimeFormat('en-CA', { 
        timeZone: tz, 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      }).format(d)
    } catch (e) {}
  }
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
