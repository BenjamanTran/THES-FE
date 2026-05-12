# Deploy THE_S to GCP (staging)

## What Terraform already created

- VPC, subnets, NAT, firewall rules
- Artifact Registry Docker repo: `the-s-api-staging` (region `asia-southeast1`)
- VM: `the-s-staging-gce-api` (public IP for API + Docker bootstrap)

Use the same GCP project in all steps below.

---

## 1) API (Rails) on the VM

Repositories are **split**: THE_S holds Terraform + Docker Compose; the **API** app lives in its own Git repo.

1. **Cloud Build → Connect repository** (GitHub App) for the **API** repository (not THE_S).
2. **Cloud Build trigger** (example):
   - Branch: `^staging$`
   - Included files: leave empty or `**` (whole API repo).
   - Config: `cloudbuild.staging.yaml` at the **API repo root** (copy from THE_S `api/cloudbuild.staging.yaml`).
3. Grant the **Cloud Build service account** at least:
   - `roles/artifactregistry.writer`
   - For auto-deploy to GCE: IAP SSH + `roles/compute.instanceAdmin.v1` (or narrower) — see `api/README.md`.
4. **On the VM** (SSH via IAP):
   - Create **`/etc/the_s/api-staging.env`** with `RAILS_MASTER_KEY`, `DB_PASSWORD` / `API_DATABASE_PASSWORD`, etc. (Cloud Build deploy no longer requires a script under `/opt/the_s/`.)
   - Run MySQL (e.g. Docker `--network host`) as in `api/README.md`
   - For deploys: set trigger substitutions `_DEPLOY=true`, `_GCE_INSTANCE=the-s-staging-gce-api`, `_GCE_ZONE=asia-southeast1-a` (or run a manual deploy from `api/README.md`).
5. **HTTPS**: add Nginx + Let’s Encrypt on the VM (not in Terraform yet). Until then you can test HTTP on port 80 if you expose the Rails/Thruster port accordingly.

Push to `staging` on the **API** repo → Cloud Build builds the repo-root `Dockerfile` → pushes  
`asia-southeast1-docker.pkg.dev/PROJECT/the-s-api-staging/api:TAG`.

---

## 2) Frontend (Next.js) on Cloud Run

The **FE** app lives in its own Git repo. Copy `fe/cloudbuild.staging.yaml` from THE_S into that repo as `cloudbuild.staging.yaml` at the repo root.

1. **Enable Cloud Run API** (if not already): `run.googleapis.com` (included in Terraform `google_project_service` list when enabled).
2. **Cloud Build trigger** on the **FE** repository:
   - Branch: `^staging$`
   - Included files: leave empty or `**`
   - Config: `cloudbuild.staging.yaml` at the **FE repo root**
3. **Substitutions** in the trigger (important):
   - `_NEXT_PUBLIC_API_URL` = public base URL of your API (e.g. `https://api.example.com` or `http://VM_EXTERNAL_IP` only for quick tests over HTTP).
4. Grant Cloud Build SA **`roles/run.admin`** and **`roles/iam.serviceAccountUser`** on the Cloud Run runtime service account (default compute SA or a dedicated SA).

Push to `staging` on the **FE** repo → build uses repo-root `Dockerfile` (Next `output: 'standalone'`) → image  
`.../the-s-api-staging/fe:TAG` → `gcloud run deploy the-s-fe-staging`.

5. Open the **Cloud Run URL** from the console output; set CORS on the API if the browser calls a different origin.

---

## 3) Quick manual build (without trigger)

With `gcloud` authenticated, run **`gcloud builds submit` from the repository that contains the source** (API or FE), with `cloudbuild.staging.yaml` at that repo’s root:

```bash
export PROJECT_ID=$(gcloud config get-value project)

# From API repo root (after copying the Cloud Build config there)
gcloud builds submit --config=cloudbuild.staging.yaml --substitutions=SHORT_SHA=manual-$(date +%s) .

# From FE repo root
gcloud builds submit --config=cloudbuild.staging.yaml \
  --substitutions=_NEXT_PUBLIC_API_URL=https://YOUR_API_PUBLIC_HOST,SHORT_SHA=manual-$(date +%s) .
```

(`SHORT_SHA` is normally injected by triggers; for manual runs you may need to adjust the YAML or use a trigger.)

To test configs still checked into **THE_S** without copying, you can submit from THE_S with `--config=api/cloudbuild.staging.yaml` only if that path matches a layout that still contains a Dockerfile at the context root (not the typical 3-repo setup).

---

## 4) Checklist

| Item | API | FE |
|------|-----|-----|
| Image registry | `the-s-api-staging` | same repo, image name `fe` |
| Runtime | GCE VM + Docker | Cloud Run |
| Public URL | VM IP / future domain | `*.run.app` |
| Env | `/etc/the_s/api-staging.env` + script | `_NEXT_PUBLIC_API_URL` + Cloud Run env |
