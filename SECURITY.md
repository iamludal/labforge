# 🔒 Security policy

## 📦 Supported versions

labforge is in its `0.x` phase: security fixes are only released for the latest published version.

## 🚨 Reporting a vulnerability

**Please do not report security vulnerabilities through public issues, discussions or pull requests.**

Report them privately through GitHub instead:

1. Go to the [Security tab](https://github.com/iamludal/labforge/security) of the repository.
2. Click **Report a vulnerability**.
3. Describe the issue, its impact, and the steps to reproduce it (a minimal lab is ideal).

You will receive an acknowledgment as soon as possible. Once the issue is confirmed, a fix will be prepared and released, and you will be credited in the advisory unless you prefer to stay anonymous.

## 🎯 Scope

Examples of issues in scope:

- HTML or script injection in generated pages from lab content or metadata (cross-site scripting);
- reading or writing files outside the input and output directories during a build;
- path traversal in the dev server.

Out of scope:

- the dev server (`labforge serve`) being reachable from other machines through port forwarding or a proxy: it is designed for local authoring only and listens on `127.0.0.1`;
- vulnerabilities in third-party dependencies that do not affect labforge; please report them upstream.
