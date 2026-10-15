#!/usr/bin/env bash
# Turns an Apple Pass Type ID certificate into the Vercel env vars the
# /api/pass function needs. Nothing is printed except progress.
#
#   scripts/wallet-env.sh pass.p12 AppleWWDRCAG4.cer pass.com.rowdylaunch.hackday TEAMID1234
#
# pass.p12            the Pass Type ID certificate + private key exported from Keychain Access
# AppleWWDRCAG4.cer   https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer
# pass type id        the identifier you created in the Apple Developer portal
# team id             from the Membership page of the Apple Developer portal
set -euo pipefail
p12=${1:?p12 file}; wwdr=${2:?WWDR cer file}; ptid=${3:?pass type id}; team=${4:?team id}
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
read -rsp "Password for $p12 (empty if none): " p12pass; echo
openssl pkcs12 -in "$p12" -clcerts -nokeys -passin "pass:$p12pass" -legacy -out "$tmp/cert.pem" 2>/dev/null \
  || openssl pkcs12 -in "$p12" -clcerts -nokeys -passin "pass:$p12pass" -out "$tmp/cert.pem"
openssl pkcs12 -in "$p12" -nocerts -nodes -passin "pass:$p12pass" -legacy -out "$tmp/key.pem" 2>/dev/null \
  || openssl pkcs12 -in "$p12" -nocerts -nodes -passin "pass:$p12pass" -out "$tmp/key.pem"
openssl x509 -inform DER -in "$wwdr" -out "$tmp/wwdr.pem" 2>/dev/null || cp "$wwdr" "$tmp/wwdr.pem"
add() { printf '%s' "$2" | vercel env add "$1" production --force >/dev/null && echo "set $1"; }
add PASS_TYPE_ID "$ptid"
add APPLE_TEAM_ID "$team"
add PASS_SIGNER_CERT "$(base64 < "$tmp/cert.pem" | tr -d '\n')"
add PASS_SIGNER_KEY "$(base64 < "$tmp/key.pem" | tr -d '\n')"
add PASS_WWDR_CERT "$(base64 < "$tmp/wwdr.pem" | tr -d '\n')"
echo "Done. Redeploy (git push, or 'vercel redeploy <latest prod url>') and Add to Apple Wallet appears on Apple devices."
