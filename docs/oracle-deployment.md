# Oracle Cloud deployment

This deployment runs one Roamly container with a persistent Docker volume and Caddy for automatic HTTPS. Every push to `main` is tested, packaged for ARM64 and AMD64, published to GitHub Container Registry, and deployed over SSH.

## 1. Create the Oracle instance

Create an Always Free Ubuntu instance in your Oracle home region. An Ampere A1 ARM instance is recommended. Assign a reserved public IP so DNS does not change.

In the VCN security list or network security group, allow:

- TCP 22 from your own IP only.
- TCP 80 from the internet.
- TCP 443 from the internet.
- UDP 443 from the internet for HTTP/3; this is optional.

Create a DNS `A` record for the production domain pointing to the reserved IP. The domain must resolve before Caddy can obtain a TLS certificate.

## 2. Bootstrap the host

Copy and run the bootstrap script:

```bash
scp scripts/bootstrap-oracle.sh ubuntu@YOUR_SERVER_IP:/tmp/
ssh ubuntu@YOUR_SERVER_IP
sudo sh /tmp/bootstrap-oracle.sh
exit
```

Sign in again so the new Docker group membership applies:

```bash
ssh ubuntu@YOUR_SERVER_IP
docker version
docker compose version
```

## 3. Create the production environment

On the server, create `/opt/roamly/.env` and restrict access:

```bash
umask 077
cat > /opt/roamly/.env
```

Enter the following, then press `Ctrl-D`:

```env
AUTH_SECRET=<at least 32 random characters>
AUTH_GOOGLE_ID=<production Google OAuth client ID>
AUTH_GOOGLE_SECRET=<production Google OAuth client secret>
AUTH_URL=https://trips.example.com
AUTH_TRUST_HOST=true
ROAMLY_DOMAIN=trips.example.com
ROAMLY_DB_IMPORT_PATH=
```

Generate `AUTH_SECRET` locally with `npx auth secret`. Never store these values in GitHub source control.

If the first deployment should restore a downloaded Roamly JSON backup, upload it to `/opt/roamly/bootstrap/initial.json` and set:

```env
ROAMLY_DB_IMPORT_PATH=/bootstrap/initial.json
```

The import runs only when the persistent volume has no `db.json`. Clear this variable after the first successful deployment.

## 4. Configure Google OAuth

In the Google OAuth web client, configure:

```text
Authorized JavaScript origin:
https://trips.example.com

Authorized redirect URI:
https://trips.example.com/api/auth/callback/google
```

## 5. Configure GitHub

Create a GitHub environment named `production`. Optional required reviewers can prevent an automatic production release until someone approves it.

Add these environment or repository secrets:

| Secret | Value |
| --- | --- |
| `ORACLE_HOST` | Reserved public IP or DNS hostname |
| `ORACLE_USER` | Usually `ubuntu` |
| `ORACLE_SSH_PRIVATE_KEY` | Private deployment key, including BEGIN/END lines |
| `ORACLE_SSH_KNOWN_HOSTS` | Verified SSH host-key line for the server |

Obtain the known-host line from a trusted machine and compare its fingerprint with the instance console before saving it:

```bash
ssh-keyscan -H YOUR_SERVER_IP
```

The GitHub workflow's temporary token authenticates the server to GitHub Container Registry. No permanent registry token is required.

## 6. Deploy

Push or merge into `main`. The CI workflow will:

1. Run lint, type generation, unit coverage, build, and desktop/mobile E2E tests.
2. Build an ARM64 and AMD64 container image.
3. Publish the immutable commit image and `latest` tag to GHCR.
4. Upload the production Compose and Caddy configuration.
5. Copy the current JSON database to `/opt/roamly/backups` when possible.
6. Deploy and wait for the application health check.
7. Roll back to the previous image if health checks fail.

Verify:

```bash
curl https://trips.example.com/api/health
ssh ubuntu@YOUR_SERVER_IP 'cd /opt/roamly && docker compose -f compose.oracle.yaml ps'
```

## Backups and restore

Creators can download scoped JSON backups through Trip Settings. Pre-deployment administrative backups are stored on the host under `/opt/roamly/backups`; copy them off the VM regularly because they share the VM's disk.

To obtain the complete live database:

```bash
container_id=$(docker ps --filter name=roamly-roamly --format '{{.ID}}' | head -n 1)
docker cp "$container_id:/app/data/db.json" ./roamly-full-backup.json
```

Do not run multiple Roamly replicas against this JSON database. Moving to multiple instances requires shared database storage.
