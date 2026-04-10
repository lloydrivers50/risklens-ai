# Security Posture

## Secrets Management

- All secrets stored in environment variables, never committed to code
- `.env` files are gitignored — `.env.example` provides the template
- Production secrets managed via environment variables on the VPS
- AWS credentials use IAM roles with least-privilege policies

## Infrastructure Security (VPS)

- SSH access via key-only authentication (password auth disabled)
- UFW firewall — only ports 80, 443, and SSH open
- fail2ban configured for brute-force protection
- Automatic security updates enabled (unattended-upgrades)
- nginx as reverse proxy — application not directly exposed
- SSL/TLS via Let's Encrypt (certbot auto-renewal)

## Application Security

- All API inputs validated via Pydantic schemas — no raw user input reaches business logic
- CORS configured to allow only known frontend origins
- Rate limiting on public endpoints to prevent abuse
- File upload validation — type checking, size limits, malware scanning considerations
- No SQL injection surface — using parameterised queries / ORM

## AWS Security

- IAM policies scoped to minimum required permissions:
  - S3: `PutObject`, `GetObject` on the document bucket only
  - SQS: `SendMessage`, `ReceiveMessage`, `DeleteMessage` on the task queue only
  - CloudWatch: `PutMetricData` only
- S3 bucket policy: no public access, server-side encryption (AES-256)
- SQS: encrypted at rest, no public access
- Pre-signed URLs for document uploads — time-limited, single-use

## CI/CD Security

- GitHub Actions secrets for deployment credentials
- No secrets in workflow files
- Deployment via SSH with dedicated deploy key (not personal key)
- Pipeline fails on security linting issues (bandit for Python)

## Monitoring

- CloudWatch alarms for anomalous patterns (spike in error rate, unusual API usage)
- Application-level logging (structured JSON) — no sensitive data in logs
- Access logs via nginx for audit trail
