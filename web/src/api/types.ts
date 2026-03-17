export interface UserBrief {
  id: number;
  account: string;
  nickname: string;
  avatar_uri: string;
}

export interface TeamBrief {
  id: number;
  name: string;
}

export interface GameBrief {
  id: number;
  name: string;
  brief: string;
  logo_uri: string;
}

export interface BonusInfo {
  game_id: number;
  bonus_score: number;
  max_score: number;
  game_ended: boolean;
}

export interface InfoResponse {
  user: UserBrief;
  game: GameBrief;
  bonus: BonusInfo;
}

export interface CheckTeam {
  id: number;
  name: string;
  members: number[];
  total_bonus: number;
}

export interface CheckResponse {
  game_id: number;
  user: UserBrief;
  team: CheckTeam;
}

export interface InviteCodeResponse {
  invite_code: string;
}

export interface InvitedEntry {
  user: UserBrief;
  invite_code: string;
  timestamp: number;
  bonus_team: TeamBrief;
  bonus_score: number;
}

export interface FromEntry {
  invite_code: string;
  peer_user: UserBrief;
  peer_team: TeamBrief;
  timestamp: number;
}

export interface StatusResponse {
  invite_code: string;
  invited: InvitedEntry[];
  from: FromEntry | null;
}

export interface RedeemResponse {
  user_id: number;
  invite_code: string;
  peer_user: UserBrief;
  peer_team: TeamBrief;
  timestamp: number;
}
