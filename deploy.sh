#!/usr/bin/env bash
set -euo pipefail

# Deploy TalentTrack Portal to Google Cloud Run (asia-southeast1) + Firestore
# Usage: ./deploy.sh [PROJECT_ID] [ADMIN_PASSWORD]

PROJECT_ID="${1:-$(gcloud config get-value project 2>/dev/null || true)}"
ADMIN_PASSWORD="${2:-${ADMIN_PASSWORD:-}}"
REGION="asia-southeast1"
SERVICE_NAME="talenttrack-portal"

if [[ -z "${PROJECT_ID}" || "${PROJECT_ID}" == "(unset)" ]]; then
  echo "Error: No GCP project ID specified."
  echo "Usage: ./deploy.sh <PROJECT_ID> <ADMIN_PASSWORD>"
  exit 1
fi

if [[ -z "${ADMIN_PASSWORD}" ]]; then
  echo "Error: Please pass an ADMIN_PASSWORD as the second argument or env var."
  echo "Usage: ./deploy.sh <PROJECT_ID> <ADMIN_PASSWORD>"
  exit 1
fi

echo "Deploying ${SERVICE_NAME} to project ${PROJECT_ID} in ${REGION}..."

gcloud config set project "${PROJECT_ID}"

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com

# Create default Firestore database in Native mode if it does not exist yet
if ! gcloud firestore databases describe --database="(default)" >/dev/null 2>&1; then
  echo "Creating Firestore (default) database in ${REGION}..."
  gcloud firestore databases create --location="${REGION}" --type=firestore-native
fi

# Build and deploy to Cloud Run from source
gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --region "${REGION}" \
  --allow-unauthenticated \
  --set-env-vars "ADMIN_PASSWORD=${ADMIN_PASSWORD},NEXT_PUBLIC_BRAND_NAME=TalentTrack,NEXT_PUBLIC_BRAND_TAGLINE=Candidate Application Portal"

echo "Deployment complete!"
