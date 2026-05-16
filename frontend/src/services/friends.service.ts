import api from './api';

export interface Friend {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  status: 'online' | 'offline' | 'in-game';
}

export interface FriendRequest {
  id: string;
  senderId?: string;
  receiverId?: string;
  targetUserId?: string;
  status?: 'pending' | 'accepted' | 'rejected';
  createdAt?: string;
  sender?: Friend;
  receiver?: Friend;
}

export const friendsService = {
  // 2.3 List Friends
  async getFriends(): Promise<Friend[]> {
    const response = await api.get('/friends');
    return response.data;
  },

  // 2.4 List Friend Requests (Pendentes recebidos e enviados)
  async getFriendRequests(): Promise<FriendRequest[]> {
    const response = await api.get('/friend-requests');
    return response.data;
  },

  // 2.5 Send Friend Request
  async sendRequest(targetUserId: string) {
    const response = await api.post('/friend-requests', { targetUserId });
    return response.data;
  },

  // 2.6 Accept Friend Request
  async acceptRequest(requestId: string) {
    const response = await api.patch(`/friend-requests/${requestId}`, {
      action: 'accept'
    });
    return response.data;
  },

  // 2.7 Reject Friend Request
  async rejectRequest(requestId: string) {
    const response = await api.patch(`/friend-requests/${requestId}`, {
      action: 'reject'
    });
    return response.data;
  },

  // 2.8 Remove Friend
  async removeFriend(friendId: string) {
    const response = await api.delete(`/friends/${friendId}`);
    return response.data;
  }
};
