/**
 * myEcobetaApp accounts.
 *
 * The site is a fully static export: no API routes, no server at runtime. So the
 * sign-in / sign-up screen has to work with whatever the deployment points it at, and
 * `NEXT_PUBLIC_MYECOBETA_API_URL` is that seam:
 *
 *   - set it to the auth service and the same form POSTs there;
 *   - leave it unset and the screen runs in local mode, where the account is validated
 *     and then kept in memory for the session only. That is what the GitHub Pages
 *     deployment does today.
 *
 * The rules live here rather than inside the component so they are readable in one
 * place and can be exercised without a DOM.
 */

/** Message the authored hero posts when its myEcobetaApp pill is clicked. */
export const MYECOBETA_OPEN_MESSAGE = "myecobetaapp:open";

export const MYECOBETA_API_URL = process.env.NEXT_PUBLIC_MYECOBETA_API_URL ?? "";

/** No auth service configured: the form works, and nothing leaves the browser. */
export const MYECOBETA_IS_LOCAL = MYECOBETA_API_URL === "";

export type MyEcobetaAccount = {
  name: string;
  email: string;
};

export type MyEcobetaAuthMode = "sign-in" | "sign-up";

/** The fields the rules can reject; the form paints each one under its own input. */
export type MyEcobetaField = "name" | "email" | "password" | "passwordConfirmation" | "terms";

export type MyEcobetaFieldErrors = Partial<Record<MyEcobetaField, string>>;

export type MyEcobetaSignInValues = {
  email: string;
  password: string;
};

export type MyEcobetaSignUpValues = MyEcobetaSignInValues & {
  name: string;
  passwordConfirmation: string;
  terms: boolean;
};

/**
 * One error shape for the screen, whether the rejection came from the rules above or
 * from the service, so the component has a single path to paint.
 */
export class MyEcobetaAuthError extends Error {
  readonly fieldErrors: MyEcobetaFieldErrors;

  constructor(message: string, fieldErrors: MyEcobetaFieldErrors = {}) {
    super(message);
    this.name = "MyEcobetaAuthError";
    this.fieldErrors = fieldErrors;
  }
}

/*
 * Deliberately loose. The address is only shape-checked here because the real check
 * belongs to whatever service the form posts to, and a stricter pattern refuses valid
 * addresses far more often than it catches a typo.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;

/**
 * The two letters both screens put in the account's avatar. Here rather than in either of
 * them, so the hero's account panel and the recycling sheet cannot initial the same name
 * differently.
 */
export function accountInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export function validateSignIn({ email, password }: MyEcobetaSignInValues): MyEcobetaFieldErrors {
  const errors: MyEcobetaFieldErrors = {};

  if (!email.trim()) errors.email = "Indique o seu e-mail.";
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Esse e-mail não parece válido.";

  if (!password) errors.password = "Indique a sua palavra-passe.";

  return errors;
}

export function validateSignUp(values: MyEcobetaSignUpValues): MyEcobetaFieldErrors {
  const errors = validateSignIn(values);

  if (!values.name.trim()) errors.name = "Indique o seu nome.";

  if (!errors.password && values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  if (!values.passwordConfirmation) errors.passwordConfirmation = "Repita a palavra-passe.";
  else if (values.passwordConfirmation !== values.password) {
    errors.passwordConfirmation = "As palavras-passe não coincidem.";
  }

  if (!values.terms) errors.terms = "É preciso aceitar os termos para criar a conta.";

  return errors;
}

function hasErrors(errors: MyEcobetaFieldErrors) {
  return Object.keys(errors).length > 0;
}

export async function signIn(values: MyEcobetaSignInValues): Promise<MyEcobetaAccount> {
  const fieldErrors = validateSignIn(values);
  if (hasErrors(fieldErrors)) throw new MyEcobetaAuthError("Verifique os campos assinalados.", fieldErrors);

  if (MYECOBETA_IS_LOCAL) return localAccount(values.email);
  return request<MyEcobetaAccount>("/sign-in", { email: values.email.trim(), password: values.password });
}

export async function signUp(values: MyEcobetaSignUpValues): Promise<MyEcobetaAccount> {
  const fieldErrors = validateSignUp(values);
  if (hasErrors(fieldErrors)) throw new MyEcobetaAuthError("Verifique os campos assinalados.", fieldErrors);

  if (MYECOBETA_IS_LOCAL) return { name: values.name.trim(), email: values.email.trim() };
  return request<MyEcobetaAccount>("/sign-up", {
    name: values.name.trim(),
    email: values.email.trim(),
    password: values.password,
  });
}

/**
 * The only place the screen talks to a service. A body of `{ message, fieldErrors }` is
 * honoured, so the service can hand field-level problems back into the form; anything
 * else becomes the one message.
 */
async function request<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${MYECOBETA_API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // The session cookie belongs to the service, not to this origin.
      credentials: "include",
      body: JSON.stringify(body),
    });
  } catch {
    throw new MyEcobetaAuthError("Não foi possível contactar o serviço. Verifique a ligação.");
  }

  const payload = (await response.json().catch(() => null)) as
    | (T & { message?: string; fieldErrors?: MyEcobetaFieldErrors })
    | null;

  if (!response.ok || !payload) {
    throw new MyEcobetaAuthError(
      payload?.message ?? "O serviço recusou o pedido. Tente novamente.",
      payload?.fieldErrors ?? {},
    );
  }

  return payload;
}

/**
 * Local mode has no directory to ask, so the name the account shows is derived from the
 * address. Everything here is discarded when the tab closes.
 */
function localAccount(email: string): MyEcobetaAccount {
  const [localPart] = email.trim().split("@");
  const words = localPart
    .split(/[.\-_+]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

  return { name: words.join(" ") || localPart, email: email.trim() };
}
