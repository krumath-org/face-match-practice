# Integrate an Independent Project with krumath.com

Use this document when integrating any independent web project into KruMath, including games, tools, simulations, learning apps, editors, utilities, experiments, or other feature types.

The project should remain in its own GitHub repository and be deployed independently while using the existing KruMath domain and Supabase infrastructure.

## 1. Core Architecture

The standard architecture is:

```text
Independent GitHub repository
        ↓
Independent Cloudflare Worker
        ↓
krumath.com/<project-slug>
        ↓
Existing KruMath Supabase
        ↓
Existing KruMath authentication
```

Each project is independent, but shares the KruMath platform where appropriate.

### Responsibilities

| Component          | Responsibility                                                          |
| ------------------ | ----------------------------------------------------------------------- |
| Project repository | Project source code, configuration, build, authentication integration   |
| Cloudflare         | Deploy the project Worker and route `krumath.com/<project-slug>*` to it |
| Supabase           | Shared KruMath authentication and any approved project data             |
| KruMath main app   | Main platform, `/home`, `/sign-in`, and platform-level navigation       |
| Project maintainer | Project-specific implementation and deployment                          |

Do not merge the project into the KruMath monorepo unless explicitly requested.

Do not move the project to `learn.krumath.com` unless explicitly requested.

---

## 2. Repository Rules

Keep the project in its own Git repository.

The project repository should contain:

- Application source
- Project-specific configuration
- Build/deployment configuration
- Authentication integration
- Environment variable documentation
- This integration documentation or project-specific implementation notes

Do not modify the KruMath monorepo from the independent project repository unless explicitly requested.

Do not change KruMath's global authentication implementation just to support one project.

---

## 3. URL Structure

Choose a unique kebab-case project slug.

Example:

```text
/project-name
```

The production URL should be:

```text
https://krumath.com/<project-slug>
```

If the project has internal routes, keep them under the project path:

```text
https://krumath.com/<project-slug>
https://krumath.com/<project-slug>/about
https://krumath.com/<project-slug>/settings
```

Make sure static assets, API requests, client-side routing, and redirects work correctly when the project is mounted under a subpath.

Do not assume the project will run at `/`.

---

## 4. Cloudflare Architecture

Each independent project may have its own Cloudflare Worker.

Example:

```text
KruMath main Worker
    ├── /
    ├── /home
    ├── /sign-in
    └── /auth/*

Project Worker A
    └── /project-a/*

Project Worker B
    └── /project-b/*

Project Worker C
    └── /project-c/*
```

Cloudflare should route the project path to the correct Worker:

```text
krumath.com/<project-slug>* → <project-worker>
```

The project Worker should not replace the main KruMath Worker.

Verify that the project route is more specific than the main site route.

---

## 5. Shared Supabase

Use the existing KruMath Supabase project.

Do not create a separate Supabase project for each independent feature unless explicitly required.

Use the existing environment variables appropriate to the project's framework, for example:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
```

or framework-specific public equivalents such as:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

The exact variable names must match the project's actual framework.

Never commit secrets.

Never expose the Supabase `service_role` key in browser/client code.

---

## 6. Authentication

The project should reuse KruMath's existing Supabase Auth.

Do not create a separate account or authentication system.

On production under `krumath.com`, authentication should use the existing KruMath session.

Treat the user as unauthenticated when:

- There is no valid user/session.
- The Supabase user is anonymous (`user.is_anonymous === true`).

For projects that require authentication, block access or the relevant protected actions.

Redirect blocked users to:

```text
/sign-in?returnUrl=/<project-slug>
```

Prefer a relative URL on production so the redirect remains on `krumath.com`.

After successful login, the user should return to the project.

Handle:

- No session
- Anonymous session
- Expired session
- Page refresh
- Logout
- Successful sign-in
- Return URL

Do not rebuild KruMath's sign-in page inside the project.

---

## 7. Authentication Gate Type

Choose the gate according to the project's purpose.

### Hard gate

The entire project requires authentication.

```text
Unauthenticated
    ↓
/sign-in?returnUrl=/project-slug
    ↓
Authenticated
    ↓
Project
```

Use this when the project should not be usable by public users.

### Soft gate

The project can be viewed publicly, but specific functionality requires authentication.

Example:

```text
Public user
    ↓
Project can load
    ↓
Protected action
    ↓
