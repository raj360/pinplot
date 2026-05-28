const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type SendCodeResponse = {
  success: boolean;
  message?: string;
  devCode?: string;
};

export type VerifyCodeResponse = {
  success: boolean;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  message?: string;
};

/** PlotPin-owned OTP — code logged to API terminal in dev; Postmark later. */
export async function sendLoginCode(email: string): Promise<SendCodeResponse> {
  const res = await fetch(`${API_URL}/api/v1/auth/login/send-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = (await res.json()) as SendCodeResponse;
  if (!res.ok || !data.success) {
    throw new Error(data.message ?? "Could not send sign-in code");
  }
  return data;
}

export async function verifyLoginCode(
  email: string,
  code: string,
): Promise<VerifyCodeResponse> {
  const res = await fetch(`${API_URL}/api/v1/auth/login/verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  const data = (await res.json()) as VerifyCodeResponse & {
    message?: string | string[];
  };
  if (!res.ok || !data.success) {
    const msg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message;
    throw new Error(msg ?? "Invalid or expired code");
  }
  return data;
}
