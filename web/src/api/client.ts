import ky from "ky";
import type {
  CheckResponse,
  GameResponse,
  InfoResponse,
  InviteCodeResponse,
  RedeemResponse,
  StatusResponse,
} from "@/api/types";
import { getApiBase, getToken, redirectToLogin } from "@/utils";

const api = ky.create({
  prefixUrl: getApiBase(),
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getToken();
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      (_request, _options, response) => {
        if (response.status === 401) {
          redirectToLogin();
        }
      },
    ],
  },
});

export async function fetchGame(): Promise<GameResponse> {
  return api.get("game").json<GameResponse>();
}

export async function fetchInfo(): Promise<InfoResponse> {
  return api.get("info").json<InfoResponse>();
}

export async function postCheck(): Promise<CheckResponse> {
  return api.post("check").json<CheckResponse>();
}

export async function getInviteCode(): Promise<InviteCodeResponse> {
  return api.get("invite_code").json<InviteCodeResponse>();
}

export async function patchInviteCode(): Promise<InviteCodeResponse> {
  return api.patch("invite_code").json<InviteCodeResponse>();
}

export async function getStatus(): Promise<StatusResponse> {
  return api.get("status").json<StatusResponse>();
}

export async function redeemCode(invite_code: string): Promise<RedeemResponse> {
  return api.post("redeem_code", { json: { invite_code } }).json<RedeemResponse>();
}

export { api };
