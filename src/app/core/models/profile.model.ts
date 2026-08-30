/** Shape of the MapnaCM profile API response (AccountService.GetProfile). */
export interface UserProfile {
  id: string;
  userName: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  emailConfirmed?: boolean;
  phoneNumberConfirmed?: boolean;
  isActive?: boolean;
  /** Absolute URL of the stored avatar (served from backend wwwroot), if any. */
  avatarImagePath?: string | null;
}
