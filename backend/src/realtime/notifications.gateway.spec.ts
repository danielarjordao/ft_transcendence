jest.mock('../notifications/notifications.service', () => ({
  NotificationsService: class NotificationsService {},
}));

import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from '../notifications/notifications.service';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  const notificationsService = {
    update: jest.fn(),
  } as unknown as NotificationsService;

  function createClient(userId?: string) {
    return {
      id: 'socket-1',
      data: userId ? { user: { id: userId } } : {},
      emit: jest.fn(),
    } as any;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new NotificationsGateway(notificationsService);
  });

  it('mark_notification_read autenticado chama service', async () => {
    (notificationsService.update as jest.Mock).mockResolvedValue(undefined);
    const client = createClient('user-1');

    await gateway.handleMarkNotificationRead(client, {
      notificationId: 'ntf-1',
    });

    expect(notificationsService.update).toHaveBeenCalledWith(
      'user-1',
      'ntf-1',
      true,
    );
  });

  it('mark_notification_read sem autenticacao nao chama service', async () => {
    const client = createClient();

    await gateway.handleMarkNotificationRead(client, {
      notificationId: 'ntf-1',
    });

    expect(notificationsService.update).not.toHaveBeenCalled();
  });

  it('mark_notification_read sem notificationId nao chama service', async () => {
    const client = createClient('user-1');

    await gateway.handleMarkNotificationRead(client, {
      notificationId: '',
    });

    expect(notificationsService.update).not.toHaveBeenCalled();
  });

  it('mark_notification_read engole erro do service sem propagar', async () => {
    (notificationsService.update as jest.Mock).mockRejectedValue(
      new Error('boom'),
    );
    const client = createClient('user-1');

    await expect(
      gateway.handleMarkNotificationRead(client, {
        notificationId: 'ntf-1',
      }),
    ).resolves.toBeUndefined();
  });
});
