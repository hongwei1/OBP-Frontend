export interface OBPConsent {
  consent_reference_id: string;
  consent_id: string;
  consumer_id: string;
  created_by_user_id: string;
  status: string;
  created_date?: string;
  last_action_date: string;
  last_usage_date: string;
  everything?: boolean;
  jwt: string;
  jwt_payload: {
    createdByUserId: string;
    sub: string;
    iss: string;
    aud: string;
    jti: string;
    iat: number;
    nbf: number;
    exp: number;
    request_headers: any[];
    entitlements: any[];
    views: any[];
  };
  api_standard: string;
  api_version: string;
}

export interface OBPConsentInfo {
  consent_id: string;
  consumer_id: string;
  created_by_user_id: string;
  last_action_date: string;
  last_usage_date: string;
  status: string;
  api_standard: string;
  api_version: string;
}

export interface OBPConsumer {
  consumer_id: string;
  key?: string;
  secret?: string;
  app_name: string;
  app_type: "public" | "confidential";
  description: string;
  developer_email: string;
  redirect_url: string;
  company: string;
  created_by_user_id: string;
  created_by_user: {
    user_id: string;
    email: string;
    provider_id: string;
    provider: string;
    username: string;
  };
  enabled: boolean;
  created: string;
}

export interface OBPConsumerRequestBody {
  app_type: "public" | "confidential";
  app_name: string;
  redirect_url: string;
  developer_email: string;
  description: string;
  company: string;
  enabled: boolean;
}

export interface OBPUserRegistrationRequestBody {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface OBPAddEntitlementBody {
  role_name: string;
  bank_id?: string;
}

export interface OBPWebUIProp {
  web_ui_props_id: string;
  name: string;
  value: string;
  description?: string;
  is_active?: boolean;
  source?: string;
}

export interface OBPWebUIPropsResponse {
  webui_props: OBPWebUIProp[];
}

export interface OBPWebUIPropRequestBody {
  name: string;
  value: string;
}
