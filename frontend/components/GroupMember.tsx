import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CustomButton from "./CustomButton";
import AcceptInvitationButton from "./AcceptInvitationButton";
import DeclineInvitationButton from "./DeclineInvitationButton";

// Types
type GroupMember = {
  id: string;
  userId: string;
  userRole: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
};

type JoinRequest = {
  id: string;
  groupId: string;
  userId: string;
  status: string;
  type: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
};

type Props = {
  groupId: string;
  userId: string;
  showAmountEach?: boolean;
  showEstimatedText?: boolean;
  showInvitations?: boolean;
  showHeader?: boolean;
  requestConfirmSent?: boolean;
  joinRequests?: JoinRequest[];
  invitations?: Invitation[];
  onJoinRequestResponse?: () => void;
};

type Group = {
  amountEach: number;
}

type Invitation = {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
}

const GroupMembers: React.FC<Props> = ({
  groupId,
  userId,
  showAmountEach,
  showEstimatedText,
  showInvitations,
  showHeader,
  requestConfirmSent,
  joinRequests = [],
  invitations = [],
  onJoinRequestResponse
}) => {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLeader, setIsLeader] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [confirmationStatus, setConfirmationStatus] = useState<Record<string, boolean>>({});


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [groupRes, roleRes] = await Promise.all([
          axios.get(`${API_URL}/api/group/${groupId}`),
          axios.get(`${API_URL}/api/groupMember/${groupId}/${userId}`)
        ]);

        setMembers(groupRes.data.members);
        setGroup(groupRes.data);
        setIsLeader(roleRes.data.isLeader);
        setError(null);
        const fetchConfirmations = async () => {
          try {
            const confirmations = await Promise.all(
              groupRes.data.members.map(async (member: GroupMember) => {
                const res = await axios.get(`${API_URL}/api/cfshare/check-status/${groupId}/${member.userId}`);
                console.log(res.data);
                return { userId: member.userId, status: res.data };
              })
            );

            const statusMap: Record<string, boolean> = {};
            confirmations.forEach(({ userId, status }) => {
              statusMap[userId] = status;
            });

            setConfirmationStatus(statusMap);
          } catch (err) {
            console.error("Failed to fetch confirmations", err);
          }
        };

        await fetchConfirmations();
      } catch (err) {
        console.error("Failed to fetch members or role", err);
        setError("Failed to load members");
      } finally {
        setLoading(false);
      }
    };

    if (groupId && userId) {
      fetchData();
    }
  }, [groupId, userId]);

  const handleInvite = () => {
    router.push({
      pathname: "/(group)/inviteMember",
      params: { groupId },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4353FD" />
        <Text style={styles.loadingText}>Loading members...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  console.log(invitations);
  return (
    <ScrollView style={styles.container}>
      {showHeader &&
        <View style={styles.header}>
          <Text style={styles.title}>Members</Text>
          {isLeader && (
            <TouchableOpacity style={styles.addButton} onPress={handleInvite}>
              <Ionicons name="add" size={20} color="black" />
            </TouchableOpacity>
          )}
        </View>
      }

      {members.map((member, index) => (
        <View key={member.id} style={styles.memberRow}>
          <View
            style={[styles.avatar, { backgroundColor: getAvatarColor(index) }]}
          >
            <Text style={styles.initials}>
              {member.user.firstName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.info}>
            <View style={styles.firstRow}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>
                  {member.user.firstName} {member.user.lastName}
                </Text>
                {member.userRole === "leader" && (
                  <View style={styles.leaderBadge}>
                    <Text style={styles.leaderText}>Leader</Text>
                  </View>
                )}
              </View>
              {showEstimatedText && <Text style={styles.estimate}>Estimated</Text>}
              {requestConfirmSent && group && <Text style={styles.price}>${group.amountEach}</Text>}
            </View>
            <View style={styles.amountEach}>
              <Text style={styles.username}>{member.user.username}</Text>
              {showAmountEach && group && <Text style={styles.price}>${group.amountEach}</Text>}
              {requestConfirmSent && (
                <Text
                  style={[
                    styles.estimate,
                    confirmationStatus[member.userId] ? styles.confirmedText : styles.waitingText,
                  ]}
                >
                  {confirmationStatus[member.userId] ? "Confirmed share" : "Waiting for confirmation"}
                </Text>
              )}
            </View>
          </View>
        </View>
      ))}
      {isLeader && showInvitations && (
        <>
          <CustomButton
            text="Set shares & request confirmation"
            onPress={() => {
              router.push({
                pathname: "/(group)/setMemberShares",
                params: { groupId },
              });
            }}
            size="large"
            fullWidth
          />
          <Text style={styles.textInvitation}>Pending invites</Text>
          {invitations.length > 0 ? (
            invitations.map((invitation, index) => (
              <View key={invitation.id} style={styles.memberRow}>
                <View
                  style={[styles.avatar, { backgroundColor: "#4A3DE3" }]}
                >
                  <Text style={styles.initials}>
                    {invitation.user.firstName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>
                      {invitation.user.firstName} {invitation.user.lastName}
                    </Text>
                  </View>
                  <Text style={styles.username}>{invitation.user.username}</Text>
                </View>
                <CustomButton
                  text="Invited"
                  style={styles.buttonInvited}
                  textStyle={styles.textInvited}
                />
              </View>
            ))
          ) : (
            <></>
          )}

          {/* Pending Requests Section - Only show for leaders */}
          {isLeader && joinRequests.length > 0 && (
            <>
              <Text style={styles.textInvitationRequests}>Pending requests</Text>
              {joinRequests.map((request, index) => (
                <View key={request.id} style={styles.memberRow}>
                  <View
                    style={[styles.avatar, { backgroundColor: "#FF6B35" }]}
                  >
                    <Text style={styles.initials}>
                      {request.user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View style={styles.info}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>
                        {request.user?.firstName || 'Unknown'} {request.user?.lastName || 'User'}
                      </Text>
                    </View>
                    <Text style={styles.username}>{request.user?.username || 'No username'}</Text>
                  </View>
                  <View style={styles.requestButtons}>
                    <DeclineInvitationButton
                      userId={request.userId}
                      groupId={groupId}
                      onResponse={onJoinRequestResponse}
                    />
                    <AcceptInvitationButton
                      userId={request.userId}
                      groupId={groupId}
                      onResponse={onJoinRequestResponse}
                    />
                  </View>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
};

export default GroupMembers;

const getAvatarColor = (index: number) => {
  const colors = ["#4CD964", "#007AFF", "#5856D6", "#34C759", "#FF9500"];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  addButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
    marginLeft: 10,
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  initials: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  firstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  estimate: {
    color: '#94A3B8'
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  leaderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    marginLeft: 8,
    borderColor: '#4A3DE3',
    borderWidth: 1
  },
  leaderText: {
    color: "#4A3DE3",
    fontSize: 10,
    fontWeight: "600",
  },
  username: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  amountEach: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  textInvitation: {
    color: "#64748B",
    marginTop: 16,
    marginBottom: 16,
    marginLeft: 0,
    marginRight: 12,
    fontWeight: 500,
    fontSize: 16,
  },
  textInvitationRequests: {
    color: "#64748B",
    marginBottom: 16,
    marginLeft: 0,
    marginRight: 12,
    fontWeight: 500,
    fontSize: 16,
  },
  buttonInvited: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  textInvited: {
    color: '#9EA2AE',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmedText: {
    color: "#10B981",
    fontSize: 12
  },
  waitingText: {
    color: "#FBBF24",
    fontSize: 12
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  buttonDecline: {
    backgroundColor: '#F3F4F6',
    flex: 1,
  },
  buttonAccept: {
    backgroundColor: '#4F46E5',
    flex: 1,
  },
  textDecline: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
  textAccept: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
