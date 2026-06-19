export type FollowUpStatusType = 'overdue' | 'today' | 'upcoming' | 'none'

export interface FollowUpStatus {
  type: FollowUpStatusType
  text: string
  tooltipText?: string
  pillClass: string
}

export function getFollowUpStatus(dateStr: string, today: Date): FollowUpStatus {
  // Handle invalid or "Not set" dates
  if (!dateStr || dateStr === "Not set" || dateStr.trim() === "") {
    return {
      type: 'none',
      text: 'Not Set',
      pillClass: 'bg-gray-100 text-gray-700'
    }
  }

  const followUpDate = new Date(dateStr)
  
  // Handle invalid dates
  if (isNaN(followUpDate.getTime())) {
    return {
      type: 'none',
      text: 'Invalid Date',
      pillClass: 'bg-gray-100 text-gray-700'
    }
  }

  // Normalize times to compare only dates (ignore time component)
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const followUpNormalized = new Date(followUpDate.getFullYear(), followUpDate.getMonth(), followUpDate.getDate())

  const diffTime = followUpNormalized.getTime() - todayNormalized.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return {
      type: 'overdue',
      text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`,
      tooltipText: `Follow-up was due on ${followUpDate.toLocaleDateString('en-GB')}`,
      pillClass: 'bg-red-100 text-red-700 border border-red-300'
    }
  }

  if (diffDays === 0) {
    return {
      type: 'today',
      text: 'Due Today',
      tooltipText: 'Follow-up scheduled for today',
      pillClass: 'bg-amber-100 text-amber-700 border border-amber-300'
    }
  }

  if (diffDays <= 7) {
    return {
      type: 'upcoming',
      text: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`,
      tooltipText: `Follow-up scheduled for ${followUpDate.toLocaleDateString('en-GB')}`,
      pillClass: 'bg-blue-100 text-blue-700 border border-blue-300'
    }
  }

  return {
    type: 'upcoming',
    text: `Due on ${followUpDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`,
    tooltipText: `Follow-up scheduled for ${followUpDate.toLocaleDateString('en-GB')}`,
    pillClass: 'bg-green-100 text-green-700 border border-green-300'
  }
}
