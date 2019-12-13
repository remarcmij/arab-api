# Authentication Processes

## 1. Password reset

### 1.1 Use Case

A registered user want to sign in to the system but has forgotten his password.

### 1.2 Process

| Frontend | Action | Backend | Action |
| -------- | ----------- | ------- | ----------- |
| `/login` | The user accesses the **Sign In** form on the client and clicks the **Forgot your password?** link. This brings up the **Reset Password** form. ||
| `/reset` | The user enter his email address on the **Reset Password** form and presses the **Submit** button. The frontend sends a POST request to the backend: `POST /auth/password`, with the user's email address in the request body.||
||| `auth/password` | The backend generates a **reset** token and emails the token in a clickable link to the email address provided by the user.<br>Format: `<host>/password/<reset-token>`|