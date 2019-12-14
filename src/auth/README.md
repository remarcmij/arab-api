# Authentication Processes

## 1. Password reset

### 1.1 Use Case

A registered user want to sign in to the system but has forgotten his password. There is no token in `localStorage`.

### 1.2 Process

| Actor | Path | Action |
|-------|------|--------|
| frontend | `/login` | The user accesses the **SignIn** form on the client and clicks the **Forgot your password?** link. This brings up the **PasswordReset** form. |
| frontend | `/reset` | The user enter his email address on the **PasswordReset** form and presses the **Submit** button. The frontend sends a `POST` request to the backend with the user's `email` address in the request body. |
| backend |  `POST auth/password` | The backend generates a **reset** token (signed with `RESET_SECRET`) and emails the token in a clickable link to the `email` address passed in the request body.<br>Format: `http://.../password/<reset-token>` |
| frontend | `/password/<token>` | The user clicks on the link in the email which opens a new tab in the browser corresponding to the link address. This brings up the **PasswordChange** form. This form (= component) operates in 'reset' mode because it detects a `resetToken` param in the URL. The user enters a new password (twice) and clicks on the **Submit** button. A `PATCH` request is sent to the backend with the new `password` and the `resetToken` passed in the body. |
| backend | `PATCH /auth/password/reset` | The backend extracts the `resetToken` and `password` from the request body and validates the `resetToken`. If valid, it then uses the `id` from the token payload to find the user in the database. Finally, it updates the (hashed) password for the relevant user in the database and sends back an authentication token. |
| frontend | | The frontend save the received authentication token in `localStorage` and dispatches the `resetContent` action to clear any cached content. It subsequently initiates a redirection to the `/content` URL.
| frontend | `/content` | The main content page is displayed with the publication titles matching the user authorization status. |
