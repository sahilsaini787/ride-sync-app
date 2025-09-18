/**
 * RideManagement Component
 * 
 * This component provides the UI and logic for managing ride groups.
 * Users can create groups, invite members, view group details, and start rides.
 * Handles group CRUD operations, member invitations, and conditional rendering for group management.
 */

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Settings, Trash2, LogOut } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { apiClient, type Group, type GroupMember, type User } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"

/**
 * Props for RideManagement
 * - onSelectRide: Callback when a ride/group is selected to start
 * - currentUser: The currently logged-in user
 */
interface RideManagementProps {
  onSelectRide: (ride: any) => void
  currentUser: User
}

export function RideManagement({ onSelectRide, currentUser }: RideManagementProps) {
  // State for all groups the user is part of
  const [groups, setGroups] = useState<Group[]>([])
  // Currently selected group for management/details
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  // Members of the selected group
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  // Dialog visibility for creating a group
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  // Dialog visibility for inviting a member
  const [showAddMember, setShowAddMember] = useState(false)
  // Loading state for async operations
  const [loading, setLoading] = useState(true)
  // Error message for UI display
  const [error, setError] = useState("")
  // Auth hook for logout functionality
  const { logout } = useAuth()

  // Form states for group creation and member invitation
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [memberEmail, setMemberEmail] = useState("")

  // Load user's groups on initial mount
  useEffect(() => {
    loadUserGroups()
  }, [])

  // When a group is selected, load its members
  useEffect(() => {
    if (selectedGroup) {
      loadGroupMembers(selectedGroup.id)
    }
  }, [selectedGroup])

  /**
   * Fetch all groups the current user is a member of.
   * Updates the groups state and handles loading/error.
   */
  const loadUserGroups = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getUserGroups()
      if (response.success) {
        setGroups(response.data)
      } else {
        setError("Failed to load groups")
      }
    } catch (err) {
      setError("Failed to load groups")
      console.error("Error loading groups:", err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch members for a given group.
   * Updates groupMembers state and handles error.
   */
  const loadGroupMembers = async (groupId: string) => {
    try {
      const response = await apiClient.getGroupMembers(groupId)
      if (response.success) {
        setGroupMembers(response.data)
      } else {
        setError("Failed to load group members")
      }
    } catch (err) {
      setError("Failed to load group members")
      console.error("Error loading group members:", err)
    }
  }

  /**
   * Create a new group with the provided name and description.
   * On success, adds the group to the list and resets form state.
   */
  const handleCreateGroup = async () => {
    if (!groupName.trim()) return

    try {
      const response = await apiClient.createGroup({
        name: groupName,
        description: groupDescription,
      })

      if (response.success) {
        setGroups([...groups, response.data])
        setGroupName("")
        setGroupDescription("")
        setShowCreateGroup(false)
      } else {
        setError("Failed to create group")
      }
    } catch (err) {
      setError("Failed to create group")
      console.error("Error creating group:", err)
    }
  }

  /**
   * Invite a new member to the selected group by email.
   * On success, reloads group members to reflect changes.
   */
  const handleAddMember = async () => {
    if (!selectedGroup || !memberEmail.trim()) return

    try {
      const response = await apiClient.sendGroupInvite(selectedGroup.id, {
        email: memberEmail,
      })

      if (response.success) {
        setMemberEmail("")
        setShowAddMember(false)
        // Reload group members to get updated list
        await loadGroupMembers(selectedGroup.id)
      } else {
        setError("Failed to send invite")
      }
    } catch (err) {
      setError("Failed to send invite")
      console.error("Error sending invite:", err)
    }
  }

  /**
   * Remove a group from the local state.
   * Note: No API call since delete endpoint is missing.
   */
  const handleDeleteGroup = async (groupId: string) => {
    // Note: The API doesn't have a delete group endpoint in the swagger
    // For now, we'll just remove it from local state
    setGroups(groups.filter((group) => group.id !== groupId))
    if (selectedGroup?.id === groupId) {
      setSelectedGroup(null)
    }
  }

  /**
   * Trigger ride start for the selected group.
   */
  const handleJoinGroup = (group: Group) => {
    onSelectRide({ ...group, type: "group" })
  }

  /**
   * Log out the current user.
   */
  const handleLogout = async () => {
    await logout()
  }

  // UI rendering branch: Show loading spinner while fetching data
  if (loading) {
    // This branch displays a centered spinner and message while groups are being loaded.
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading groups...</p>
        </div>
      </div>
    )
  }

  // UI rendering branch: If a group is selected, show its details and members
  if (selectedGroup) {
    // This branch displays group details, member list, and group-specific actions.
    return (
      <div className="h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header: Group details and actions */}
          <div className="flex items-center justify-between">
            <div>
              {/* Back button returns to main group list */}
              <Button variant="outline" onClick={() => setSelectedGroup(null)} className="mb-4">
                ← Back to Groups
              </Button>
              {/* Group name and description */}
              <h1 className="text-2xl font-bold text-primary">{selectedGroup.name}</h1>
              <p className="text-muted-foreground">{selectedGroup.description}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span>Created: {new Date(selectedGroup.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {/* Invite member dialog: Opens modal to invite new member by email */}
              <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite New Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="member-email">Email</Label>
                      <Input
                        id="member-email"
                        type="email"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        placeholder="Enter email address"
                      />
                    </div>
                    <Button onClick={handleAddMember} className="w-full">
                      Send Invite
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              {/* Start ride button: Initiates ride for this group */}
              <Button onClick={() => handleJoinGroup(selectedGroup)} className="bg-primary">
                Start Ride
              </Button>
            </div>
          </div>

          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

          {/* Members List: Displays all members in the selected group */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members ({groupMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupMembers.map((member) => (
                  <div key={member.id} className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Member details: name, username, email, role */}
                        <div className="font-medium">{member.user.name}</div>
                        <div className="text-sm text-muted-foreground">@{member.user.username}</div>
                        <div className="text-sm text-muted-foreground">{member.user.email}</div>
                        <Badge className="mt-2" variant="outline">
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Main UI rendering branch: List all groups, allow creation, management, and ride start
  return (
    <div className="h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header: User info and actions */}
        <div className="flex items-center justify-between">
          <div>
            {/* Main title and user greeting */}
            <h1 className="text-3xl font-bold text-primary">My Groups</h1>
            <p className="text-muted-foreground">Create and manage your ride groups</p>
            <p className="text-sm text-muted-foreground mt-1">Welcome, {currentUser.name}</p>
          </div>
          <div className="flex gap-2">
            {/* Create group dialog: Opens modal to create a new group */}
            <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
              <DialogTrigger asChild>
                <Button className="bg-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="group-name">Group Name</Label>
                    <Input
                      id="group-name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Enter group name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="group-description">Description (Optional)</Label>
                    <Textarea
                      id="group-description"
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      placeholder="Enter group description"
                    />
                  </div>
                  <Button onClick={handleCreateGroup} className="w-full">
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {/* Logout button: Ends user session */}
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

        {/* Groups Grid: Show all groups or empty state */}
        {groups.length === 0 ? (
          // Empty state: No groups yet, prompt user to create one
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <Users className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-medium">No groups yet</h3>
                <p className="text-muted-foreground">Create your first group to get started</p>
              </div>
              <Button onClick={() => setShowCreateGroup(true)} className="bg-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Group
              </Button>
            </div>
          </Card>
        ) : (
          // Groups grid: Show all groups with management and ride start actions
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <div className="text-sm text-muted-foreground mt-1">
                        Created by: {group.createdBy === currentUser.id ? "You" : "Someone else"}
                      </div>
                    </div>
                    {/* Delete group button: Removes group from local state */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{group.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(group.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {/* Manage group button: Opens group details and member management */}
                    <Button variant="outline" size="sm" onClick={() => setSelectedGroup(group)} className="flex-1">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                    {/* Start ride button: Initiates ride for this group */}
                    <Button size="sm" onClick={() => handleJoinGroup(group)} className="flex-1 bg-primary">
                      Start Ride
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
