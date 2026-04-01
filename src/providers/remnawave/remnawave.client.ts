import axios, { AxiosInstance } from "axios";
import { env } from "../../config/env";
import { getExpiredDateIso } from "../../utils/date";

type AddRemnawaveUserInput = {
  username: string;
  chatId?: number;
  description?: string;
  email?: string;
  expireAt?: string;
};

type UpdateRemnawaveUserInput = {
  expireAt?: string;
};

type InternalSquadsResponse = {
  response?: {
    internalSquads?: Array<{ uuid?: string }>;
  };
};

export class RemnawaveClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: env.remnawaveApiUrl,
      timeout: 10_000,
    });
  }

  private getAuthHeaders(): Record<string, string> {
    if (!env.remnawaveApiUrl || !env.remnawaveApiToken) {
      throw new Error("REMNAWAVE_API_URL или REMNAWAVE_API_TOKEN не заданы");
    }
    return {
      Authorization: `Bearer ${env.remnawaveApiToken}`,
    };
  }

  async getFirstInternalSquadUuid(): Promise<string | null> {
    const { data } = await this.http.get<InternalSquadsResponse>(
      "/api/internal-squads",
      {
        headers: this.getAuthHeaders(),
      },
    );
    return data?.response?.internalSquads?.[0]?.uuid ?? null;
  }

  async addUser(input: AddRemnawaveUserInput): Promise<unknown> {
    if (!env.remnawaveNewUserTag) {
      throw new Error("REMNAWAVE_NEW_USER_TAG не задан");
    }

    const internalSquadUuid = await this.getFirstInternalSquadUuid();

    const payload: Record<string, unknown> = {
      description: input.description,
      expireAt: input.expireAt ?? getExpiredDateIso(),
      hwidDeviceLimit: 0,
      status: "ACTIVE",
      telegramId: input.chatId ? Number(input.chatId) : undefined,
      trafficLimitBytes: 0,
      tag: env.remnawaveNewUserTag,
      trafficLimitStrategy: "NO_RESET",
      username: String(input.username),
    };

    if (input.email) {
      payload.email = input.email;
    }
    if (internalSquadUuid) {
      payload.activeInternalSquads = [internalSquadUuid];
    }
    try {
      const { data } = await this.http.post("/api/users", payload, {
        headers: this.getAuthHeaders(),
      });
      return data;
    } catch (error) {
      throw new Error(
        (error as any)?.response?.data?.message ?? "Unknown error",
      );
    }
  }

  async updateUserByPhone(
    phone: string,
    input: UpdateRemnawaveUserInput,
  ): Promise<unknown> {
    const payload = {
      username: String(phone),
      expireAt: input.expireAt,
    };

    const { data } = await this.http.patch("/api/users", payload, {
      headers: this.getAuthHeaders(),
    });
    return data;
  }
}

export const remnawaveClient = new RemnawaveClient();