/sign-in?returnUrl=/project-slug
```

Use this only when public access is intentionally part of the product design.

Document which model is used.

---

## 8. Shared Session and Cookies

When the project runs directly under `krumath.com`, it can participate in the existing KruMath authentication session.

Where cross-subdomain sharing is required, use the existing KruMath cookie strategy, including:

```text
domain: ".krumath.com"
path: "/"
sameSite: "lax"
secure: true
```

Do not blindly copy these settings into every framework. Adapt them to the project's actual Supabase/client architecture.

On localhost, shared production cookies may not work across different ports. Provide an appropriate development strategy without weakening production authentication.

---

## 9. Database Access

If the project needs Supabase database functionality:

- Reuse the existing KruMath Supabase project.
- Create project-specific tables when appropriate.
- Use Row Level Security.
- Restrict user-owned records using `auth.uid()`.
- Give the project only the access it actually needs.
- Do not expose unrelated KruMath data.
- Do not bypass RLS from client code.

If the project does not need database functionality, do not add unnecessary database integration.

---

## 10. KruMath Navigation

Where appropriate, provide a simple way to return to KruMath:

```text
https://krumath.com/home
```

A project may also include other approved KruMath navigation such as:

```text
https://krumath.com/pricing
```

and a link to the project's GitHub repository.

Keep the integration UI minimal and consistent with the project.

Do not modify the KruMath home page from the independent project repository.

The KruMath home-page entry should normally be added separately by the KruMath maintainer after the project is deployed and verified.

---

## 11. Project Preservation

First inspect the entire project and understand:

- Framework
- Build system
- Routing
- Static assets
- Client/server architecture
- Authentication model
- Data storage
- Deployment configuration

Then integrate with KruMath.

Do not unnecessarily rewrite, redesign, or replace the existing project.

Preserve the project's:

- Core functionality
- User experience
- Calculations
- Content
- Interactions
- Accessibility
- Performance characteristics

Only change what is necessary for KruMath integration, authentication, localization, deployment, or explicitly requested functionality.

---

## 12. General Integration Process

### Phase A — Project Repository

1. Keep the project in its own Git repository.
2. Choose a unique `/<project-slug>`.
3. Make the project work correctly under that subpath.
4. Add the KruMath authentication integration if required.
5. Add Supabase integration only where needed.
6. Add KruMath navigation where appropriate.
7. Document environment variables.
8. Configure the project for Cloudflare deployment.
9. Test locally as much as possible.

### Phase B — Cloudflare

1. Build the project with the required environment variables.
2. Deploy its independent Cloudflare Worker.
3. Add the route:

```text
krumath.com/<project-slug>* → <project-worker>
```

4. Verify that the main KruMath Worker still handles the rest of the site.
5. Verify assets and routes under the project path.
6. Test authentication and redirects.

### Phase C — KruMath Main Site

Only after the independent project is working:

1. Add the project entry/link to the appropriate KruMath page.
2. Do not change authentication unless there is a documented platform-level requirement.
3. Keep this as a separate KruMath change/PR where possible.

---

## 13. Verification Checklist

### Project

```text
[ ] Independent GitHub repository
[ ] Project works independently
[ ] Correct project slug
[ ] Works under /<project-slug>
[ ] Assets use the correct base path
[ ] Client-side routing works
[ ] Build succeeds
[ ] Cloudflare deployment succeeds
```

### Authentication

```text
[ ] Uses existing KruMath Supabase
[ ] Does not create separate users/accounts
[ ] Unauthenticated behavior is correct
[ ] Anonymous users are handled correctly
[ ] Expired sessions are handled
[ ] Refresh works
[ ] Logout works
[ ] Sign-in redirects correctly
[ ] Return URL works
[ ] No service_role key exposed
```

### Supabase

```text
[ ] Correct KruMath Supabase project
[ ] Environment variables documented
[ ] RLS enabled where database access exists
[ ] User data restricted by auth.uid()
[ ] No unnecessary database access
```

### Cloudflare

```text
[ ] Independent Worker deployed
[ ] Route points to the correct Worker
[ ] Main KruMath Worker remains functional
[ ] Project path does not conflict with another project
[ ] Assets load correctly
[ ] Direct URL access works
[ ] Refreshing internal routes works
```

### KruMath Integration

```text
[ ] Home link works
[ ] Pricing link works if required
[ ] GitHub link works if required
[ ] UI does not interfere with the project
[ ] KruMath home entry added only after deployment is verified
```

---

## 14. Common Mistakes

| Mistake                                                        | Result                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------ |
| Creating a separate Supabase project                           | Separate users/authentication and unnecessary infrastructure |
| Creating a separate authentication system                      | Breaks KruMath SSO                                           |
| Using Firebase Auth for the project session                    | Inconsistent authentication with KruMath                     |
| Exposing `service_role`                                        | Serious security risk                                        |
| Forgetting the `/project-slug` base path                       | Broken assets/routes                                         |
| Hardcoding `/assets/...`                                       | Assets may be served by the wrong Worker                     |
| Allowing anonymous users when authentication is required       | Unauthorized access                                          |
| Editing KruMath monorepo from the feature repo                 | Mixed responsibilities and confusing PRs                     |
| Adding the home link before deployment                         | Dead or broken link                                          |
| Creating overlapping Cloudflare routes                         | Wrong Worker may receive requests                            |
| Assuming every framework uses the same env names               | Build/runtime configuration errors                           |
| Rewriting the entire project for integration                   | Unnecessary risk and regressions                             |
| Adding database tables without RLS                             | Potential data exposure                                      |
| Putting the project under `learn.krumath.com` without approval | Wrong product surface                                        |

---

## 15. What Belongs in the Independent Project

Edit:

- Project source code
- Project configuration
- Routing/base-path configuration
- Authentication integration
- Supabase integration
- Cloudflare deployment configuration
- Environment documentation
- Project-specific UI
- This integration documentation

Do not edit unless explicitly requested:

- KruMath global authentication
- KruMath sign-in implementation
- KruMath middleware
- `apps/learn`
- Unrelated KruMath features
- Firebase phone authentication
- Unrelated database policies
- Unrelated git history

---

## 16. Final Architecture

The intended scalable architecture is:

```text
                    GitHub
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
   Project A      Project B      Project C
      Repo           Repo           Repo
        │             │             │
        ↓             ↓             ↓
   Worker A       Worker B       Worker C
        │             │             │
        └─────────────┼─────────────┘
                      ↓
                 krumath.com
        /project-a /project-b /project-c
                      │
                      ↓
             KruMath Supabase
                      │
              Shared Auth / Data
```

The key principle is:

**Independent projects, independent deployments, one KruMath domain, and one shared Supabase platform.**

Each project remains isolated technically while still feeling like part of KruMath.
