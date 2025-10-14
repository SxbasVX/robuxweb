'use client';
import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import GroupHomeEditor from './GroupHomeEditor';

interface GroupHomePageProps {
  groupId: number;
  groupTopic: string;
  currentUser?: any;
}

export default function GroupHomePage({ groupId, groupTopic, currentUser }: GroupHomePageProps) {
  const { user, role } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);

  console.log('🔍 GroupHomePage Debug:', {
    currentUser,
    userFromAuth: user,
    roleFromAuth: role,
    finalUser: currentUser || user
  });

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  return (
    <GroupHomeEditor
      groupId={groupId}
      currentUser={currentUser || user}
      isEditMode={isEditMode}
      onToggleEdit={toggleEditMode}
      groupTopic={groupTopic}
    />
  );
}