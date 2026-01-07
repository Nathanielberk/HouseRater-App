'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Household, HouseholdUser } from '@/lib/types/database'

const HOUSEHOLD_LIMITS = {
  MAX_USERS: 8,
  MAX_OWNERS: 2
} as const

export default function MembersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [household, setHousehold] = useState<Household | null>(null)
  const [currentUser, setCurrentUser] = useState<HouseholdUser | null>(null)
  const [members, setMembers] = useState<HouseholdUser[]>([])
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'owner' | 'member'>('member')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get current household user
      const { data: householdUser, error: userError } = await supabase
        .from('household_users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (userError || !householdUser) {
        router.push('/auth/household-setup')
        return
      }

      setCurrentUser(householdUser)

      // Get household details
      const { data: householdData } = await supabase
        .from('households')
        .select('*')
        .eq('id', householdUser.household_id)
        .single()

      if (householdData) {
        setHousehold(householdData)
      }

      // Get all household members
      const { data: membersData, error: membersError } = await supabase
        .from('household_users')
        .select('*')
        .eq('household_id', householdUser.household_id)
        .order('created_at')

      if (membersError) {
        console.error('Error loading members:', membersError)
        setError('Failed to load members')
      } else if (membersData) {
        setMembers(membersData)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading members:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!inviteName.trim()) {
      setError('Name is required')
      return
    }

    if (!inviteEmail.trim()) {
      setError('Email is required')
      return
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail.trim())) {
      setError('Please enter a valid email address')
      return
    }

    if (!currentUser || !household) {
      setError('User or household not found')
      return
    }

    // Check if current user is owner
    if (currentUser.role !== 'owner') {
      setError('Only household owners can invite users')
      return
    }

    // Check household size limit
    if (members.length >= HOUSEHOLD_LIMITS.MAX_USERS) {
      setError(`Maximum ${HOUSEHOLD_LIMITS.MAX_USERS} users per household`)
      return
    }

    // Check owner limit if inviting as owner
    if (inviteRole === 'owner') {
      const ownerCount = members.filter(m => m.role === 'owner').length
      if (ownerCount >= HOUSEHOLD_LIMITS.MAX_OWNERS) {
        setError(`Maximum ${HOUSEHOLD_LIMITS.MAX_OWNERS} owners per household`)
        return
      }
    }

    try {
      const supabase = createClient()

      // Check if email already exists in this household
      const { data: existingMember } = await supabase
        .from('household_users')
        .select('*')
        .eq('household_id', household.id)
        .eq('email', inviteEmail.trim().toLowerCase())
        .single()

      if (existingMember) {
        setError('This email is already a member of your household')
        return
      }

      // Check if this email has an auth account
      // Note: We can't directly query auth.users, so we'll create the household_user entry
      // and the user will link it when they sign up/login

      const { data: newMember, error: insertError } = await supabase
        .from('household_users')
        .insert([{
          household_id: household.id,
          name: inviteName.trim(),
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          auth_user_id: null // Will be linked when user signs up/logs in
        }])
        .select()
        .single()

      if (insertError) {
        console.error('Error inviting user:', insertError)
        setError('Failed to invite user')
        return
      }

      // Send invitation email
      try {
        const emailResponse = await fetch('/api/send-invitation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inviteeName: inviteName.trim(),
            inviteeEmail: inviteEmail.trim().toLowerCase(),
            inviterName: currentUser.name,
            householdName: household.name
          })
        })

        const emailResult = await emailResponse.json()

        if (!emailResponse.ok) {
          console.error('Failed to send invitation email:', emailResult)
          // Don't fail the invitation - just log the error
        } else if (emailResult.mode === 'development') {
          console.log('Email logged to server console (development mode)')
        }
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError)
        // Don't fail the invitation - just log the error
      }

      // Add to local state
      setMembers([...members, newMember])
      setInviteName('')
      setInviteEmail('')
      setInviteRole('member')
      setShowInviteForm(false)
      setSuccess(`Invitation sent to ${inviteEmail}! They'll receive an email with instructions to join your household.`)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      console.error('Error inviting user:', err)
      setError('An unexpected error occurred')
    }
  }

  const handleRemoveMember = async (member: HouseholdUser) => {
    if (!currentUser) return

    // Can't remove yourself
    if (member.id === currentUser.id) {
      setError('You cannot remove yourself from the household')
      return
    }

    // Only owners can remove members
    if (currentUser.role !== 'owner') {
      setError('Only household owners can remove members')
      return
    }

    if (!confirm(`Are you sure you want to remove ${member.name} from your household?`)) {
      return
    }

    try {
      const supabase = createClient()

      const { error: deleteError } = await supabase
        .from('household_users')
        .delete()
        .eq('id', member.id)

      if (deleteError) {
        console.error('Error removing member:', deleteError)
        setError('Failed to remove member')
        return
      }

      // Reload members from database to ensure consistency
      await loadMembers()
      setSuccess(`${member.name} has been removed from your household`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error removing member:', err)
      setError('An unexpected error occurred')
    }
  }

  const handleChangeRole = async (member: HouseholdUser, newRole: 'owner' | 'member') => {
    if (!currentUser) return

    // Only owners can change roles
    if (currentUser.role !== 'owner') {
      setError('Only household owners can change member roles')
      return
    }

    // Can't change your own role if you're the only owner
    if (member.id === currentUser.id) {
      const ownerCount = members.filter(m => m.role === 'owner').length
      if (ownerCount === 1 && newRole === 'member') {
        setError('You are the only owner. Promote another member to owner before demoting yourself.')
        return
      }
    }

    // Check owner limit
    if (newRole === 'owner') {
      const ownerCount = members.filter(m => m.role === 'owner').length
      if (ownerCount >= HOUSEHOLD_LIMITS.MAX_OWNERS) {
        setError(`Maximum ${HOUSEHOLD_LIMITS.MAX_OWNERS} owners per household`)
        return
      }
    }

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('household_users')
        .update({ role: newRole })
        .eq('id', member.id)

      if (updateError) {
        console.error('Error changing role:', updateError)
        setError('Failed to change member role')
        return
      }

      // Update local state
      setMembers(members.map(m =>
        m.id === member.id ? { ...m, role: newRole } : m
      ))

      // Update currentUser if it's you
      if (member.id === currentUser.id) {
        setCurrentUser({ ...currentUser, role: newRole })
      }

      setSuccess(`${member.name} is now ${newRole === 'owner' ? 'an owner' : 'a member'}`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error changing role:', err)
      setError('An unexpected error occurred')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading members...</p>
        </div>
      </div>
    )
  }

  const ownerCount = members.filter(m => m.role === 'owner').length
  const pendingInvites = members.filter(m => !m.auth_user_id).length
  const isOwner = currentUser?.role === 'owner'

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                HouseRater
              </Link>
              {household && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {household.name} - Members
                </p>
              )}
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Household Members
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage who has access to your household. Owners can invite users, manage categories, and change settings.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {members.length} / {HOUSEHOLD_LIMITS.MAX_USERS}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Owners</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {ownerCount} / {HOUSEHOLD_LIMITS.MAX_OWNERS}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Invites</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingInvites}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Invite User Button */}
        {isOwner && members.length < HOUSEHOLD_LIMITS.MAX_USERS && (
          <div className="mb-6">
            <button
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Invite User
            </button>
          </div>
        )}

        {/* Invite User Form */}
        {showInviteForm && (
          <div className="mb-8 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Invite User to Household
            </h3>
            <form onSubmit={handleInviteUser}>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'owner' | 'member')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="member">Member</option>
                    <option value="owner" disabled={ownerCount >= HOUSEHOLD_LIMITS.MAX_OWNERS}>
                      Owner {ownerCount >= HOUSEHOLD_LIMITS.MAX_OWNERS && '(Max reached)'}
                    </option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Send Invitation
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteForm(false)
                    setInviteName('')
                    setInviteEmail('')
                    setError('')
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Members List */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            All Members
          </h3>
          <div className="space-y-3">
            {members.map((member) => {
              const isPending = !member.auth_user_id
              const isYou = member.id === currentUser?.id

              return (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isPending
                        ? 'bg-yellow-100 dark:bg-yellow-900/30'
                        : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      <span className={`font-semibold ${
                        isPending
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.name}
                          {isYou && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(You)</span>
                          )}
                        </p>
                        {isPending && (
                          <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Role Badge/Selector */}
                    {isOwner && !isYou ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member, e.target.value as 'owner' | 'member')}
                        className="px-3 py-1.5 text-xs font-medium rounded-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        disabled={isPending}
                      >
                        <option value="member">Member</option>
                        <option value="owner" disabled={member.role !== 'owner' && ownerCount >= HOUSEHOLD_LIMITS.MAX_OWNERS}>
                          Owner
                        </option>
                      </select>
                    ) : (
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                        member.role === 'owner'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {member.role}
                      </span>
                    )}

                    {/* Remove Button */}
                    {isOwner && !isYou && (
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="p-2 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        title="Remove member"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">About Household Members</h3>
              <div className="mt-2 text-sm text-blue-800 dark:text-blue-300">
                <ul className="list-disc list-inside space-y-1">
                  <li>Households can have 2-{HOUSEHOLD_LIMITS.MAX_USERS} members</li>
                  <li>Up to {HOUSEHOLD_LIMITS.MAX_OWNERS} members can be owners</li>
                  <li>Owners can invite users, manage categories, and change settings</li>
                  <li>Regular members can rate categories and houses</li>
                  <li>Pending invites show until the invited user signs up with that email</li>
                  <li>When an invited user signs up or logs in with the matching email, they'll automatically join your household</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
