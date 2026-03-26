export class SendMessageDto {
  content: string;
  // To direct message
  receiverId?: string;
  // To channel message
  channelId?: string;
}
