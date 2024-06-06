export type UserSubscriber = {
  user:        User;
  userService: UserServiceInfo;
}

export type User = {
  at_hash:             string;
  sub:                 string;
  aud:                 string[];
  role:                string[];
  azp:                 string;
  iss:                 string;
  documento:           string;
  documento_compuesto: string;
  exp:                 number;
  nonce:               string;
  iat:                 number;
  email:               string;
}

export type UserServiceInfo = {
  role:                string[];
  documento:           string;
  documento_compuesto: string;
  email:               string;
  FamilyName:          string;
  Codigo:              string;
  Estado:              string;
}
