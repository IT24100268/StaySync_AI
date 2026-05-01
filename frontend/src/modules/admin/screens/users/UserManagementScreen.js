import React, { useState } from "react";
import { Alert } from "react-native";
import EmptyState from "../../../../components/common/EmptyState";
import LoadingOverlay from "../../../../components/common/LoadingOverlay";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import SectionHeader from "../../../../components/common/SectionHeader";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import FilterTabs from "../../components/common/FilterTabs";
import SearchBar from "../../components/common/SearchBar";
import UserManagementCard from "../../components/cards/UserManagementCard";
import { useUserManagement } from "../../context/UserManagementContext";
import { USER_ROLE_FILTERS } from "../../utils/constants";

export default function UserManagementScreen({ navigation }) {
  const {
    filteredUsers,
    loading,
    searchQuery,
    roleFilter,
    setSearchQuery,
    setRoleFilter,
    toggleBlockUser,
  } = useUserManagement();
  const [selectedUser, setSelectedUser] = useState(null);
  const [blockReason, setBlockReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <ScreenContainer>
      <SectionHeader title="User management" subtitle="Search, filter, and moderate platform accounts." />
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search users by name or email" />
      <FilterTabs options={USER_ROLE_FILTERS} value={roleFilter} onChange={setRoleFilter} />

      {filteredUsers.length === 0 ? (
        <EmptyState title="No users found" description="Try updating your search or role filter." icon="people-outline" />
      ) : (
        filteredUsers.map((user) => (
          <UserManagementCard
            key={user.id}
            user={user}
            onOpen={() => navigation.navigate("UserDetails", { userId: user.id })}
            onToggleBlock={() => {
              setSelectedUser(user);
              setBlockReason(user.blockedReason || "");
              setReasonError("");
            }}
          />
        ))
      )}

      <ConfirmationModal
        visible={Boolean(selectedUser)}
        title={selectedUser?.isBlocked ? "Unblock this user?" : "Block this user?"}
        message={
          selectedUser?.isBlocked
            ? "This will restore login access for the user."
            : "This action updates the moderation status and prevents login until the user is unblocked."
        }
        inputLabel={selectedUser?.isBlocked ? "Stored block reason" : "Block reason"}
        inputValue={blockReason}
        onInputChange={setBlockReason}
        inputPlaceholder="Enter the reason for blocking this user"
        inputError={reasonError}
        confirmLabel={selectedUser?.isBlocked ? "Unblock" : "Block"}
        onConfirm={async () => {
          if (!selectedUser?.isBlocked && !blockReason.trim()) {
            setReasonError("Reason is required.");
            return;
          }

          const result = await toggleBlockUser(selectedUser.id, blockReason.trim());
          if (!result.success) {
            Alert.alert("Update Failed", result.message);
            return;
          }

          setSelectedUser(null);
          setBlockReason("");
          setReasonError("");
        }}
        onCancel={() => {
          setSelectedUser(null);
          setBlockReason("");
          setReasonError("");
        }}
      />
    </ScreenContainer>
  );
}
