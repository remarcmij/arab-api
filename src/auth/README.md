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
| backend | `POST /password/change` | The backend checks if the user is logged in and receives from the frontend submit the new password and the current, it checks either the current password match and it updates the database with the new password, Lastly it sends back a new authentication token for the frontend. |
| frontend |  | The frontend receives the backend response as a token and it stores it into `localStorage`, then it dispatches the action `resetContent` along with redirection to the main content page with a notification message tells him `password changed`. |
| frontend | `/content` | The main content page is displayed with the publication titles matching the user authorization status. |

## 3. Sign-up / Email Confirmation

### 2.1 Use Case
A registered user can have the benefit of additional features with verified E-mail account, the features are described in the following table. No need for any authentication checks on registration and confirmation.

> Note: a user logged in with Gmail, has a verified account already.

### 2.2 features

| Feature | Description | status |
|---------|-------------|--------|
| Demo Content | Any none logged in or none verified user can view the any none restricted Content | None Verified |
| Access Additional Content | user can ask to grant accessing more content | verified |
| Change Password | the user ability to signin using a new password | verified |
| Personal Avatar | user can have a personal avatar as a profile picture | verified |

### 2.3 Process

| Actor | Path | Action |
|-------|------|--------|
| frontend | `/register` | The user accesses the **Register** form on the client and inserts the required fields. Submitting the request will make a `POST` request. |
| backend | `POST /auth/signup` | The backend run validation checks for the request, then check if the user is already exists and it sends an email to the targeted email address along with a login token to the client as a response. |
| frontend |  | The frontend receives the backend response as a token and it stores it into `localStorage`, then it dispatches the action `LOAD_USER_REQUEST` along with redirection to the welcome page. |
| frontend | `/confirmation/:token` | receives a registered user been redirected from his e-mail inbox, to be confirmed an automatic `POST` request send to the backend along with a confirmation token. |
| backend | `/auth/confirmation` | The backend receives the confirmation token and verifies it, it updates the user's database entry. |

### 4. Expired Confirmation Token

### 2.1 Use Case
A registered logged in user can ask for a new E-mail confirmation token, if the user isn't authenticated a redirect to `login` button will be rendered.

### 2.3 Process

| Actor | Path | Action |
|-------|------|--------|
| frontend | `/confirmation/:token` | receives a registered user been redirected from his e-mail inbox, for the request to be confirmed an automatic `POST` request send to the backend along with the old confirmation token spotted as a param. |
| backend | `/auth/confirmation` | The backend receives the confirmation token and verifies it, And as an expired token it response back with **(401)**. |
| frontend | `/confirmation/:token` | If the user is logged a notification will appear, and `Resend Token` along with `go to content` buttons, clicking the resend button will make a `GET` request as `/token/:tokenString` |
| backend | `GET /token/:tokenString` | The backend run validation checks for the token, sets 2 minutes as an expired time for the new token and e-mails it to the targeted user, responses with a user object. |
