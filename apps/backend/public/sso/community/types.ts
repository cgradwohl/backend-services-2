export interface ISsoCommunityRequest {
  sig: string;
  sso: string;
}

export interface ISsoCommunityResponseRequest {
  accessToken: string;
  nonce: string;
}
