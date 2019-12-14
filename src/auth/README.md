# Authentication Processes

## 1. Reset Password

### 1.1 Use Case

A registered user wants to sign in to the system but has forgotten his password. There is no token in `localStorage`.

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

## 2. Change Password 

### 2.1 Use Case
An authorized registered user wants to change his password. His authentication token is already in `localStorage`.

### 2.2 Process

| Actor | Path | Action |
|-------|------|--------|
| frontend | `/password` | The user accesses the **PasswordChange** form on the client and enters the current and the new password. and submit the request as a `PATCH` request. |
| backend | `POST /password/change` | The backend checks if the user is loggedin and recieves from the frontend submit the new password and the current, it checks either the current password matchs and it updates the database with the new password, Lastly it sends back a new authentication token for the frontend. |
| frontend |  | The frontend recieves the backend response as a token and it stores it into `localStorage`, then it dispatches the action `resetContent` along with redirection to the main content page with a notification message tells him `password changed`. |
| frontend | `/content` | The main content page is displayed with the publication titles matching the user authorization status. |

### 3. Sign-up / Email Confirmation

