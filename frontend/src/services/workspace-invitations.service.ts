import api from './api';

export interface WorkspaceInvitationView {
  id: string;
  workspaceId: string;
  workspaceName: string | null;
  inviterId: string;
  inviter: {
    id: string;
    username: string;
    fullName: string | null;
  } | null;
  inviteeId: string | null;
  inviteeEmail: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
}

export const workspaceInvitationsService = {
  async preview(token: string): Promise<WorkspaceInvitationView> {
    const res = await api.get<WorkspaceInvitationView>(
      '/workspace-invitations/preview',
      {
        params: { token },
      },
    );

    return res.data;
  },

  async claim(token: string): Promise<WorkspaceInvitationView> {
    const res = await api.post<WorkspaceInvitationView>(
      '/workspace-invitations/claim',
      {
        token,
      },
    );

    return res.data;
  },

  async respond(
    invitationId: string,
    action: 'accept' | 'decline',
  ): Promise<WorkspaceInvitationView> {
    const res = await api.patch<WorkspaceInvitationView>(
      `/workspace-invitations/${invitationId}`,
      {
        action,
      },
    );

    return res.data;
  },

  async inviteMember(
    workspaceId: string,
    payload: { email: string; role: 'admin' | 'member' },
  ): Promise<WorkspaceInvitationView> {
    const res = await api.post<WorkspaceInvitationView>(
      `/workspaces/${workspaceId}/invitations`,
      payload,
    );

    return res.data;
  },
};
